/**
 * Health service abstraction for iOS HealthKit and Android Health Connect.
 *
 * Uses platform-specific APIs behind a unified interface.
 * All methods are safe to call on any platform — they gracefully
 * return defaults when health data is unavailable.
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────
export interface HeartRateSample {
  bpm: number;
  timestamp: Date;
}

export interface BodyWeightEntry {
  weight: number; // kg
  date: Date;
}

export interface WorkoutData {
  type: string;
  startDate: Date;
  endDate: Date;
  totalEnergyBurned?: number; // kcal
  avgHeartRate?: number;
  maxHeartRate?: number;
}

export type HRZone = "rest" | "warmup" | "fatburn" | "cardio" | "peak";

export interface HRZoneInfo {
  zone: HRZone;
  label: string;
  color: string;
  min: number;
  max: number;
}

// ─── Constants ────────────────────────────────────────────────────
const HEALTH_ENABLED_KEY = "health_enabled";
const USER_MAX_HR_KEY = "user_max_hr";
const USER_WEIGHT_KEY = "user_body_weight";

/** Default max HR estimate: 220 - age (we use 190 as a sensible default) */
const DEFAULT_MAX_HR = 190;

// ─── HR Zone calculation ──────────────────────────────────────────
export function getHRZones(maxHR: number = DEFAULT_MAX_HR): HRZoneInfo[] {
  return [
    { zone: "rest", label: "Repos", color: "#8E8E93", min: 0, max: Math.round(maxHR * 0.5) },
    { zone: "warmup", label: "Échauffement", color: "#30D158", min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6) },
    { zone: "fatburn", label: "Brûle-graisse", color: "#FFD60A", min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7) },
    { zone: "cardio", label: "Cardio", color: "#FF9F0A", min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.85) },
    { zone: "peak", label: "Peak", color: "#FF453A", min: Math.round(maxHR * 0.85), max: maxHR },
  ];
}

export function getCurrentZone(bpm: number, maxHR: number = DEFAULT_MAX_HR): HRZoneInfo {
  const zones = getHRZones(maxHR);
  for (let i = zones.length - 1; i >= 0; i--) {
    if (bpm >= zones[i].min) return zones[i];
  }
  return zones[0];
}

// ─── Calorie estimation (Keytel et al. formula) ──────────────────
/**
 * Estimate calories burned using heart rate.
 * Uses the Keytel et al. (2005) formula for weight training.
 */
export function estimateCalories(
  avgHR: number,
  durationMinutes: number,
  weightKg: number,
  isMale: boolean = true
): number {
  if (avgHR <= 0 || durationMinutes <= 0 || weightKg <= 0) return 0;

  // Keytel formula
  const cal = isMale
    ? ((-55.0969 + 0.6309 * avgHR + 0.1988 * weightKg + 0.2017 * 25) / 4.184) * durationMinutes
    : ((-20.4022 + 0.4472 * avgHR - 0.1263 * weightKg + 0.074 * 25) / 4.184) * durationMinutes;

  return Math.max(0, Math.round(cal));
}

// ─── Preferences ──────────────────────────────────────────────────
export async function isHealthEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(HEALTH_ENABLED_KEY);
  return val === "true";
}

export async function setHealthEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(HEALTH_ENABLED_KEY, enabled ? "true" : "false");
}

export async function getUserMaxHR(): Promise<number> {
  const val = await AsyncStorage.getItem(USER_MAX_HR_KEY);
  return val ? parseInt(val, 10) : DEFAULT_MAX_HR;
}

export async function setUserMaxHR(hr: number): Promise<void> {
  await AsyncStorage.setItem(USER_MAX_HR_KEY, hr.toString());
}

export async function getUserWeight(): Promise<number | null> {
  const val = await AsyncStorage.getItem(USER_WEIGHT_KEY);
  return val ? parseFloat(val) : null;
}

export async function setUserWeight(kg: number): Promise<void> {
  await AsyncStorage.setItem(USER_WEIGHT_KEY, kg.toString());
}

// ─── Platform-specific health provider ────────────────────────────
interface HealthProvider {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  getHeartRateSamples(startDate: Date, endDate: Date): Promise<HeartRateSample[]>;
  getLatestHeartRate(): Promise<HeartRateSample | null>;
  getBodyWeight(): Promise<number | null>;
  saveBodyWeight(kg: number, date?: Date): Promise<void>;
  saveWorkout(data: WorkoutData): Promise<void>;
}

// ─── iOS HealthKit Provider ───────────────────────────────────────
function createIOSProvider(): HealthProvider {
  // Lazy import to avoid loading on Android
  const HK = require("@kingstinct/react-native-healthkit");

  return {
    async isAvailable() {
      try {
        const available = await HK.isHealthDataAvailable();
        return available;
      } catch {
        return false;
      }
    },

    async requestPermissions() {
      try {
        // Request read & share for relevant types
        await HK.requestAuthorization(
          [
            HK.HKQuantityTypeIdentifier.heartRate,
            HK.HKQuantityTypeIdentifier.bodyMass,
          ],
          [
            HK.HKQuantityTypeIdentifier.bodyMass,
            HK.HKCategoryTypeIdentifier?.appleExerciseTime
              ? HK.HKCategoryTypeIdentifier.appleExerciseTime
              : undefined,
          ].filter(Boolean)
        );
        return true;
      } catch {
        return false;
      }
    },

    async getHeartRateSamples(startDate: Date, endDate: Date) {
      try {
        const results = await HK.queryQuantitySamples(
          HK.HKQuantityTypeIdentifier.heartRate,
          {
            from: startDate,
            to: endDate,
            ascending: false,
            limit: 100,
          }
        );
        return results.map((s: any) => ({
          bpm: Math.round(s.quantity * 60), // HealthKit gives count/s, we need BPM
          timestamp: new Date(s.startDate),
        }));
      } catch {
        return [];
      }
    },

    async getLatestHeartRate() {
      try {
        const now = new Date();
        const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const results = await HK.queryQuantitySamples(
          HK.HKQuantityTypeIdentifier.heartRate,
          {
            from: fiveMinAgo,
            to: now,
            ascending: false,
            limit: 1,
          }
        );
        if (results.length === 0) return null;
        return {
          bpm: Math.round(results[0].quantity * 60),
          timestamp: new Date(results[0].startDate),
        };
      } catch {
        return null;
      }
    },

    async getBodyWeight() {
      try {
        const now = new Date();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const results = await HK.queryQuantitySamples(
          HK.HKQuantityTypeIdentifier.bodyMass,
          {
            from: monthAgo,
            to: now,
            ascending: false,
            limit: 1,
          }
        );
        if (results.length === 0) return null;
        return results[0].quantity; // kg
      } catch {
        return null;
      }
    },

    async saveBodyWeight(kg: number, date?: Date) {
      try {
        await HK.saveQuantitySample(
          HK.HKQuantityTypeIdentifier.bodyMass,
          HK.HKUnits.Kilograms ?? "kg",
          kg,
          { start: date ?? new Date(), end: date ?? new Date() }
        );
      } catch (e) {
        console.warn("[Health] Failed to save body weight:", e);
      }
    },

    async saveWorkout(data: WorkoutData) {
      try {
        // HealthKit workout save via the native API
        const metadata: any = {};
        if (data.avgHeartRate) metadata.HKAverageHeartRate = data.avgHeartRate;

        await HK.saveWorkoutSample(
          {
            type: HK.HKWorkoutActivityType?.traditionalStrengthTraining ?? 13,
            startDate: data.startDate.toISOString(),
            endDate: data.endDate.toISOString(),
            totalEnergyBurned: data.totalEnergyBurned
              ? { unit: "kcal", quantity: data.totalEnergyBurned }
              : undefined,
          }
        );
      } catch (e) {
        console.warn("[Health] Failed to save workout:", e);
      }
    },
  };
}

// ─── Android Health Connect Provider ──────────────────────────────
function createAndroidProvider(): HealthProvider {
  const HC = require("react-native-health-connect");

  return {
    async isAvailable() {
      try {
        const status = await HC.getSdkStatus();
        return status === HC.SdkAvailabilityStatus?.SDK_AVAILABLE;
      } catch {
        return false;
      }
    },

    async requestPermissions() {
      try {
        await HC.requestPermission([
          { accessType: "read", recordType: "HeartRate" },
          { accessType: "read", recordType: "Weight" },
          { accessType: "write", recordType: "Weight" },
          { accessType: "write", recordType: "ExerciseSession" },
        ]);
        return true;
      } catch {
        return false;
      }
    },

    async getHeartRateSamples(startDate: Date, endDate: Date) {
      try {
        const result = await HC.readRecords("HeartRate", {
          timeRangeFilter: {
            operator: "between",
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });
        const samples: HeartRateSample[] = [];
        for (const record of result.records ?? result) {
          for (const sample of record.samples ?? []) {
            samples.push({
              bpm: sample.beatsPerMinute,
              timestamp: new Date(sample.time),
            });
          }
        }
        return samples;
      } catch {
        return [];
      }
    },

    async getLatestHeartRate() {
      try {
        const now = new Date();
        const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const samples = await this.getHeartRateSamples(fiveMinAgo, now);
        if (samples.length === 0) return null;
        return samples[samples.length - 1];
      } catch {
        return null;
      }
    },

    async getBodyWeight() {
      try {
        const now = new Date();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const result = await HC.readRecords("Weight", {
          timeRangeFilter: {
            operator: "between",
            startTime: monthAgo.toISOString(),
            endTime: now.toISOString(),
          },
        });
        const records = result.records ?? result;
        if (records.length === 0) return null;
        return records[records.length - 1].weight?.inKilograms ?? null;
      } catch {
        return null;
      }
    },

    async saveBodyWeight(kg: number, date?: Date) {
      try {
        await HC.insertRecords([
          {
            recordType: "Weight",
            time: (date ?? new Date()).toISOString(),
            weight: { unit: "kilograms", value: kg },
          },
        ]);
      } catch (e) {
        console.warn("[Health] Failed to save body weight:", e);
      }
    },

    async saveWorkout(data: WorkoutData) {
      try {
        await HC.insertRecords([
          {
            recordType: "ExerciseSession",
            exerciseType: 80, // STRENGTH_TRAINING
            startTime: data.startDate.toISOString(),
            endTime: data.endDate.toISOString(),
            title: data.type,
          },
        ]);
      } catch (e) {
        console.warn("[Health] Failed to save workout:", e);
      }
    },
  };
}

// ─── Null provider (fallback) ─────────────────────────────────────
function createNullProvider(): HealthProvider {
  return {
    async isAvailable() { return false; },
    async requestPermissions() { return false; },
    async getHeartRateSamples() { return []; },
    async getLatestHeartRate() { return null; },
    async getBodyWeight() { return null; },
    async saveBodyWeight() {},
    async saveWorkout() {},
  };
}

// ─── Singleton ────────────────────────────────────────────────────
let _provider: HealthProvider | null = null;

export function getHealthProvider(): HealthProvider {
  if (_provider) return _provider;

  if (Platform.OS === "ios") {
    try {
      _provider = createIOSProvider();
    } catch {
      _provider = createNullProvider();
    }
  } else if (Platform.OS === "android") {
    try {
      _provider = createAndroidProvider();
    } catch {
      _provider = createNullProvider();
    }
  } else {
    _provider = createNullProvider();
  }

  return _provider;
}

/**
 * Initialize health: check availability, request permissions if needed.
 * When `skipEnabledCheck` is true, don't check the AsyncStorage flag
 * (used during the toggle-on flow before the flag is persisted).
 * Returns true if health data is accessible.
 */
export async function initHealth(skipEnabledCheck = false): Promise<boolean> {
  if (!skipEnabledCheck) {
    const enabled = await isHealthEnabled();
    if (!enabled) return false;
  }

  const provider = getHealthProvider();
  const available = await provider.isAvailable();
  if (!available) return false;

  return await provider.requestPermissions();
}

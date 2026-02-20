import { TextInput, type TextInputProps } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface InputProps extends TextInputProps {
  className?: string;
}

export function Input({ className = "", ...props }: InputProps) {
  const { colors } = useTheme();

  return (
    <TextInput
      placeholderTextColor={colors.textTertiary}
      className={`h-input bg-fill rounded-2xl px-4 text-textPrimary ${className}`}
      {...props}
    />
  );
}

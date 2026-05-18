import { Pressable, Text, View } from "react-native";
import { Minus, Plus } from "lucide-react-native";

interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  name: string;
}

export const QuantityStepper = ({
  quantity,
  onIncrement,
  onDecrement,
  name,
}: QuantityStepperProps) => {
  return (
    <View className="flex-row items-center gap-2 bg-[#0A0A0A] rounded-full border border-[#2A2A2A] px-1 py-1">
      <Pressable
        className="w-8 h-8 rounded-full bg-[#1A1A1A] items-center justify-center active:opacity-70"
        hitSlop={6}
        accessibilityLabel={`Decrease quantity of ${name}`}
        accessibilityRole="button"
        onPress={onDecrement}
      >
        <Minus size={14} color="#FFFFFF" />
      </Pressable>

      <Text
        className="text-white font-bold text-sm min-w-[20px] text-center"
        accessibilityLiveRegion="polite"
      >
        {quantity}
      </Text>

      <Pressable
        className="w-8 h-8 rounded-full bg-[#FF6B35] items-center justify-center active:opacity-80"
        hitSlop={6}
        accessibilityLabel={`Increase quantity of ${name}`}
        accessibilityRole="button"
        onPress={onIncrement}
      >
        <Plus size={14} color="#FFFFFF" />
      </Pressable>
    </View>
  );
};

import { Pressable, Text, View } from "react-native";

interface CartSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
  onCheckout: () => void;
}

export const CartSummary = ({
  subtotal,
  tax,
  total,
  onCheckout,
}: CartSummaryProps) => {
  return (
    <View className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-4 gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-[#9CA3AF] text-sm">Subtotal</Text>
        <Text className="text-white font-semibold text-sm">
          ${subtotal.toFixed(2)}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-[#9CA3AF] text-sm">Tax (8.5%)</Text>
        <Text className="text-white font-semibold text-sm">
          ${tax.toFixed(2)}
        </Text>
      </View>

      <View className="h-px bg-[#2A2A2A] my-1" />

      <View className="flex-row items-end justify-between">
        <Text className="text-white font-bold text-base">Total</Text>
        <Text className="text-[#FF6B35] font-bold text-2xl tracking-tight">
          ${total.toFixed(2)}
        </Text>
      </View>

      <Pressable
        className="w-full flex-row items-center justify-center gap-2 py-4 rounded-full bg-[#FF6B35] active:opacity-80"
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Checkout, total $${total.toFixed(2)}`}
        onPress={onCheckout}
      >
        <Text className="text-white font-bold text-base tracking-tight">
          Checkout
        </Text>
      </Pressable>
    </View>
  );
};

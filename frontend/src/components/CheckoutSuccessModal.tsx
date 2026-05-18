import { Modal, Pressable, Text, View } from "react-native";
import { CheckCircle2 } from "lucide-react-native";

interface CheckoutSuccessModalProps {
  visible: boolean;
  total: number;
  itemCount: number;
  etaMinutes: number;
  onDismiss: () => void;
}

export const CheckoutSuccessModal = ({
  visible,
  total,
  itemCount,
  etaMinutes,
  onDismiss,
}: CheckoutSuccessModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <View className="w-full max-w-[420px] bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-6 gap-4 items-center">
          <View className="w-16 h-16 rounded-full bg-[#FF6B35]/15 items-center justify-center border border-[#FF6B35]/40">
            <CheckCircle2 size={36} color="#FF6B35" />
          </View>

          <View className="gap-1 items-center">
            <Text className="text-[#FF6B35] text-[10px] font-semibold tracking-[3px]">
              ORDER CONFIRMED
            </Text>
            <Text className="text-white font-bold text-2xl tracking-tight text-center">
              Thanks for your order!
            </Text>
            <Text className="text-[#9CA3AF] text-sm text-center leading-5">
              We're prepping your food now. Estimated ready in ~{etaMinutes} min.
            </Text>
          </View>

          <View className="w-full bg-[#0A0A0A] rounded-2xl border border-[#2A2A2A] p-4 gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-[#9CA3AF] text-sm">Items</Text>
              <Text className="text-white font-semibold text-sm">
                {itemCount}
              </Text>
            </View>
            <View className="h-px bg-[#2A2A2A]" />
            <View className="flex-row items-end justify-between">
              <Text className="text-white font-bold text-base">Total paid</Text>
              <Text className="text-[#FF6B35] font-bold text-2xl tracking-tight">
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onDismiss}
            className="w-full py-4 rounded-full bg-[#FF6B35] active:opacity-80 items-center"
            accessibilityRole="button"
            accessibilityLabel="Back to menu"
          >
            <Text className="text-white font-bold text-base tracking-tight">
              Back to menu
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

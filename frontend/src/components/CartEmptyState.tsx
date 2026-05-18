import { Pressable, Text, View } from "react-native";
import { ShoppingBag } from "lucide-react-native";

interface CartEmptyStateProps {
  onBrowse: () => void;
}

export const CartEmptyState = ({ onBrowse }: CartEmptyStateProps) => {
  return (
    <View className="flex-1 items-center justify-center px-8 py-24 gap-4">
      <View className="w-24 h-24 rounded-full bg-[#1A1A1A] items-center justify-center border border-[#2A2A2A]">
        <ShoppingBag size={40} color="#9CA3AF" />
      </View>

      <Text className="text-white font-bold text-xl text-center">
        Your cart is empty
      </Text>

      <Text className="text-[#9CA3AF] text-sm text-center leading-5 max-w-[260px]">
        Add some delicious items from the menu and they'll show up here.
      </Text>

      <Pressable
        className="mt-2 px-6 py-3 rounded-full bg-[#FF6B35] active:opacity-80"
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Browse menu"
        onPress={onBrowse}
      >
        <Text className="text-white font-bold text-sm">Browse Menu</Text>
      </Pressable>
    </View>
  );
};

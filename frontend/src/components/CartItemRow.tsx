import { Image, Pressable, Text, View } from "react-native";
import { Trash2 } from "lucide-react-native";
import type { CartItem } from "../types";
import { useCartStore } from "../store/cartStore";
import { QuantityStepper } from "./QuantityStepper";

interface CartItemRowProps {
  item: CartItem;
}

export const CartItemRow = ({ item }: CartItemRowProps) => {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const handleInc = () => updateQuantity(item.id, item.quantity + 1);
  const handleDec = () => {
    if (item.quantity <= 1) removeItem(item.id);
    else updateQuantity(item.id, item.quantity - 1);
  };
  const handleRemove = () => removeItem(item.id);

  return (
    <View className="flex-row items-center gap-3 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-3">
      <Image
        source={{ uri: item.image }}
        className="w-20 h-20 rounded-xl bg-[#2A2A2A]"
        resizeMode="cover"
        accessible
        accessibilityLabel={item.name}
      />

      <View className="flex-1 gap-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text
            className="text-white font-bold text-base flex-1"
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Pressable
            className="w-8 h-8 rounded-full items-center justify-center active:opacity-60"
            hitSlop={8}
            accessibilityLabel={`Remove ${item.name} from cart`}
            accessibilityRole="button"
            onPress={handleRemove}
          >
            <Trash2 size={16} color="#9CA3AF" />
          </Pressable>
        </View>

        <Text className="text-[#9CA3AF] text-sm">
          ${item.price.toFixed(2)} each
        </Text>

        <View className="flex-row items-center justify-between pt-1">
          <Text className="text-[#FF6B35] font-bold text-base">
            ${(item.price * item.quantity).toFixed(2)}
          </Text>
          <QuantityStepper
            quantity={item.quantity}
            onIncrement={handleInc}
            onDecrement={handleDec}
            name={item.name}
          />
        </View>
      </View>
    </View>
  );
};

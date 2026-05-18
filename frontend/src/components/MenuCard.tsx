import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Check, Plus } from "lucide-react-native";
import type { MenuItem } from "../types";
import { useCartStore } from "../store/cartStore";

interface MenuCardProps {
  item: MenuItem;
}

export const MenuCard = ({ item }: MenuCardProps) => {
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    addItem(item);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
  };

  return (
    <View className="bg-[#1A1A1A] rounded-2xl overflow-hidden border border-[#2A2A2A]">
      <Image
        source={{ uri: item.image }}
        className="w-full h-48 bg-[#2A2A2A]"
        resizeMode="cover"
        accessible
        accessibilityLabel={item.name}
      />
      <View className="p-4 gap-2">
        <Text
          className="text-white font-bold text-lg"
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          className="text-[#9CA3AF] text-sm leading-5"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.description}
        </Text>
        <View className="flex-row items-center justify-between pt-2">
          <Text className="text-[#FF6B35] font-bold text-xl">
            ${item.price.toFixed(2)}
          </Text>
          <Pressable
            onPress={handleAdd}
            hitSlop={8}
            accessibilityLabel={`Add ${item.name} to cart`}
            accessibilityRole="button"
            className="flex-row items-center gap-1 px-5 py-2.5 rounded-full bg-[#FF6B35] active:opacity-80"
          >
            {justAdded ? (
              <Check size={16} color="#FFFFFF" />
            ) : (
              <Plus size={16} color="#FFFFFF" />
            )}
            <Text className="text-white font-bold text-sm">
              {justAdded ? "Added" : "Add"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

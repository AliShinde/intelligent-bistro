import { Text, View } from "react-native";
import { UtensilsCrossed } from "lucide-react-native";

interface EmptyStateProps {
  category: string;
}

export const EmptyState = ({ category }: EmptyStateProps) => {
  return (
    <View className="flex-1 items-center justify-center px-8 py-20 gap-3">
      <View className="w-16 h-16 rounded-full bg-[#1A1A1A] items-center justify-center border border-[#2A2A2A]">
        <UtensilsCrossed size={28} color="#9CA3AF" />
      </View>
      <Text className="text-white font-bold text-lg text-center">
        Nothing here yet
      </Text>
      <Text className="text-[#9CA3AF] text-sm text-center leading-5">
        No items in {category}. Try another category.
      </Text>
    </View>
  );
};

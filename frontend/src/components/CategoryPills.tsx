import { Pressable, ScrollView, Text } from "react-native";

interface CategoryPillsProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

const toTitleCase = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const CategoryPills = ({
  categories,
  selected,
  onSelect,
}: CategoryPillsProps) => {
  const allCategories = ["All", ...categories];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 gap-2"
    >
      {allCategories.map((cat) => {
        const isActive = selected === cat;
        return (
          <Pressable
            key={cat}
            onPress={() => onSelect(cat)}
            hitSlop={6}
            accessibilityLabel={`Filter by ${cat}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            className={
              isActive
                ? "px-4 py-2 rounded-full bg-[#FF6B35]"
                : "px-4 py-2 rounded-full bg-[#1A1A1A] border border-[#2A2A2A]"
            }
          >
            <Text
              className={
                isActive
                  ? "text-white font-semibold text-sm"
                  : "text-[#9CA3AF] font-medium text-sm"
              }
            >
              {toTitleCase(cat)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

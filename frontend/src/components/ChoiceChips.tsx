import { Pressable, Text, View } from "react-native";

interface Choice { id: string; name: string; }

interface ChoiceChipsProps {
  choices: Choice[];
  resolved: boolean;
  onChoose: (choice: Choice) => void;
}

export const ChoiceChips = ({ choices, resolved, onChoose }: ChoiceChipsProps) => {
  return (
    <View className="flex-row flex-wrap gap-2 self-start mt-1 mb-2 ml-1">
      {choices.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => onChoose(c)}
          disabled={resolved}
          accessibilityLabel={`Choose ${c.name}`}
          accessibilityRole="button"
          className={`px-3 py-1.5 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] active:opacity-70 ${resolved ? "opacity-50" : ""}`}
        >
          <Text className="text-[#FF6B35] text-xs font-semibold">{c.name}</Text>
        </Pressable>
      ))}
    </View>
  );
};

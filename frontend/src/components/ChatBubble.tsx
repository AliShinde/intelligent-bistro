import { Text, View } from "react-native";

interface ChatBubbleProps {
  role: "user" | "assistant";
  text: string;
}

export const ChatBubble = ({ role, text }: ChatBubbleProps) => {
  const isUser = role === "user";
  return (
    <View
      className={`max-w-[80%] my-1 px-3 py-2 rounded-2xl ${
        isUser
          ? "self-end bg-[#FF6B35] rounded-br-md"
          : "self-start bg-[#1A1A1A] rounded-bl-md"
      }`}
    >
      <Text className="text-white text-sm leading-5">{text}</Text>
    </View>
  );
};

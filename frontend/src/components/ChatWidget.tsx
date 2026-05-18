import { useState, useRef, useEffect } from "react";
import { ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from "react-native";
import { MessageCircle, Send, X } from "lucide-react-native";
import { ChatBubble } from "./ChatBubble";
import { ChoiceChips } from "./ChoiceChips";
import { useCartStore } from "../store/cartStore";
import { MENU_ITEMS } from "../constants/menu";
import type { CartItem } from "../types";

interface ChatChoice { id: string; name: string; }
interface PendingAction { action: "add" | "remove" | "update"; quantity?: number; }
interface ActionStep {
  action: "add" | "remove" | "update" | "clear" | "none";
  item?: string;
  quantity?: number;
  choices?: ChatChoice[];
  pendingAction?: PendingAction;
  resolved?: boolean;
}
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  steps?: ActionStep[];
}
interface ChatResponse { steps: ActionStep[]; response: string }
interface SingleAction {
  action: "add" | "remove" | "update" | "clear" | "none";
  item?: string;
  quantity?: number;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";
const GREETING: ChatMessage = {
  id: "greet",
  role: "assistant",
  text:
    "Hi! Here's what I can do:\n" +
    "• Add — \"add two buffalo wings\"\n" +
    "• Remove — \"remove the fries\"\n" +
    "• Update — \"change wings to 5\"\n" +
    "• Ask — \"what's in the loaded potato skins?\"\n\n" +
    "You can combine items with \"and\" or commas in one message.",
};

export const ChatWidget = () => {
  const { width } = useWindowDimensions();
  const isNarrow = width < 720;
  const panelWidth = isNarrow ? Math.round(width * 0.85) : Math.min(Math.round(width * 0.45), 520);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const scrollRef = useRef<ScrollView>(null);
  const translateX = useRef(new Animated.Value(panelWidth)).current;

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clear);

  useEffect(() => {
    Animated.timing(translateX, { toValue: open ? 0 : panelWidth, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [open, panelWidth, translateX]);

  useEffect(() => { if (open) scrollRef.current?.scrollToEnd({ animated: true }); }, [messages, open]);

  const applyAction = (a: SingleAction, cart: CartItem[]) => {
    if (a.action === "none") return;
    if (a.action === "clear") { clearCart(); return; }
    if (!a.item) return;
    const menuItem = MENU_ITEMS.find((m) => m.id === a.item);
    if (!menuItem) return;
    const qty = a.quantity ?? 1;
    if (a.action === "add") for (let i = 0; i < qty; i++) addItem(menuItem);
    else if (a.action === "remove") removeItem(menuItem.id);
    else if (a.action === "update") {
      if (qty <= 0) removeItem(menuItem.id);
      else if (cart.find((c) => c.id === menuItem.id)) updateQuantity(menuItem.id, qty);
      else for (let i = 0; i < qty; i++) addItem(menuItem);
    }
  };

  const verbResponse = (action: PendingAction["action"], name: string, qty?: number): string => {
    if (action === "remove") return `Removed ${name} from your cart.`;
    if (action === "update") return `Updated ${name}${qty ? ` to ${qty}` : ""}.`;
    if (qty && qty > 1) return `Added ${qty} ${name} to your cart.`;
    return `Added ${name} to your cart.`;
  };

  const handleChoose = (messageId: string, stepIdx: number, choice: ChatChoice) => {
    const msg = messages.find((m) => m.id === messageId);
    const step = msg?.steps?.[stepIdx];
    if (!step || !step.pendingAction || step.resolved) return;
    const pa = step.pendingAction;
    applyAction({ action: pa.action, item: choice.id, quantity: pa.quantity }, items);
    setMessages((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== messageId || !m.steps) return m;
        const nextSteps = m.steps.map((s, i) => (i === stepIdx ? { ...s, resolved: true } : s));
        return { ...m, steps: nextSteps };
      });
      return [...updated, { id: `a-${Date.now()}-${stepIdx}`, role: "assistant", text: verbResponse(pa.action, choice.name, pa.quantity) }];
    });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text }]);
    try {
      const r = await fetch(`${API_URL}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, cart: items }) });
      const data = (await r.json()) as ChatResponse | { error: { message: string } };
      if (!r.ok || "error" in data) {
        setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text: "We encountered an error" }]);
      } else {
        const stepsForState: ActionStep[] = data.steps.map((s) => {
          if (s.choices?.length && s.pendingAction) return { ...s, resolved: false };
          applyAction({ action: s.action, item: s.item, quantity: s.quantity }, items);
          return { ...s, resolved: true };
        });
        setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text: data.response, steps: stepsForState }]);
      }
    } catch {
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text: "We encountered an error" }]);
    } finally { setSending(false); }
  };

  return (
    <>
      {!open && (
        <Pressable onPress={() => setOpen(true)} accessibilityLabel="Open chat assistant" accessibilityRole="button"
          className="absolute bottom-6 right-5 w-14 h-14 rounded-full bg-[#FF6B35] items-center justify-center active:opacity-80 shadow-lg">
          <MessageCircle size={26} color="#FFFFFF" />
        </Pressable>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 flex-row">
          <Pressable onPress={() => setOpen(false)} className="flex-1 bg-black/50" accessibilityLabel="Close chat" />
          <Animated.View style={{ width: panelWidth, transform: [{ translateX }], backgroundColor: "#0A0A0A" }} className="h-full border-l border-[#2A2A2A]">
            <View className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FF6B35]" />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-[#0A0A0A]">
              <View className="px-6 pt-7 pb-4 border-b border-[#2A2A2A] flex-row items-start justify-between">
                <View>
                  <Text className="text-[#FF6B35] text-[10px] font-semibold tracking-[3px] mb-1">ASSISTANT</Text>
                  <Text className="text-white font-bold text-xl tracking-tight">Order with words.</Text>
                  <Text className="text-[#9CA3AF] text-xs mt-1">Type naturally — I'll update your cart.</Text>
                </View>
                <Pressable onPress={() => setOpen(false)} accessibilityLabel="Close chat"
                  className="w-9 h-9 rounded-full bg-[#1A1A1A] items-center justify-center active:opacity-70">
                  <X size={18} color="#FFFFFF" />
                </Pressable>
              </View>

              <ScrollView ref={scrollRef} className="flex-1" contentContainerClassName="px-5 py-4" showsVerticalScrollIndicator={false}>
                {messages.map((m) => (
                  <View key={m.id}>
                    <ChatBubble role={m.role} text={m.text} />
                    {m.steps?.map((s, i) =>
                      s.choices?.length && s.pendingAction ? (
                        <ChoiceChips
                          key={`${m.id}#${i}`}
                          choices={s.choices}
                          resolved={!!s.resolved}
                          onChoose={(c) => handleChoose(m.id, i, c)}
                        />
                      ) : null
                    )}
                  </View>
                ))}
                {sending && (
                  <View className="self-start my-1 px-3 py-2 rounded-2xl bg-[#1A1A1A]">
                    <ActivityIndicator color="#FF6B35" size="small" />
                  </View>
                )}
              </ScrollView>

              <View className="flex-row items-center gap-2 px-5 pt-3 pb-5 border-t border-[#2A2A2A]">
                <TextInput value={input} onChangeText={setInput} onSubmitEditing={send} editable={!sending} returnKeyType="send"
                  placeholder="Add, remove, or ask…" placeholderTextColor="#9CA3AF"
                  className="flex-1 px-4 py-3 rounded-full bg-[#1A1A1A] text-white text-sm border border-[#2A2A2A]" />
                <Pressable onPress={send} disabled={sending || !input.trim()} accessibilityLabel="Send message"
                  className={`w-12 h-12 rounded-full items-center justify-center ${sending || !input.trim() ? "bg-[#2A2A2A]" : "bg-[#FF6B35] active:opacity-80"}`}>
                  <Send size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

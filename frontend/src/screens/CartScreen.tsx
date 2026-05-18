import { useMemo, useState } from "react";
import { Alert, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useCartStore } from "../store/cartStore";
import { Header } from "../components/Header";
import { CartItemRow } from "../components/CartItemRow";
import { CartSummary } from "../components/CartSummary";
import { CartEmptyState } from "../components/CartEmptyState";
import { CheckoutSuccessModal } from "../components/CheckoutSuccessModal";
import type { CartItem } from "../types";

export const CartScreen = () => {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);

  const [success, setSuccess] = useState<{ total: number; itemCount: number } | null>(null);

  const { subtotal, tax, total } = useMemo(() => {
    const sub = items.reduce((sum: number, i: CartItem) => sum + i.price * i.quantity, 0);
    const t = sub * 0.085;
    return { subtotal: sub, tax: t, total: sub + t };
  }, [items]);

  const handleClear = () => {
    Alert.alert("Clear cart?", "This will remove all items.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clear },
    ]);
  };

  const handleCheckout = () => {
    const itemCount = items.reduce((n, i) => n + i.quantity, 0);
    setSuccess({ total, itemCount });
  };

  const handleDismissSuccess = () => {
    setSuccess(null);
    clear();
    router.replace("/");
  };

  if (items.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 bg-[#0A0A0A]"
        style={Platform.OS === "web" ? ({ height: "100vh" } as object) : undefined}
      >
        <View className="bg-[#0A0A0A] border-b border-[#2A2A2A]">
          <Header />
        </View>
        <CartEmptyState onBrowse={() => router.replace("/")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-[#0A0A0A]"
      style={Platform.OS === "web" ? ({ height: "100vh" } as object) : undefined}
    >
      <View className="bg-[#0A0A0A] border-b border-[#2A2A2A]">
        <Header />
      </View>

      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Text className="text-white font-bold text-2xl tracking-tight">
          Your Cart
        </Text>
        <Pressable
          onPress={handleClear}
          className="px-3 py-1.5 rounded-full active:opacity-60"
          accessibilityLabel="Clear cart"
          accessibilityRole="button"
        >
          <Text className="text-[#9CA3AF] font-semibold text-sm">Clear</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pt-2 pb-44 gap-3"
        className="flex-1"
        style={{ flex: 1, minHeight: 0 }}
      >
        {items.map((item: CartItem) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#2A2A2A] px-4 pt-3 pb-6">
        <CartSummary
          subtotal={subtotal}
          tax={tax}
          total={total}
          onCheckout={handleCheckout}
        />
      </View>

      <CheckoutSuccessModal
        visible={success !== null}
        total={success?.total ?? 0}
        itemCount={success?.itemCount ?? 0}
        etaMinutes={25}
        onDismiss={handleDismissSuccess}
      />
    </SafeAreaView>
  );
};

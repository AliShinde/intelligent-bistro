import { Platform, Pressable, StatusBar, Text, View } from "react-native";
import { ArrowLeft, ShoppingCart } from "lucide-react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCartStore } from "../store/cartStore";

export const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const androidStatusBar = Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 0;
  const topPad = Math.max(insets.top, androidStatusBar);
  const count = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  );

  const isCart = pathname === "/cart";

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <View className="flex-row items-center justify-between px-4 pb-3" style={{ paddingTop: topPad }}>
      <View className="flex-row items-center gap-2">
        {isCart && (
          <Pressable
            onPress={handleBack}
            className="w-9 h-9 rounded-full bg-[#1A1A1A] items-center justify-center active:opacity-70 mr-1"
            hitSlop={8}
            accessibilityLabel="Back to menu"
            accessibilityRole="button"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>
        )}
        <View className="w-8 h-8 rounded-full bg-[#FF6B35] items-center justify-center">
          <Text className="text-white font-bold text-base">B</Text>
        </View>
        <Text className="text-white font-bold text-xl tracking-tight">
          The Intelligent Bistro
        </Text>
      </View>

      {!isCart && (
        <Pressable
          onPress={() => router.push("/cart")}
          className="relative w-11 h-11 rounded-full bg-[#1A1A1A] items-center justify-center active:opacity-70"
          hitSlop={8}
          accessibilityLabel={`Open cart, ${count} items`}
          accessibilityRole="button"
        >
          <ShoppingCart size={22} color="#FFFFFF" />
          {count > 0 && (
            <View className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#FF6B35] items-center justify-center border-2 border-[#0A0A0A]">
              <Text className="text-white text-[10px] font-bold">
                {count > 99 ? "99+" : count}
              </Text>
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
};

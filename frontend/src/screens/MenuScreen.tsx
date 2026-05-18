import { useState } from "react";
import { Platform, SafeAreaView, ScrollView, View } from "react-native";
import { Header } from "../components/Header";
import { CategoryPills } from "../components/CategoryPills";
import { MenuCard } from "../components/MenuCard";
import { EmptyState } from "../components/EmptyState";
import { MENU_ITEMS, CATEGORIES } from "../constants/menu";
import type { MenuItem } from "../types";

export const MenuScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredItems: MenuItem[] =
    selectedCategory === "All"
      ? MENU_ITEMS
      : MENU_ITEMS.filter((i) => i.category === selectedCategory);

  return (
    <SafeAreaView
      className="flex-1 bg-[#0A0A0A]"
      style={Platform.OS === "web" ? ({ height: "100vh" } as object) : undefined}
    >
      <View className="bg-[#0A0A0A] border-b border-[#2A2A2A]">
        <Header />
      </View>
      <View className="bg-[#0A0A0A] pt-3 pb-2">
        <CategoryPills
          categories={CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pt-2 pb-24 gap-4"
        className="flex-1"
        style={{ flex: 1, minHeight: 0 }}
      >
        {filteredItems.length === 0 ? (
          <EmptyState category={selectedCategory} />
        ) : (
          filteredItems.map((item) => <MenuCard key={item.id} item={item} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

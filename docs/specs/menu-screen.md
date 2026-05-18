# Menu Screen Spec

## 1. Screen Purpose & User Flow

The Menu Screen is the default landing tab. Users:
1. See a sticky branded header with a cart icon + live item-count badge.
2. Scroll a horizontal row of category pills to filter the menu (default: "All").
3. Browse a vertical list of appetizing MenuCards (image, name, description, price, Add button).
4. Tap "Add" on any card → `cartStore.addItem(menuItem)` fires, badge increments, button gives a brief visual confirmation.
5. Tap the header cart icon → navigates to the Cart tab.

---

## 2. Component File Plan (all NAMED exports)

Create under `frontend/src/`:

| File | Responsibility |
|---|---|
| `screens/MenuScreen.tsx` | Top-level screen, holds `selectedCategory` local state, owns FlatList. |
| `components/Header.tsx` | Brand title + cart icon w/ badge. Reused across screens. |
| `components/CategoryPills.tsx` | Horizontal ScrollView of pill buttons. Props: `categories`, `selected`, `onSelect`. |
| `components/MenuCard.tsx` | Single menu item card. Props: `item: MenuItem`. Calls `addItem` internally from `cartStore`. |
| `components/MenuCardSkeleton.tsx` | Shimmer placeholder while loading. |
| `components/EmptyState.tsx` | Shown when filtered list is empty. |

Mock data lives in `frontend/src/constants/menu.ts` as `MENU_ITEMS: MenuItem[]`.

---

## 3. Layout Tree (with exact NativeWind classes)

```
SafeAreaView                  className="flex-1 bg-[#0A0A0A]"
└─ View (sticky header wrap)  className="bg-[#0A0A0A] border-b border-[#2A2A2A]"
   └─ <Header />
└─ View (filter wrap)         className="bg-[#0A0A0A] pt-3 pb-2"
   └─ <CategoryPills />
└─ FlatList                   className="flex-1"
   contentContainerClassName="px-4 pt-2 pb-24 gap-4"
   ItemSeparatorComponent    none (gap-4 handles it)
   renderItem → <MenuCard item={item} />
   ListEmptyComponent        <EmptyState />
```

---

## 4. Header (`components/Header.tsx`)

```
View   className="flex-row items-center justify-between px-4 py-3"
├─ View (brand)          className="flex-row items-center gap-2"
│  ├─ View (logo dot)    className="w-8 h-8 rounded-full bg-[#FF6B35] items-center justify-center"
│  │  └─ Text            className="text-white font-bold text-base"  // "V"
│  └─ Text (wordmark)    className="text-white font-bold text-xl tracking-tight"  // "Viridian"
└─ Pressable (cart btn)  className="relative w-11 h-11 rounded-full bg-[#1A1A1A] items-center justify-center active:opacity-70"
   hitSlop={8}
   accessibilityLabel="Open cart"
   ├─ Ionicons name="cart-outline" size={22} color="#FFFFFF"
   └─ View (badge, only if count > 0)
      className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#FF6B35] items-center justify-center border-2 border-[#0A0A0A]"
      └─ Text  className="text-white text-[10px] font-bold"  // {count > 99 ? "99+" : count}
```

Cart count via `useCartStore((s) => s.items.reduce((n,i)=>n+i.quantity,0))`.

---

## 5. CategoryPills (`components/CategoryPills.tsx`)

Categories: `["All", "Burgers", "Sides", "Drinks", "Desserts"]`.

```
ScrollView horizontal showsHorizontalScrollIndicator={false}
contentContainerClassName="px-4 gap-2"
└─ For each cat:
   Pressable
     active:   className="px-4 py-2 rounded-full bg-[#FF6B35]"
     inactive: className="px-4 py-2 rounded-full bg-[#1A1A1A] border border-[#2A2A2A]"
     hitSlop={6}
     accessibilityLabel={`Filter by ${cat}`}
     accessibilityState={{ selected: isActive }}
     └─ Text
        active:   className="text-white font-semibold text-sm"
        inactive: className="text-[#9CA3AF] font-medium text-sm"
```

---

## 6. MenuCard (`components/MenuCard.tsx`)

```
View className="bg-[#1A1A1A] rounded-2xl overflow-hidden border border-[#2A2A2A]"

├─ Image
│   source={{ uri: item.image }}
│   className="w-full aspect-[16/10] bg-[#2A2A2A]"
│   resizeMode="cover"
│
└─ View (body)  className="p-4 gap-2"
   ├─ Text (name)
   │    className="text-white font-bold text-lg"
   │    numberOfLines={1}
   │
   ├─ Text (description)
   │    className="text-[#9CA3AF] text-sm leading-5"
   │    numberOfLines={2}
   │    ellipsizeMode="tail"
   │
   └─ View (price + CTA row)  className="flex-row items-center justify-between pt-2"
      ├─ Text (price)
      │    className="text-[#FF6B35] font-bold text-xl"
      │    // `$${item.price.toFixed(2)}`
      │
      └─ Pressable (Add button)
           className="flex-row items-center gap-1 px-5 py-2.5 rounded-full bg-[#FF6B35] active:opacity-80 active:scale-95"
           hitSlop={8}
           accessibilityLabel={`Add ${item.name} to cart`}
           accessibilityRole="button"
           onPress={handleAdd}
           ├─ Ionicons name="add" size={16} color="#FFFFFF"
           └─ Text  className="text-white font-bold text-sm"  // "Add" or "Added" briefly
```

### Add interaction
```
const [justAdded, setJustAdded] = useState(false);
const addItem = useCartStore((s) => s.addItem);

const handleAdd = () => {
  addItem(item);
  setJustAdded(true);
  setTimeout(() => setJustAdded(false), 900);
};
```
While `justAdded`: swap "add" icon for `"checkmark"` and label to "Added". Optional Animated `scale` 1 → 0.94 → 1 over 150ms via `Animated.spring`.

---

## 7. FlatList Config (in `MenuScreen.tsx`)

```tsx
<FlatList
  data={filteredItems}
  keyExtractor={(i) => i.id}
  renderItem={({ item }) => <MenuCard item={item} />}
  numColumns={1}
  showsVerticalScrollIndicator={false}
  contentContainerClassName="px-4 pt-2 pb-24 gap-4"
  className="flex-1"
  ListEmptyComponent={<EmptyState category={selectedCategory} />}
  initialNumToRender={6}
  windowSize={9}
/>
```

`filteredItems = selectedCategory === "All" ? MENU_ITEMS : MENU_ITEMS.filter(i => i.category === selectedCategory)`.

`pb-24` keeps the last card clear of the bottom tab bar.

---

## 8. Empty State (`components/EmptyState.tsx`)

```
View className="flex-1 items-center justify-center px-8 py-20 gap-3"
├─ View   className="w-16 h-16 rounded-full bg-[#1A1A1A] items-center justify-center border border-[#2A2A2A]"
│  └─ Ionicons name="restaurant-outline" size={28} color="#9CA3AF"
├─ Text   className="text-white font-bold text-lg text-center"
│         // "Nothing here yet"
└─ Text   className="text-[#9CA3AF] text-sm text-center leading-5"
          // `No items in ${category}. Try another category.`
```

---

## 9. Loading / Skeleton (`components/MenuCardSkeleton.tsx`)

Render 4 of these inside the FlatList while `isLoading`.

```
View className="bg-[#1A1A1A] rounded-2xl overflow-hidden border border-[#2A2A2A]"
├─ View className="w-full aspect-[16/10] bg-[#2A2A2A] opacity-60"
└─ View className="p-4 gap-3"
   ├─ View className="h-5 w-2/3 rounded-md bg-[#2A2A2A]"
   ├─ View className="h-3 w-full rounded-md bg-[#2A2A2A] opacity-70"
   ├─ View className="h-3 w-5/6 rounded-md bg-[#2A2A2A] opacity-70"
   └─ View className="flex-row items-center justify-between pt-2"
      ├─ View className="h-6 w-16 rounded-md bg-[#2A2A2A]"
      └─ View className="h-9 w-20 rounded-full bg-[#2A2A2A]"
```

Optional shimmer: wrap inner placeholders in an `Animated.View` cycling opacity 0.5 → 1 → 0.5 over 1200ms (`useEffect` + `Animated.loop`). Pure NativeWind cannot animate, so use the RN `Animated` API for opacity only — no StyleSheet involved.

---

## 10. Interactions Summary

| Action | Result |
|---|---|
| Tap pill | `setSelectedCategory(cat)`; list re-filters; pill active style swaps. |
| Tap Add | `cartStore.addItem(item)`; button briefly shows check + "Added"; header badge increments. |
| Tap cart icon | `navigation.navigate("Cart")`. |
| Scroll list | Header + pills remain sticky above FlatList. |

---

## 11. Accessibility

- All Pressables: `accessibilityLabel` set (see above), `accessibilityRole="button"`, `hitSlop` ≥ 6 (8 on small icons).
- Add button label includes item name: `"Add Spicy Chicken Sandwich to cart"`.
- Cart icon: `accessibilityLabel="Open cart, {n} items"`.
- Contrast: `#FFFFFF` on `#0A0A0A` = 20.4:1; `#9CA3AF` on `#1A1A1A` ≈ 6.7:1; `#FFFFFF` on `#FF6B35` ≈ 3.4:1 — pair accent bg only with bold weights ≥14pt to stay WCAG AA Large.
- Pills expose `accessibilityState={{ selected }}`.
- Images: `accessibilityLabel={item.name}`, `accessible`.

---

## 12. Mock Data Shape Expected

`frontend/src/constants/menu.ts`:

```ts
export const MENU_ITEMS: MenuItem[] = [
  {
    id: "spicy_chicken_sandwich",
    name: "Spicy Chicken Sandwich",
    description: "Crispy buttermilk chicken, pickles, sriracha mayo on a toasted brioche bun.",
    price: 11.99,
    image: "https://picsum.photos/seed/spicychicken/800/500",
    category: "Burgers",
  },
  // ...one or two per category: Burgers, Sides, Drinks, Desserts
];

export const CATEGORIES = ["All", "Burgers", "Sides", "Drinks", "Desserts"] as const;
```

---

## 13. MenuScreen.tsx skeleton (structure only)

```tsx
export const MenuScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const items = selectedCategory === "All"
    ? MENU_ITEMS
    : MENU_ITEMS.filter((i) => i.category === selectedCategory);

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
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
      <FlatList /* ...see §7 */ />
    </SafeAreaView>
  );
};
```

Keep file under 150 lines — extract anything else.

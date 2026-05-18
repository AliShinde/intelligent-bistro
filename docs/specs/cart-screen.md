# Cart Screen Spec

## 1. Screen Purpose & User Flow

The Cart Screen is the second primary tab. Users:
1. See the shared `<Header />` (brand + cart badge) and a "Clear" text button on the right of the list header strip.
2. Scroll a vertical list of `CartItemRow` items, each with image, name, unit price, quantity stepper, and a remove button.
3. Adjust quantities with `-` / `+`. Hitting `-` at qty 1 removes the item (with optional confirm).
4. Read the sticky bottom `CartSummary` (Subtotal, Tax 8.5%, Total) and tap "Checkout" to place the order.
5. If the cart is empty, they see `CartEmptyState` with a "Browse Menu" CTA that navigates to the Menu tab.

---

## 2. Component File Plan (all NAMED exports, each under 150 lines)

| File | Responsibility |
|---|---|
| `frontend/src/screens/CartScreen.tsx` | Top-level screen. Picks items from store, computes totals via `useMemo`, renders header strip, FlatList, summary, or empty state. |
| `frontend/src/components/CartItemRow.tsx` | One cart line: thumbnail, name, unit price, stepper, remove. Calls store actions directly. |
| `frontend/src/components/QuantityStepper.tsx` | Reusable `-` / qty / `+` control. Props: `quantity`, `onIncrement`, `onDecrement`, `name` (for a11y). |
| `frontend/src/components/CartSummary.tsx` | Sticky bottom summary card with totals + Checkout button. Props: `subtotal`, `tax`, `total`, `onCheckout`. |
| `frontend/src/components/CartEmptyState.tsx` | Empty cart illustration + CTA. Props: `onBrowse`. |

---

## 3. Layout Tree (exact NativeWind classes)

```
SafeAreaView                       className="flex-1 bg-[#0A0A0A]"
├─ View (sticky header wrap)       className="bg-[#0A0A0A] border-b border-[#2A2A2A]"
│  └─ <Header />
│
├─ View (list header strip)        className="flex-row items-center justify-between px-4 pt-4 pb-2"
│  ├─ Text                         className="text-white font-bold text-2xl tracking-tight"   // "Your Cart"
│  └─ Pressable (Clear, only if items.length > 0)
│     className="px-3 py-1.5 rounded-full active:opacity-60"
│     accessibilityLabel="Clear cart"
│     └─ Text                      className="text-[#9CA3AF] font-semibold text-sm"           // "Clear"
│
├─ FlatList                        className="flex-1"
│  contentContainerClassName="px-4 pt-2 pb-44 gap-3"
│  renderItem → <CartItemRow item={item} />
│  ListEmptyComponent  <CartEmptyState onBrowse={...} />
│
└─ View (sticky summary wrap)      className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#2A2A2A] px-4 pt-3 pb-6"
   └─ <CartSummary ... />
```

Notes:
- `pb-44` on the FlatList content ensures the last row is not hidden behind the sticky summary (~176px).
- Summary uses absolute positioning rather than a wrapping flex layout so the list always scrolls under it.
- If empty, render the empty state INSTEAD of the FlatList + summary; show only the header (not the strip with "Clear").

---

## 4. CartItemRow (`components/CartItemRow.tsx`)

```
View className="flex-row items-center gap-3 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-3"

├─ Image
│    source={{ uri: item.image }}
│    className="w-20 h-20 rounded-xl bg-[#2A2A2A]"
│    resizeMode="cover"
│    accessibilityLabel={item.name}
│
├─ View (info column)              className="flex-1 gap-1"
│   ├─ View (top row)              className="flex-row items-start justify-between gap-2"
│   │   ├─ Text (name)             className="text-white font-bold text-base flex-1"
│   │   │                          numberOfLines={2}
│   │   └─ Pressable (remove)
│   │        className="w-8 h-8 rounded-full items-center justify-center active:opacity-60"
│   │        hitSlop={8}
│   │        accessibilityLabel={`Remove ${item.name} from cart`}
│   │        onPress={handleRemove}
│   │        └─ Trash2 size={16} color="#9CA3AF"
│   │
│   ├─ Text (unit price)           className="text-[#9CA3AF] text-sm"
│   │                              // `$${item.price.toFixed(2)} each`
│   │
│   └─ View (bottom row)           className="flex-row items-center justify-between pt-1"
│      ├─ Text (line total)        className="text-[#FF6B35] font-bold text-base"
│      │                           // `$${(item.price * item.quantity).toFixed(2)}`
│      └─ <QuantityStepper
│             quantity={item.quantity}
│             onIncrement={handleInc}
│             onDecrement={handleDec}
│             name={item.name}
│         />
```

### Store wiring inside the row

```ts
const updateQuantity = useCartStore((s) => s.updateQuantity);
const removeItem = useCartStore((s) => s.removeItem);

const handleInc = () => updateQuantity(item.id, item.quantity + 1);
const handleDec = () => {
  if (item.quantity <= 1) removeItem(item.id);
  else updateQuantity(item.id, item.quantity - 1);
};
const handleRemove = () => removeItem(item.id);
```

---

## 5. QuantityStepper (`components/QuantityStepper.tsx`)

```
View className="flex-row items-center gap-2 bg-[#0A0A0A] rounded-full border border-[#2A2A2A] px-1 py-1"

├─ Pressable (decrement)
│    className="w-8 h-8 rounded-full bg-[#1A1A1A] items-center justify-center active:opacity-70"
│    hitSlop={6}
│    accessibilityLabel={`Decrease quantity of ${name}`}
│    accessibilityRole="button"
│    onPress={onDecrement}
│    └─ Minus size={14} color="#FFFFFF"
│
├─ Text  className="text-white font-bold text-sm min-w-[20px] text-center"
│        accessibilityLiveRegion="polite"
│        // {quantity}
│
└─ Pressable (increment)
     className="w-8 h-8 rounded-full bg-[#FF6B35] items-center justify-center active:opacity-80"
     hitSlop={6}
     accessibilityLabel={`Increase quantity of ${name}`}
     accessibilityRole="button"
     onPress={onIncrement}
     └─ Plus size={14} color="#FFFFFF"
```

### Disabled-state decision

The decrement button is NEVER visually disabled. At `quantity === 1` it triggers `removeItem` instead (see §4). Rationale:
- A disabled `-` would strand the user at qty 1 and force them to find the small Trash icon, which is poor ergonomics.
- Consistent visual rhythm — both buttons always tappable, behavior is predictable: "minus reduces; reducing past one removes."
- The Trash button remains as an explicit, fast remove for users who want it.

---

## 6. CartSummary (`components/CartSummary.tsx`)

Props:
```ts
interface CartSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
  onCheckout: () => void;
}
```

```
View className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-4 gap-3"

├─ View (row) className="flex-row items-center justify-between"
│  ├─ Text className="text-[#9CA3AF] text-sm"               // "Subtotal"
│  └─ Text className="text-white font-semibold text-sm"     // `$${subtotal.toFixed(2)}`
│
├─ View (row) className="flex-row items-center justify-between"
│  ├─ Text className="text-[#9CA3AF] text-sm"               // "Tax (8.5%)"
│  └─ Text className="text-white font-semibold text-sm"     // `$${tax.toFixed(2)}`
│
├─ View (divider) className="h-px bg-[#2A2A2A] my-1"
│
├─ View (row) className="flex-row items-end justify-between"
│  ├─ Text className="text-white font-bold text-base"       // "Total"
│  └─ Text className="text-[#FF6B35] font-bold text-2xl tracking-tight"
│                                                            // `$${total.toFixed(2)}`
│
└─ Pressable (Checkout)
     className="w-full flex-row items-center justify-center gap-2 py-4 rounded-full bg-[#FF6B35] active:opacity-80"
     hitSlop={6}
     accessibilityRole="button"
     accessibilityLabel={`Checkout, total $${total.toFixed(2)}`}
     onPress={onCheckout}
     └─ Text className="text-white font-bold text-base tracking-tight"   // "Checkout"
```

---

## 7. CartEmptyState (`components/CartEmptyState.tsx`)

```
View className="flex-1 items-center justify-center px-8 py-24 gap-4"

├─ View className="w-24 h-24 rounded-full bg-[#1A1A1A] items-center justify-center border border-[#2A2A2A]"
│  └─ ShoppingBag size={40} color="#9CA3AF"
│
├─ Text className="text-white font-bold text-xl text-center"
│        // "Your cart is empty"
│
├─ Text className="text-[#9CA3AF] text-sm text-center leading-5 max-w-[260px]"
│        // "Add some delicious items from the menu and they'll show up here."
│
└─ Pressable (Browse Menu)
     className="mt-2 px-6 py-3 rounded-full bg-[#FF6B35] active:opacity-80"
     hitSlop={8}
     accessibilityRole="button"
     accessibilityLabel="Browse menu"
     onPress={onBrowse}
     └─ Text className="text-white font-bold text-sm"   // "Browse Menu"
```

`onBrowse` calls `navigation.navigate("Menu")` (tab name as defined in the root navigator).

---

## 8. Selectors & Totals (in `CartScreen.tsx`)

```ts
import { useMemo } from "react";
import { useCartStore } from "../store/cartStore";

const items = useCartStore((s) => s.items);
const clear = useCartStore((s) => s.clear);

const { subtotal, tax, total } = useMemo(() => {
  const sub = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const t = sub * 0.085;
  return { subtotal: sub, tax: t, total: sub + t };
}, [items]);
```

Important: select discrete slices (`s.items`, `s.clear`) — do NOT select the whole store object, which would over-render.

---

## 9. Interactions

| Action | Result |
|---|---|
| Tap `+` | `updateQuantity(id, qty + 1)`; row line total + summary recompute. |
| Tap `-` (qty > 1) | `updateQuantity(id, qty - 1)`. |
| Tap `-` (qty === 1) | `removeItem(id)`. Row exits the list. |
| Tap trash icon | `removeItem(id)`. |
| Tap "Clear" | `Alert.alert("Clear cart?", "This will remove all items.", [{text:"Cancel", style:"cancel"}, {text:"Clear", style:"destructive", onPress: clear}])`. |
| Tap "Checkout" | `Alert.alert("Order placed!", \`Your total was $${total.toFixed(2)}.\`, [{text:"OK", onPress: clear}])`. |
| Tap "Browse Menu" (empty state) | `navigation.navigate("Menu")`. |
| Swipe-to-delete | **Nice-to-have only** — can wrap each row in `react-native-gesture-handler`'s `Swipeable` revealing a red `Trash2` action that calls `removeItem`. Not required for v1. |

---

## 10. States

- **Loaded with items** — list + sticky summary.
- **Empty** — `items.length === 0` → render `<CartEmptyState />`; hide summary and the "Clear" button.
- **Loading** — not applicable (cart is local Zustand state, synchronous).
- **Error** — not applicable for v1 (no async cart yet). When checkout becomes a real API call, surface a toast/Alert on failure.
- **Single item** — stepper at qty 1 still shows `-` (active), tapping it removes the item.

---

## 11. Accessibility

- Stepper buttons: `accessibilityLabel="Increase quantity of {name}"` / `"Decrease quantity of {name}"`, `accessibilityRole="button"`.
- Quantity text uses `accessibilityLiveRegion="polite"` so screen readers announce changes.
- Remove button: `accessibilityLabel={\`Remove ${item.name} from cart\`}`.
- Checkout button: `accessibilityLabel={\`Checkout, total $${total.toFixed(2)}\`}`.
- Clear button: `accessibilityLabel="Clear cart"`, plus the destructive Alert provides a confirmation step (acts as a guard for assistive tech users).
- Browse Menu CTA: `accessibilityLabel="Browse menu"`.
- `hitSlop` ≥ 6 on all small icon buttons; thumbnails marked `accessible` with `accessibilityLabel={item.name}`.
- Contrast: same tokens as Menu Screen — passes WCAG AA for body text; accent button paired only with bold ≥14pt to satisfy AA Large.

---

## 12. Mock Data Shape Expected

`CartItem` already defined in `frontend/src/types/index.ts`:

```ts
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}
```

---

## 13. CartScreen.tsx skeleton (structure only)

```tsx
export const CartScreen = ({ navigation }: CartScreenProps) => {
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);

  const { subtotal, tax, total } = useMemo(() => {
    const sub = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
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
    Alert.alert("Order placed!", `Your total was $${total.toFixed(2)}.`, [
      { text: "OK", onPress: clear },
    ]);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#0A0A0A]">
        <View className="bg-[#0A0A0A] border-b border-[#2A2A2A]">
          <Header />
        </View>
        <CartEmptyState onBrowse={() => navigation.navigate("Menu")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <View className="bg-[#0A0A0A] border-b border-[#2A2A2A]">
        <Header />
      </View>
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Text className="text-white font-bold text-2xl tracking-tight">Your Cart</Text>
        <Pressable onPress={handleClear} className="px-3 py-1.5 rounded-full active:opacity-60" accessibilityLabel="Clear cart">
          <Text className="text-[#9CA3AF] font-semibold text-sm">Clear</Text>
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <CartItemRow item={item} />}
        contentContainerClassName="px-4 pt-2 pb-44 gap-3"
        className="flex-1"
        showsVerticalScrollIndicator={false}
      />
      <View className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#2A2A2A] px-4 pt-3 pb-6">
        <CartSummary subtotal={subtotal} tax={tax} total={total} onCheckout={handleCheckout} />
      </View>
    </SafeAreaView>
  );
};
```

Keep file under 150 lines — extract anything else into the dedicated components above.

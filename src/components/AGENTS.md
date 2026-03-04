# UI COMPONENTS

## OVERVIEW

Reusable UI components following fluid/breathing visual style. All components use theme tokens from `@/utils/theme`.

## STRUCTURE

```
src/components/
├── Button.tsx      # Haptic-enabled button with variants
├── Card.tsx        # Themed container with flow/drain/elevated variants
├── EnergyBall.tsx  # 3D animated ball using Skia + Reanimated
└── Modal.tsx       # Modal wrapper (if present)
```

## COMPONENTS

### Button

```typescript
<Button
  title="Label"
  onPress={() => {}}
  variant="primary" | "secondary" | "flow" | "drain" | "success" | "ghost"
  size="sm" | "md" | "lg"
  loading={false}
  disabled={false}
/>
```

- Auto-triggers haptic feedback on press
- Supports loading spinner state

### Card

```typescript
<Card variant="default" | "flow" | "drain" | "elevated">
  {children}
</Card>
```

- Flow: teal tint + border
- Drain: purple tint + border
- Elevated: shadow + elevated background

### EnergyBall

```typescript
<EnergyBall
  score={number}      // Determines color: positive=flow, negative=drain
  onPress={() => {}}  // Opens record modal
/>
```

- Uses `@shopify/react-native-skia` for rendering
- Pulse ring animations via react-native-reanimated
- Floats when score is positive

## STYLING PATTERNS

1. Import theme: `import { colors, spacing, borderRadius } from '@/utils/theme'`
2. Use StyleSheet.create() at file bottom
3. Apply theme tokens, not hardcoded values
4. Variant styles computed in `getVariantStyles()` function

## ANTI-PATTERNS

- Never hardcode colors - use `colors.flow.primary`, etc.
- Never skip haptics on interactive elements
- Never inline styles - use StyleSheet.create()
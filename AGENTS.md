# ENERGY LEDGER (功过格) - PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-04
**Commit:** 8080426
**Branch:** main

## OVERVIEW

Mobile self-awareness app tracking energy states (flow/drain) with body-state logging, vision alignment, and micro-commitments. Built with **Expo 55 + React Native 0.83 + React 19**. Uses SQLite for persistence and Skia for fluid visualizations.

## STRUCTURE

```
energy-ledger/
├── app/                  # File-based routing (expo-router)
│   ├── (tabs)/           # Tab navigator: home, stats, contract, insights
│   ├── _layout.tsx       # Root layout + onboarding redirect
│   ├── onboarding.tsx    # First-time user flow
│   ├── record.tsx        # Energy record modal
│   └── vision.tsx        # Vision management modal
├── src/
│   ├── components/       # Reusable UI (Button, Card, EnergyBall, Modal)
│   ├── store/            # AppContext + SQLite storage layer
│   ├── types/            # Domain types + presets (DRAIN_STATES, FLOW_STATES)
│   └── utils/            # Theme system (colors, spacing, shadows)
└── index.ts              # Entry: delegates to expo-router/entry
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new screen | `app/` | File-based routing; create `.tsx` file |
| Modify routing | `app/_layout.tsx` | Stack config + onboarding redirect |
| Add UI component | `src/components/` | Follow Button/Card patterns |
| Modify state | `src/store/AppContext.tsx` | React Context + actions |
| Database schema | `src/store/storage.ts` | SQLite tables: visions, records, commitments |
| Energy types | `src/types/index.ts` | Vision, EnergyRecord, Commitment, BodyState |
| Theme/styling | `src/utils/theme.ts` | colors, spacing, borderRadius, shadows |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `AppProvider` | Func | `src/store/AppContext.tsx:38` | Global state context |
| `useApp` | Hook | `src/store/AppContext.tsx:210` | Access app state |
| `initDatabase` | Func | `src/store/storage.ts:11` | SQLite schema init |
| `EnergyBall` | Comp | `src/components/EnergyBall.tsx:26` | Main visual indicator |
| `Button` | Comp | `src/components/Button.tsx:29` | Haptic-enabled button |
| `Card` | Comp | `src/components/Card.tsx:12` | Themed container |
| `colors` | Const | `src/utils/theme.ts:4` | Flow/drain/transform colors |
| `DRAIN_STATES` | Const | `src/types/index.ts:112` | Body state presets |
| `FLOW_STATES` | Const | `src/types/index.ts:175` | Body state presets |
| `PRESET_VISIONS` | Const | `src/types/index.ts:98` | Default vision options |

## CONVENTIONS

- **Path alias**: Use `@/` for `src/` imports (e.g., `import { colors } from '@/utils/theme'`)
- **TypeScript strict mode**: Enabled; no `any` escapes
- **Animations**: Use react-native-reanimated for animations, Skia for complex graphics
- **Haptics**: Always trigger haptic feedback on user interactions (via expo-haptics)
- **Styling**: Use StyleSheet.create(); reference theme tokens from `@/utils/theme`

## ANTI-PATTERNS (THIS PROJECT)

None explicitly documented. Codebase is clean without TODO/FIXME/HACK markers.

## UNIQUE STYLES

- **Chinese UI labels**: App uses Chinese text for labels (功过格, 能量值, 连续觉察)
- **Energy scoring**: Records have score (positive for flow, negative for drain with awareness bonus)
- **Body-state model**: DRAIN_STATES (entropy) vs FLOW_STATES (negentropy) with emoji + tags
- **Vision-driven**: All records link to user-defined visions

## COMMANDS

```bash
npm start          # Start Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web version
```

## NOTES

- **No tests**: Testing infrastructure not yet set up
- **No CI/CD**: Manual deployment via EAS
- **New Architecture**: `newArchEnabled: true` in app.json
- **Product spec**: See `功过格产品设计说明.md` for full product requirements (Chinese)
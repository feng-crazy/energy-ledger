# STORE LAYER

## OVERVIEW

State management using React Context + SQLite persistence. Two-layer architecture: `AppContext.tsx` (React state + actions) wraps `storage.ts` (SQLite CRUD + AsyncStorage).

## STRUCTURE

```
src/store/
├── AppContext.tsx    # React Context provider (216 lines)
└── storage.ts        # SQLite + AsyncStorage layer (293 lines)
```

## WHERE TO LOOK

| Task | File | Function |
|------|------|----------|
| Access global state | AppContext.tsx | `useApp()` hook |
| Add new state slice | AppContext.tsx | Add to `AppContextType` interface |
| Add new CRUD operation | storage.ts | Export async function |
| Modify DB schema | storage.ts | `initDatabase()` at line 11 |
| Query records by date | storage.ts | `getRecordsByDate(date)` |
| User stats | storage.ts | `getUserStats()`, `updateUserStats()` |

## DATABASE TABLES

| Table | Columns | Notes |
|-------|---------|-------|
| `visions` | id, emoji, label, desc, detail, createdAt, updatedAt | User-defined goals |
| `records` | id, type, bodyStateId, visions (JSON), journal, score, hasAiReport, aiReport (JSON) | Energy entries |
| `commitments` | id, content, visionId, timeOption, deadline, status, failReason, failTag | Micro-commitments |

## KEY INTERFACES

```typescript
// AppContext.tsx
interface AppContextType {
  visions: Vision[];
  records: EnergyRecord[];
  activeCommitment: Commitment | null;
  stats: UserStats;
  hasOnboarded: boolean;
  isLoading: boolean;
  // Actions: refresh*, add*, update*, delete*, complete*
}

// storage.ts - Main exports
initDatabase() -> Promise<void>
getVisions() -> Promise<Vision[]>
addVision(vision) -> Promise<Vision>
getRecords(limit?) -> Promise<EnergyRecord[]>
addRecord(record) -> Promise<EnergyRecord>
getActiveCommitment() -> Promise<Commitment | null>
getUserStats() -> Promise<UserStats>
```

## PATTERNS

- **Optimistic updates**: Context updates local state immediately after storage write
- **Parallel loading**: All initial data fetched via `Promise.all()` on mount
- **Streak calculation**: Handled in `addRecord()` - checks consecutive days
- **JSON serialization**: `visions` and `aiReport` stored as JSON strings in SQLite

## ANTI-PATTERNS

- Never call storage functions directly from components - use `useApp()` actions
- Never bypass `AppProvider` - components need context access
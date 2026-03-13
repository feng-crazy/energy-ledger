# 承诺统计重设计 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修改 contract 页面的 Energy Overview 卡片，实现新的承诺统计逻辑（连续承诺天数 + 承诺完成率）

**Architecture:** 扩展 UserStats 接口添加新字段，在 AppContext 中实现统计更新逻辑，修改 Contract 页面 UI 显示新的统计数据

**Tech Stack:** React Native, TypeScript, SQLite, AsyncStorage

---

## Task 1: 扩展 UserStats 类型定义

**Files:**
- Modify: `src/types/index.ts:76-83`

**Step 1: 扩展 UserStats 接口**

在 `src/types/index.ts` 中找到 `UserStats` 接口（约第 76 行），修改为：

```typescript
// 用户统计
export interface UserStats {
  totalEnergy: number;
  streak: number;
  maxStreak: number;
  lastRecordDate: string;
  completedCommitments: number;       // 已完成承诺数
  // 新增字段
  totalCommitments: number;           // 总承诺数
  commitmentStreak: number;           // 连续承诺天数
  lastCommitmentActivityDate: string; // 最后处理承诺的日期
  lastDailyCountDate: string;         // 每日承诺最后计入日期
}
```

**Step 2: 验证类型定义**

Run: `npx tsc --noEmit`
Expected: 无类型错误

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): extend UserStats with commitment tracking fields"
```

---

## Task 2: 更新存储层默认值

**Files:**
- Modify: `src/store/storage.ts:479-491`

**Step 1: 更新 getUserStats 默认值**

在 `src/store/storage.ts` 中找到 `getUserStats` 函数（约第 479 行），修改默认返回值为：

```typescript
export async function getUserStats(): Promise<UserStats> {
  const statsStr = await AsyncStorage.getItem('user_stats');
  if (statsStr) {
    return JSON.parse(statsStr);
  }
  
  return {
    totalEnergy: 0,
    streak: 0,
    maxStreak: 0,
    lastRecordDate: '',
    completedCommitments: 0,
    totalCommitments: 0,
    commitmentStreak: 0,
    lastCommitmentActivityDate: '',
    lastDailyCountDate: '',
  };
}
```

**Step 2: 验证编译**

Run: `npx tsc --noEmit`
Expected: 无类型错误

**Step 3: Commit**

```bash
git add src/store/storage.ts
git commit -m "feat(storage): add default values for new commitment stats fields"
```

---

## Task 3: 更新 AppContext 默认状态

**Files:**
- Modify: `src/store/AppContext.tsx:48-54`

**Step 1: 更新 stats 默认值**

在 `src/store/AppContext.tsx` 中找到 `useState<UserStats>` 初始值（约第 48 行），修改为：

```typescript
const [stats, setStats] = useState<UserStats>({
  totalEnergy: 0,
  streak: 0,
  maxStreak: 0,
  lastRecordDate: '',
  completedCommitments: 0,
  totalCommitments: 0,
  commitmentStreak: 0,
  lastCommitmentActivityDate: '',
  lastDailyCountDate: '',
});
```

**Step 2: 验证编译**

Run: `npx tsc --noEmit`
Expected: 无类型错误

**Step 3: Commit**

```bash
git add src/store/AppContext.tsx
git commit -m "feat(context): update stats default state with new fields"
```

---

## Task 4: 实现统计更新辅助函数

**Files:**
- Modify: `src/store/AppContext.tsx`

**Step 1: 添加日期辅助函数**

在 `AppContext.tsx` 文件顶部（import 之后，AppProvider 之前）添加：

```typescript
// Helper functions for commitment stats
const getToday = () => new Date().toISOString().split('T')[0];
const getYesterday = () => new Date(Date.now() - 86400000).toISOString().split('T')[0];

// Calculate new streak based on last activity date
const calculateNewStreak = (lastActivityDate: string): number => {
  const today = getToday();
  const yesterday = getYesterday();
  
  if (lastActivityDate === today) {
    // Already processed today, streak unchanged
    return -1; // Signal: no change needed
  } else if (lastActivityDate === yesterday) {
    // Consecutive day
    return 1; // Signal: increment streak
  } else {
    // Broken streak
    return 0; // Signal: reset to 1
  }
};
```

**Step 2: 验证编译**

Run: `npx tsc --noEmit`
Expected: 无类型错误

**Step 3: Commit**

```bash
git add src/store/AppContext.tsx
git commit -m "feat(context): add helper functions for commitment streak calculation"
```

---

## Task 5: 更新 addCommitment 逻辑

**Files:**
- Modify: `src/store/AppContext.tsx:176-180`

**Step 1: 修改 addCommitment 函数**

找到 `addCommitment` 函数（约第 176 行），修改为：

```typescript
const addCommitment = async (commitment: Omit<Commitment, 'id' | 'createdAt' | 'status'>) => {
  const newCommitment = await Storage.addCommitment(commitment);
  setActiveCommitments(prev => [...prev, newCommitment]);
  
  // Update totalCommitments count
  const newTotalCommitments = stats.totalCommitments + 1;
  await Storage.updateUserStats({ totalCommitments: newTotalCommitments });
  setStats(prev => ({ ...prev, totalCommitments: newTotalCommitments }));
  
  return newCommitment;
};
```

**Step 2: 验证编译**

Run: `npx tsc --noEmit`
Expected: 无类型错误

**Step 3: Commit**

```bash
git add src/store/AppContext.tsx
git commit -m "feat(context): update totalCommitments on addCommitment"
```

---

## Task 6: 更新 completeCommitment 逻辑

**Files:**
- Modify: `src/store/AppContext.tsx:182-216`

**Step 1: 修改 completeCommitment 函数**

找到 `completeCommitment` 函数（约第 182 行），修改为：

```typescript
const completeCommitment = async (id: string) => {
  const commitment = activeCommitments.find(c => c.id === id);
  if (!commitment) {
    console.warn('Commitment not found:', id);
    return;
  }
  
  const isDaily = commitment.timeOption === 'daily';
  const today = getToday();
  
  if (isDaily) {
    const newStreakCount = (commitment.streakCount || 0) + 1;
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    await Storage.completeDailyCommitment(id, today, newStreakCount);
    await refreshActiveCommitments();
  } else {
    await Storage.completeCommitment(id);
    await refreshActiveCommitments();
  }
  
  if (commitment.visionId) {
    await Storage.updateVisionEnergyScore(commitment.visionId, ENERGY_SCORES.COMMITMENT_BONUS);
    setVisions(prev => prev.map(v => 
      v.id === commitment.visionId 
        ? { ...v, energyScore: v.energyScore + ENERGY_SCORES.COMMITMENT_BONUS, updatedAt: Date.now() }
        : v
    ));
  }
  
  // Update completedCommitments count
  const newCompletedCount = stats.completedCommitments + 1;
  
  // Update commitment streak
  const streakResult = calculateNewStreak(stats.lastCommitmentActivityDate);
  let newCommitmentStreak = stats.commitmentStreak;
  let newLastActivityDate = stats.lastCommitmentActivityDate;
  
  if (streakResult === 1) {
    newCommitmentStreak = stats.commitmentStreak + 1;
    newLastActivityDate = today;
  } else if (streakResult === 0) {
    newCommitmentStreak = 1;
    newLastActivityDate = today;
  }
  // streakResult === -1 means already processed today, no change
  
  const statsUpdate = {
    completedCommitments: newCompletedCount,
    commitmentStreak: newCommitmentStreak,
    lastCommitmentActivityDate: newLastActivityDate,
  };
  
  await Storage.updateUserStats(statsUpdate);
  setStats(prev => ({ ...prev, ...statsUpdate }));
};
```

**Step 2: 验证编译**

Run: `npx tsc --noEmit`
Expected: 无类型错误

**Step 3: Commit**

```bash
git add src/store/AppContext.tsx
git commit -m "feat(context): update completedCommitments and commitmentStreak on completeCommitment"
```

---

## Task 7: 更新 failCommitment 逻辑

**Files:**
- Modify: `src/store/AppContext.tsx:218-231`

**Step 1: 修改 failCommitment 函数**

找到 `failCommitment` 函数（约第 218 行），修改为：

```typescript
const failCommitment = async (id: string, reason?: string, tag?: string) => {
  const commitment = activeCommitments.find(c => c.id === id);
  if (!commitment) {
    console.warn('Commitment not found:', id);
    return;
  }
  
  if (commitment.timeOption === 'daily') {
    await Storage.resetDailyCommitmentStreak(id);
  } else {
    await Storage.failCommitment(id, reason, tag);
  }
  await refreshActiveCommitments();
  
  // Update commitment streak (failed commitment also counts as processed)
  const today = getToday();
  const streakResult = calculateNewStreak(stats.lastCommitmentActivityDate);
  let newCommitmentStreak = stats.commitmentStreak;
  let newLastActivityDate = stats.lastCommitmentActivityDate;
  
  if (streakResult === 1) {
    newCommitmentStreak = stats.commitmentStreak + 1;
    newLastActivityDate = today;
  } else if (streakResult === 0) {
    newCommitmentStreak = 1;
    newLastActivityDate = today;
  }
  
  if (streakResult !== -1) {
    const statsUpdate = {
      commitmentStreak: newCommitmentStreak,
      lastCommitmentActivityDate: newLastActivityDate,
    };
    
    await Storage.updateUserStats(statsUpdate);
    setStats(prev => ({ ...prev, ...statsUpdate }));
  }
};
```

**Step 2: 验证编译**

Run: `npx tsc --noEmit`
Expected: 无类型错误

**Step 3: Commit**

```bash
git add src/store/AppContext.tsx
git commit -m "feat(context): update commitmentStreak on failCommitment"
```

---

## Task 8: 添加每日承诺计数检查函数

**Files:**
- Modify: `src/store/AppContext.tsx`

**Step 1: 添加 checkDailyCommitments 函数**

在 `AppProvider` 内，找到 `deleteCommitment` 函数之后，添加新函数：

```typescript
// Check and update daily commitment count for new day
const checkDailyCommitments = async () => {
  const today = getToday();
  
  // Check if already counted today
  if (stats.lastDailyCountDate === today) {
    return;
  }
  
  // Check if there are active daily commitments
  const hasDailyCommitments = activeCommitments.some(c => 
    c.timeOption === 'daily' && c.status === 'active'
  );
  
  if (hasDailyCommitments) {
    const newTotalCommitments = stats.totalCommitments + 1;
    const statsUpdate = {
      totalCommitments: newTotalCommitments,
      lastDailyCountDate: today,
    };
    
    await Storage.updateUserStats(statsUpdate);
    setStats(prev => ({ ...prev, ...statsUpdate }));
  }
};
```

**Step 2: 导出 checkDailyCommitments**

在 `AppContextType` 接口中添加：

```typescript
checkDailyCommitments: () => Promise<void>;
```

在 `AppContext.Provider` 的 value 中添加：

```typescript
checkDailyCommitments,
```

**Step 3: 验证编译**

Run: `npx tsc --noEmit`
Expected: 无类型错误

**Step 4: Commit**

```bash
git add src/store/AppContext.tsx
git commit -m "feat(context): add checkDailyCommitments function for daily counting"
```

---

## Task 9: 更新 Contract 页面 UI

**Files:**
- Modify: `app/(tabs)/contract.tsx:243-274`

**Step 1: 添加 useEffect 调用 checkDailyCommitments**

在 `ContractPage` 组件中，找到 `useEffect` 块区域（约第 64 行），添加新的 useEffect：

```typescript
// Check daily commitments count on mount
useEffect(() => {
  checkDailyCommitments();
}, [checkDailyCommitments]);
```

需要从 `useApp` 中解构 `checkDailyCommitments`：

```typescript
const { visions, activeCommitments, stats, addCommitment, completeCommitment, failCommitment, deleteCommitment, checkDailyCommitments } = useApp();
```

**Step 2: 替换 Energy Overview 卡片 UI**

找到 `{/* Energy Overview */}` 部分（约第 243-274 行），替换为：

```tsx
{/* Commitment Stats Overview */}
<Card style={styles.energyCard} variant="flow">
  <View style={styles.statsRow}>
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>连续承诺天数</Text>
      <Text style={styles.streakValue}>🔥 {stats.commitmentStreak} 天</Text>
    </View>
  </View>
  
  <View style={styles.divider} />
  
  <View style={styles.completionSection}>
    <View style={styles.completionHeader}>
      <Text style={styles.statLabel}>承诺完成率</Text>
      <Text style={styles.completionRatio}>
        {stats.completedCommitments}/{stats.totalCommitments}
      </Text>
    </View>
    
    <View style={styles.progressBar}>
      <View
        style={[
          styles.progressBarFill,
          {
            width: stats.totalCommitments > 0 
              ? `${(stats.completedCommitments / stats.totalCommitments) * 100}%` 
              : '0%',
            backgroundColor: colors.flow.primary,
          }
        ]}
      />
    </View>
    
    <Text style={styles.completionNote}>
      已完成 {stats.completedCommitments} 个 · 总计 {stats.totalCommitments} 个
    </Text>
  </View>
</Card>
```

**Step 3: 添加新样式**

在 `StyleSheet.create` 中找到 `energyCard` 相关样式，替换/添加：

```typescript
statsRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginBottom: 12,
},
statItem: {
  alignItems: 'center',
},
statLabel: {
  fontSize: 12,
  color: colors.white.muted,
  marginBottom: 4,
},
streakValue: {
  fontSize: 28,
  fontWeight: '700',
  color: colors.transform.primary,
},
divider: {
  height: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  marginVertical: 12,
},
completionSection: {
  // no additional styles needed
},
completionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},
completionRatio: {
  fontSize: 16,
  fontWeight: '600',
  color: colors.flow.primary,
},
progressBar: {
  height: 8,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 4,
  overflow: 'hidden',
  marginBottom: 8,
},
progressBarFill: {
  height: '100%',
  backgroundColor: colors.flow.primary,
  borderRadius: 4,
},
completionNote: {
  fontSize: 11,
  color: colors.white.muted,
  textAlign: 'center',
},
```

**Step 4: 删除不再使用的样式**

删除以下不再使用的样式：
- `energyHeader`
- `energyLabel`
- `energyValue`
- `streakDisplay`
- `energyBar`
- `energyBarFill`
- `energyNote`
- `energyNoteNext`

**Step 5: 验证编译**

Run: `npx tsc --noEmit`
Expected: 无类型错误

**Step 6: Commit**

```bash
git add app/(tabs)/contract.tsx
git commit -m "feat(contract): replace energy overview with commitment stats UI"
```

---

## Task 10: 添加数据迁移逻辑

**Files:**
- Modify: `src/store/storage.ts`

**Step 1: 添加迁移函数**

在 `src/store/storage.ts` 中，`initDatabase` 函数末尾（migrations 之后）添加：

```typescript
// Migrate existing stats with new fields
try {
  await migrateUserStatsFields();
} catch (error) {
  console.warn('UserStats fields migration failed:', error);
}
```

然后添加迁移函数：

```typescript
async function migrateUserStatsFields(): Promise<void> {
  const statsStr = await AsyncStorage.getItem('user_stats');
  if (!statsStr) return;
  
  const stats = JSON.parse(statsStr);
  
  // Add new fields if missing
  if (stats.totalCommitments === undefined) {
    stats.totalCommitments = 0;
  }
  if (stats.commitmentStreak === undefined) {
    stats.commitmentStreak = 0;
  }
  if (stats.lastCommitmentActivityDate === undefined) {
    stats.lastCommitmentActivityDate = '';
  }
  if (stats.lastDailyCountDate === undefined) {
    stats.lastDailyCountDate = '';
  }
  
  await AsyncStorage.setItem('user_stats', JSON.stringify(stats));
}
```

**Step 2: 验证编译**

Run: `npx tsc --noEmit`
Expected: 无类型错误

**Step 3: Commit**

```bash
git add src/store/storage.ts
git commit -m "feat(storage): add migration for new UserStats fields"
```

---

## Task 11: 整体验证

**Step 1: 完整编译检查**

Run: `npx tsc --noEmit`
Expected: 无错误

**Step 2: 启动应用测试**

Run: `npm start`
Expected: 应用正常启动

**Step 3: 功能测试清单**

1. 创建新承诺 → 总承诺数 +1
2. 完成承诺 → 已完成数 +1，连续天数 +1
3. 失败承诺 → 连续天数 +1
4. 每日承诺跨天 → 打开页面时总承诺数 +1
5. UI 显示正确

**Step 4: 最终 Commit**

```bash
git add -A
git commit -m "feat: complete commitment stats redesign

- Add totalCommitments, commitmentStreak, lastCommitmentActivityDate, lastDailyCountDate to UserStats
- Update addCommitment to increment totalCommitments
- Update completeCommitment to update completedCommitments and commitmentStreak
- Update failCommitment to update commitmentStreak
- Add checkDailyCommitments for daily commitment counting
- Update Contract page UI to show commitment stats instead of energy stats
- Add migration logic for existing users"
```

---

## 验收标准

- [ ] 创建承诺时，`totalCommitments` +1
- [ ] 完成承诺时，`completedCommitments` +1，`commitmentStreak` 正确更新
- [ ] 失败承诺时，`commitmentStreak` 正确更新
- [ ] 连续处理承诺时，`commitmentStreak` 连续递增
- [ ] 中断一天后处理承诺时，`commitmentStreak` 重置为 1
- [ ] 每日承诺每天计入总承诺数
- [ ] 删除承诺不影响统计数据
- [ ] UI 正确显示新的统计数据
- [ ] 现有用户数据正确迁移
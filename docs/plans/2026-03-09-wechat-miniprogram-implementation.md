# 功过格微信小程序实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 基于 Taro 框架开发功过格微信小程序，复用 Expo 版本核心逻辑，实现完整功能。

**Architecture:** 采用 Taro + React 架构，复用 Expo 版本的类型定义、状态管理模式和业务逻辑。数据层使用 Taro Storage API 替代 SQLite。UI 层用 SCSS 重写，能量球先用 CSS 静态实现。

**Tech Stack:** Taro 3.x, React 18, TypeScript, SCSS, Taro Storage, 微信小程序 API

---

## Phase 1: 项目初始化

### Task 1.1: 创建 Taro 项目

**Files:**
- Create: `/Users/hedengfeng/workspace/tmp/energy-ledger-taro/` (整个项目目录)

**Step 1: 安装 Taro CLI**

```bash
npm install -g @tarojs/cli
```

**Step 2: 创建项目**

```bash
cd /Users/hedengfeng/workspace/tmp
taro init energy-ledger-taro
```

选择配置：
- 框架: React
- CSS 预处理器: Sass
- 模板: 默认模板
- TypeScript: Yes
- 包管理器: npm

**Step 3: 验证项目创建成功**

```bash
cd energy-ledger-taro
ls -la
```

Expected: 看到 `package.json`, `src/`, `config/` 等目录

**Step 4: 安装依赖**

```bash
npm install
```

**Step 5: 验证开发环境**

```bash
npm run dev:weapp
```

Expected: 编译成功，生成 `dist/` 目录

**Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: 初始化 Taro 项目"
```

---

### Task 1.2: 配置项目结构

**Files:**
- Create: `src/types/index.ts`
- Create: `src/store/index.ts` (placeholder)
- Create: `src/utils/theme.ts`
- Create: `src/services/ai.ts` (placeholder)
- Create: `src/components/` 目录

**Step 1: 创建目录结构**

```bash
cd /Users/hedengfeng/workspace/tmp/energy-ledger-taro
mkdir -p src/types src/store src/utils src/services src/components
```

**Step 2: 配置路径别名**

修改 `config/index.ts`，添加 alias:

```typescript
// config/index.ts
const config = {
  // ...
  alias: {
    '@': path.resolve(__dirname, '..', 'src'),
  },
  // ...
}
```

修改 `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "chore: 配置项目结构和路径别名"
```

---

## Phase 2: 类型定义和主题系统

### Task 2.1: 复制类型定义

**Files:**
- Create: `src/types/index.ts`

**Step 1: 复制 Expo 类型定义**

从 `/Users/hedengfeng/workspace/tmp/energy-ledger/src/types/index.ts` 复制内容到 `src/types/index.ts`。

完整代码:

```typescript
// src/types/index.ts
// Energy Ledger - 功过格
// Data models and types

// 能量记录类型
export type EnergyType = 'flow' | 'drain';

// 身体状态选项
export interface BodyState {
  id: string;
  emoji: string;
  label: string;
  desc?: string;
  color: string;
  borderColor: string;
  tags: string[];
  isCustom: boolean;
}

// 愿景
export interface Vision {
  id: string;
  title: string;
  emoji: string;
  label: string;
  desc: string;
  detail?: string;
  energyScore: number;
  createdAt: number;
  updatedAt: number;
}

// 能量记录
export interface EnergyRecord {
  id: string;
  type: EnergyType;
  bodyStateId: string;
  customBodyState?: string;
  visions: string[];
  journal: string;
  score: number;
  createdAt: number;
  hasAiReport: boolean;
  aiReport?: AiReport;
}

// AI分析报告
export interface AiReport {
  philosophy: string;
  neuroscience: string;
  suggestion: string;
  generatedAt: number;
}

// AI配置
export interface AiConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

// 微承诺
export interface Commitment {
  id: string;
  content: string;
  visionId: string;
  timeOption: '1hour' | 'today' | 'week';
  deadline: number;
  createdAt: number;
  status: 'active' | 'completed' | 'failed';
  failReason?: string;
  failTag?: string;
}

// 用户统计
export interface UserStats {
  totalEnergy: number;
  streak: number;
  maxStreak: number;
  lastRecordDate: string;
  completedCommitments: number;
}

// 预设愿景
export const PRESET_VISIONS: Omit<Vision, 'createdAt' | 'updatedAt' | 'energyScore'>[] = [
  { id: 'health', title: '身心健康', emoji: '🏃', label: '健康', desc: '身体活力与生命力' },
  { id: 'family', title: '家庭和睦', emoji: '👨‍👩‍👧', label: '家庭', desc: '亲密关系与归属感' },
  { id: 'career', title: '事业发展', emoji: '💼', label: '事业', desc: '成就与社会价值' },
  { id: 'freedom', title: '身心自由', emoji: '🕊️', label: '自由', desc: '内在与外在的自由' },
  { id: 'create', title: '创意表达', emoji: '🎨', label: '创造', desc: '表达与艺术创作' },
  { id: 'learn', title: '持续成长', emoji: '📚', label: '学习', desc: '知识与智慧增长' },
  { id: 'wealth', title: '财富自由', emoji: '💰', label: '财富', desc: '物质丰盛与安全感' },
  { id: 'relation', title: '人际和谐', emoji: '🤝', label: '关系', desc: '人际连接与信任' },
  { id: 'peace', title: '内心平静', emoji: '🧘', label: '平静', desc: '内心安宁与临在' },
  { id: 'spirit', title: '灵性成长', emoji: '✨', label: '灵性', desc: '超越自我的联结' },
];

// 耗散态选项
export const DRAIN_STATES: BodyState[] = [
  {
    id: 'custom',
    emoji: '✍️',
    label: '自定义',
    color: 'rgba(150,150,180,0.6)',
    borderColor: 'rgba(150,150,180,0.4)',
    tags: [],
    isCustom: true,
  },
  {
    id: 'heat',
    emoji: '🔥',
    label: '燥热/紧绷',
    desc: '焦虑、愤怒、急躁',
    color: 'rgba(180,40,40,0.3)',
    borderColor: 'rgba(220,80,80,0.5)',
    tags: ['#情绪失控', '#战斗或逃跑'],
    isCustom: false,
  },
  {
    id: 'fog',
    emoji: '🌫️',
    label: '沉重/模糊',
    desc: '拖延、迷茫、无力感',
    color: 'rgba(80,80,100,0.3)',
    borderColor: 'rgba(120,120,160,0.4)',
    tags: ['#行动瘫痪', '#低动力'],
    isCustom: false,
  },
  {
    id: 'stiff',
    emoji: '🛡️',
    label: '僵硬/收缩',
    desc: '恐惧、防御、自我压抑',
    color: 'rgba(60,60,120,0.3)',
    borderColor: 'rgba(100,100,180,0.4)',
    tags: ['#自我压抑', '#讨好模式'],
    isCustom: false,
  },
  {
    id: 'spin',
    emoji: '🌀',
    label: '空转/虚浮',
    desc: '虚假忙碌、逃避、刷屏',
    color: 'rgba(100,60,140,0.3)',
    borderColor: 'rgba(140,80,180,0.4)',
    tags: ['#逃避现实', '#注意力碎片化'],
    isCustom: false,
  },
  {
    id: 'block',
    emoji: '🧱',
    label: '阻塞/淤堵',
    desc: '委屈、未表达的情绪',
    color: 'rgba(40,80,100,0.3)',
    borderColor: 'rgba(60,120,140,0.4)',
    tags: ['#表达受阻', '#情绪积压'],
    isCustom: false,
  },
];

// 聚能态选项
export const FLOW_STATES: BodyState[] = [
  {
    id: 'custom',
    emoji: '✍️',
    label: '自定义',
    color: 'rgba(150,150,180,0.6)',
    borderColor: 'rgba(150,150,180,0.4)',
    tags: [],
    isCustom: true,
  },
  {
    id: 'flow',
    emoji: '🌊',
    label: '流动/轻盈',
    desc: '专注、平静、心流',
    color: 'rgba(0,100,140,0.3)',
    borderColor: 'rgba(0,160,200,0.5)',
    tags: ['#心流状态', '#高效能'],
    isCustom: false,
  },
  {
    id: 'clarity',
    emoji: '✨',
    label: '通透/扩张',
    desc: '慈悲、喜悦、顿悟',
    color: 'rgba(120,100,0,0.3)',
    borderColor: 'rgba(200,180,0,0.4)',
    tags: ['#高频能量', '#灵性时刻'],
    isCustom: false,
  },
  {
    id: 'ground',
    emoji: '🌱',
    label: '扎根/稳固',
    desc: '定力、自律、临在',
    color: 'rgba(0,80,40,0.3)',
    borderColor: 'rgba(0,140,80,0.4)',
    tags: ['#意志力', '#当下临在'],
    isCustom: false,
  },
  {
    id: 'sharp',
    emoji: '💎',
    label: '锐利/精准',
    desc: '洞察、决断、逻辑闭环',
    color: 'rgba(0,80,120,0.3)',
    borderColor: 'rgba(0,140,200,0.4)',
    tags: ['#认知闭环', '#决策力'],
    isCustom: false,
  },
];

// 能量计算规则
export const ENERGY_SCORES = {
  DRAIN_BASE: -5,
  DRAIN_AWARENESS_BONUS: 10,
  FLOW_BASE: 5,
  FLOW_MULTIPLIER: 1.0,
  RECORD_WITH_VISION_BONUS: 10,
  RECORD_BASE: 5,
  COMMITMENT_BONUS: 20,
};
```

**Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: 添加类型定义"
```

---

### Task 2.2: 创建主题系统

**Files:**
- Create: `src/utils/theme.ts`

**Step 1: 创建主题文件**

```typescript
// src/utils/theme.ts
// Theme System for Energy Ledger

export const colors = {
  // 背景色
  background: {
    primary: '#0a0f1e',
    secondary: '#0d1b3e',
  },
  
  // 聚能色 - 青色/金色
  flow: {
    primary: '#00d4d4',
    secondary: '#00b4b4',
    light: 'rgba(0, 212, 212, 0.15)',
    glow: 'rgba(0, 220, 200, 0.3)',
  },
  
  // 耗散色 - 柔和紫/浊橙
  drain: {
    primary: '#a060e0',
    secondary: '#8040c0',
    light: 'rgba(160, 80, 220, 0.15)',
    glow: 'rgba(160, 80, 220, 0.3)',
  },
  
  // 转念色 - 金色
  transform: {
    primary: '#ffb400',
    secondary: '#ff9500',
    light: 'rgba(255, 180, 0, 0.15)',
    glow: 'rgba(255, 200, 0, 0.3)',
  },
  
  // 通用色
  white: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    muted: 'rgba(255, 255, 255, 0.35)',
    subtle: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.08)',
  },
  
  // 状态色
  success: 'rgba(0, 180, 100, 0.8)',
  warning: 'rgba(255, 180, 0, 0.9)',
  danger: 'rgba(220, 60, 60, 0.8)',
};

export const spacing = {
  xs: '8rpx',
  sm: '16rpx',
  md: '24rpx',
  lg: '32rpx',
  xl: '40rpx',
  '2xl': '48rpx',
  '3xl': '64rpx',
  '4xl': '80rpx',
};

export const fontSize = {
  xs: '20rpx',
  sm: '22rpx',
  md: '24rpx',
  lg: '26rpx',
  xl: '28rpx',
  '2xl': '30rpx',
  '3xl': '32rpx',
  '4xl': '36rpx',
  '5xl': '40rpx',
  '6xl': '44rpx',
};

export const borderRadius = {
  sm: '16rpx',
  md: '24rpx',
  lg: '32rpx',
  xl: '40rpx',
  '2xl': '48rpx',
  full: '9999rpx',
};
```

**Step 2: Commit**

```bash
git add src/utils/theme.ts
git commit -m "feat: 添加主题系统"
```

---

## Phase 3: 数据层和状态管理

### Task 3.1: 创建存储层

**Files:**
- Create: `src/store/storage.ts`

**Step 1: 创建存储文件**

```typescript
// src/store/storage.ts
import Taro from '@tarojs/taro';
import { Vision, EnergyRecord, Commitment, UserStats, AiConfig } from '@/types';

// ==================== Utility Functions ====================

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== Vision CRUD ====================

export async function getVisions(): Promise<Vision[]> {
  try {
    const { data } = await Taro.getStorage({ key: 'visions' });
    return data || [];
  } catch {
    return [];
  }
}

export async function addVision(vision: Omit<Vision, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vision> {
  const now = Date.now();
  const newVision: Vision = {
    ...vision,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    energyScore: 0,
  };
  
  const visions = await getVisions();
  visions.unshift(newVision);
  await Taro.setStorage({ key: 'visions', data: visions });
  
  return newVision;
}

export async function updateVision(id: string, updates: Partial<Vision>): Promise<void> {
  const visions = await getVisions();
  const index = visions.findIndex(v => v.id === id);
  if (index !== -1) {
    visions[index] = { ...visions[index], ...updates, updatedAt: Date.now() };
    await Taro.setStorage({ key: 'visions', data: visions });
  }
}

export async function deleteVision(id: string): Promise<void> {
  const visions = await getVisions();
  const filtered = visions.filter(v => v.id !== id);
  await Taro.setStorage({ key: 'visions', data: filtered });
}

export async function updateVisionEnergyScore(id: string, delta: number): Promise<void> {
  const visions = await getVisions();
  const index = visions.findIndex(v => v.id === id);
  if (index !== -1) {
    visions[index].energyScore += delta;
    visions[index].updatedAt = Date.now();
    await Taro.setStorage({ key: 'visions', data: visions });
  }
}

// ==================== Energy Record CRUD ====================

export async function getRecords(limit?: number): Promise<EnergyRecord[]> {
  try {
    const { data } = await Taro.getStorage({ key: 'records' });
    let records: EnergyRecord[] = data || [];
    if (limit) records = records.slice(0, limit);
    return records;
  } catch {
    return [];
  }
}

export async function getRecordsByDate(date: string): Promise<EnergyRecord[]> {
  const startOfDay = new Date(date).setHours(0, 0, 0, 0);
  const endOfDay = new Date(date).setHours(23, 59, 59, 999);
  
  const records = await getRecords();
  return records.filter(r => r.createdAt >= startOfDay && r.createdAt <= endOfDay);
}

export async function addRecord(record: Omit<EnergyRecord, 'id' | 'createdAt'>): Promise<EnergyRecord> {
  const now = Date.now();
  const newRecord: EnergyRecord = {
    ...record,
    id: generateId(),
    createdAt: now,
  };
  
  const records = await getRecords();
  records.unshift(newRecord);
  await Taro.setStorage({ key: 'records', data: records });
  
  return newRecord;
}

export async function updateRecordAiReport(id: string, report: EnergyRecord['aiReport']): Promise<void> {
  const records = await getRecords();
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) {
    records[index].hasAiReport = true;
    records[index].aiReport = report;
    await Taro.setStorage({ key: 'records', data: records });
  }
}

export async function deleteRecord(id: string): Promise<void> {
  const records = await getRecords();
  const filtered = records.filter(r => r.id !== id);
  await Taro.setStorage({ key: 'records', data: filtered });
}

// ==================== Commitment CRUD ====================

export async function getActiveCommitments(): Promise<Commitment[]> {
  try {
    const { data } = await Taro.getStorage({ key: 'commitments' });
    const commitments: Commitment[] = data || [];
    return commitments.filter(c => c.status === 'active').slice(0, 3);
  } catch {
    return [];
  }
}

export async function getCommitments(limit?: number): Promise<Commitment[]> {
  try {
    const { data } = await Taro.getStorage({ key: 'commitments' });
    let commitments: Commitment[] = data || [];
    if (limit) commitments = commitments.slice(0, limit);
    return commitments;
  } catch {
    return [];
  }
}

export async function addCommitment(commitment: Omit<Commitment, 'id' | 'createdAt' | 'status'>): Promise<Commitment> {
  const now = Date.now();
  const newCommitment: Commitment = {
    ...commitment,
    id: generateId(),
    createdAt: now,
    status: 'active',
  };
  
  const commitments = await getCommitments();
  commitments.unshift(newCommitment);
  await Taro.setStorage({ key: 'commitments', data: commitments });
  
  return newCommitment;
}

export async function completeCommitment(id: string): Promise<void> {
  const commitments = await getCommitments();
  const index = commitments.findIndex(c => c.id === id);
  if (index !== -1) {
    commitments[index].status = 'completed';
    await Taro.setStorage({ key: 'commitments', data: commitments });
  }
}

export async function failCommitment(id: string, reason?: string, tag?: string): Promise<void> {
  const commitments = await getCommitments();
  const index = commitments.findIndex(c => c.id === id);
  if (index !== -1) {
    commitments[index].status = 'failed';
    commitments[index].failReason = reason;
    commitments[index].failTag = tag;
    await Taro.setStorage({ key: 'commitments', data: commitments });
  }
}

export async function deleteCommitment(id: string): Promise<void> {
  const commitments = await getCommitments();
  const filtered = commitments.filter(c => c.id !== id);
  await Taro.setStorage({ key: 'commitments', data: filtered });
}

// ==================== Statistics ====================

export async function getUserStats(): Promise<UserStats> {
  try {
    const { data } = await Taro.getStorage({ key: 'user_stats' });
    return data || {
      totalEnergy: 0,
      streak: 0,
      maxStreak: 0,
      lastRecordDate: '',
      completedCommitments: 0,
    };
  } catch {
    return {
      totalEnergy: 0,
      streak: 0,
      maxStreak: 0,
      lastRecordDate: '',
      completedCommitments: 0,
    };
  }
}

export async function updateUserStats(updates: Partial<UserStats>): Promise<void> {
  const current = await getUserStats();
  const updated = { ...current, ...updates };
  await Taro.setStorage({ key: 'user_stats', data: updated });
}

// ==================== App State ====================

export async function getHasOnboarded(): Promise<boolean> {
  try {
    const { data } = await Taro.getStorage({ key: 'has_onboarded' });
    return data === true;
  } catch {
    return false;
  }
}

export async function setHasOnboarded(value: boolean): Promise<void> {
  await Taro.setStorage({ key: 'has_onboarded', data: value });
}

export async function getAiConfig(): Promise<AiConfig | null> {
  try {
    const { data } = await Taro.getStorage({ key: 'ai_config' });
    return data || null;
  } catch {
    return null;
  }
}

export async function setAiConfig(config: AiConfig): Promise<void> {
  await Taro.setStorage({ key: 'ai_config', data: config });
}

export async function deleteAiConfig(): Promise<void> {
  await Taro.removeStorage({ key: 'ai_config' });
}
```

**Step 2: Commit**

```bash
git add src/store/storage.ts
git commit -m "feat: 添加存储层"
```

---

### Task 3.2: 创建状态管理 Context

**Files:**
- Create: `src/store/AppContext.tsx`

**Step 1: 创建 Context 文件**

```typescript
// src/store/AppContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Vision, EnergyRecord, Commitment, UserStats, AiConfig, ENERGY_SCORES } from '@/types';
import * as Storage from './storage';

interface AppContextType {
  // State
  visions: Vision[];
  records: EnergyRecord[];
  activeCommitments: Commitment[];
  stats: UserStats;
  hasOnboarded: boolean;
  isLoading: boolean;
  aiConfig: AiConfig | null;
  
  // Actions
  refreshVisions: () => Promise<void>;
  addVision: (vision: Omit<Vision, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Vision>;
  updateVision: (id: string, updates: Partial<Vision>) => Promise<void>;
  deleteVision: (id: string) => Promise<void>;
  
  refreshRecords: () => Promise<void>;
  addRecord: (record: Omit<EnergyRecord, 'id' | 'createdAt'>) => Promise<EnergyRecord>;
  updateRecordAiReport: (id: string, report: EnergyRecord['aiReport']) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  
  refreshActiveCommitments: () => Promise<void>;
  addCommitment: (commitment: Omit<Commitment, 'id' | 'createdAt' | 'status'>) => Promise<Commitment>;
  completeCommitment: (id: string) => Promise<void>;
  failCommitment: (id: string, reason?: string, tag?: string) => Promise<void>;
  deleteCommitment: (id: string) => Promise<void>;
  
  refreshStats: () => Promise<void>;
  updateStats: (updates: Partial<UserStats>) => Promise<void>;
  
  completeOnboarding: () => Promise<void>;
  
  saveAiConfig: (config: AiConfig) => Promise<void>;
  clearAiConfig: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [visions, setVisions] = useState<Vision[]>([]);
  const [records, setRecords] = useState<EnergyRecord[]>([]);
  const [activeCommitments, setActiveCommitments] = useState<Commitment[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalEnergy: 0,
    streak: 0,
    maxStreak: 0,
    lastRecordDate: '',
    completedCommitments: 0,
  });
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aiConfig, setAiConfigState] = useState<AiConfig | null>(null);
  
  // Initialize on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [loadedVisions, loadedRecords, loadedCommitments, loadedStats, onboarded, loadedAiConfig] = await Promise.all([
          Storage.getVisions(),
          Storage.getRecords(50),
          Storage.getActiveCommitments(),
          Storage.getUserStats(),
          Storage.getHasOnboarded(),
          Storage.getAiConfig(),
        ]);
        
        setVisions(loadedVisions);
        setRecords(loadedRecords);
        setActiveCommitments(loadedCommitments);
        setStats(loadedStats);
        setHasOnboarded(onboarded);
        setAiConfigState(loadedAiConfig);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Vision actions
  const refreshVisions = async () => {
    const data = await Storage.getVisions();
    setVisions(data);
  };
  
  const addVision = async (vision: Omit<Vision, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newVision = await Storage.addVision(vision);
    setVisions(prev => [...prev, newVision]);
    return newVision;
  };
  
  const updateVision = async (id: string, updates: Partial<Vision>) => {
    await Storage.updateVision(id, updates);
    setVisions(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };
  
  const deleteVision = async (id: string) => {
    const commitmentsToDelete = activeCommitments.filter(c => c.visionId === id && c.status === 'active');
    for (const commitment of commitmentsToDelete) {
      await Storage.deleteCommitment(commitment.id);
    }
    
    await Storage.deleteVision(id);
    setVisions(prev => prev.filter(v => v.id !== id));
    
    if (commitmentsToDelete.length > 0) {
      setActiveCommitments(prev => prev.filter(c => c.visionId !== id));
    }
  };
  
  // Record actions
  const refreshRecords = async () => {
    const data = await Storage.getRecords(50);
    setRecords(data);
  };
  
  const addRecord = async (record: Omit<EnergyRecord, 'id' | 'createdAt'>) => {
    const newRecord = await Storage.addRecord(record);
    setRecords(prev => [newRecord, ...prev]);
    
    if (record.visions.length > 0) {
      const energyPerVision = Math.floor(ENERGY_SCORES.RECORD_WITH_VISION_BONUS / record.visions.length);
      for (const visionId of record.visions) {
        await Storage.updateVisionEnergyScore(visionId, energyPerVision);
      }
      setVisions(prev => prev.map(v => 
        record.visions.includes(v.id)
          ? { ...v, energyScore: v.energyScore + energyPerVision, updatedAt: Date.now() }
          : v
      ));
    }
    
    const newTotalEnergy = stats.totalEnergy + record.score;
    const today = new Date().toISOString().split('T')[0];
    const isConsecutiveDay = stats.lastRecordDate === new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = isConsecutiveDay ? stats.streak + 1 : (stats.lastRecordDate === today ? stats.streak : 1);
    
    const newStats = {
      totalEnergy: newTotalEnergy,
      streak: newStreak,
      maxStreak: Math.max(stats.maxStreak, newStreak),
      lastRecordDate: today,
    };
    
    await Storage.updateUserStats(newStats);
    setStats(prev => ({ ...prev, ...newStats }));
    
    return newRecord;
  };
  
  const updateRecordAiReport = async (id: string, report: EnergyRecord['aiReport']) => {
    await Storage.updateRecordAiReport(id, report);
    setRecords(prev => prev.map(r => r.id === id ? { ...r, hasAiReport: true, aiReport: report } : r));
  };
  
  const deleteRecord = async (id: string) => {
    await Storage.deleteRecord(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };
  
  // Commitment actions
  const refreshActiveCommitments = async () => {
    const data = await Storage.getActiveCommitments();
    setActiveCommitments(data);
  };
  
  const addCommitment = async (commitment: Omit<Commitment, 'id' | 'createdAt' | 'status'>) => {
    const newCommitment = await Storage.addCommitment(commitment);
    setActiveCommitments(prev => [...prev, newCommitment]);
    return newCommitment;
  };
  
  const completeCommitment = async (id: string) => {
    const commitment = activeCommitments.find(c => c.id === id);
    if (!commitment) {
      console.warn('Commitment not found:', id);
      return;
    }
    
    await Storage.completeCommitment(id);
    await refreshActiveCommitments();
    
    if (commitment.visionId) {
      await Storage.updateVisionEnergyScore(commitment.visionId, ENERGY_SCORES.COMMITMENT_BONUS);
      setVisions(prev => prev.map(v => 
        v.id === commitment.visionId 
          ? { ...v, energyScore: v.energyScore + ENERGY_SCORES.COMMITMENT_BONUS, updatedAt: Date.now() }
          : v
      ));
    }
    
    const newCompletedCount = stats.completedCommitments + 1;
    await Storage.updateUserStats({ completedCommitments: newCompletedCount });
    setStats(prev => ({ ...prev, completedCommitments: newCompletedCount }));
  };
  
  const failCommitment = async (id: string, reason?: string, tag?: string) => {
    await Storage.failCommitment(id, reason, tag);
    await refreshActiveCommitments();
  };
  
  const deleteCommitment = async (id: string) => {
    await Storage.deleteCommitment(id);
    setActiveCommitments(prev => prev.filter(c => c.id !== id));
  };
  
  // Stats actions
  const refreshStats = async () => {
    const data = await Storage.getUserStats();
    setStats(data);
  };
  
  const updateStats = async (updates: Partial<UserStats>) => {
    await Storage.updateUserStats(updates);
    setStats(prev => ({ ...prev, ...updates }));
  };
  
  // Onboarding
  const completeOnboarding = async () => {
    await Storage.setHasOnboarded(true);
    setHasOnboarded(true);
  };
  
  const saveAiConfig = async (config: AiConfig) => {
    await Storage.setAiConfig(config);
    setAiConfigState(config);
  };
  
  const clearAiConfig = async () => {
    await Storage.deleteAiConfig();
    setAiConfigState(null);
  };
  
  return (
    <AppContext.Provider
      value={{
        visions,
        records,
        activeCommitments,
        stats,
        hasOnboarded,
        isLoading,
        aiConfig,
        refreshVisions,
        addVision,
        updateVision,
        deleteVision,
        refreshRecords,
        addRecord,
        updateRecordAiReport,
        deleteRecord,
        refreshActiveCommitments,
        addCommitment,
        completeCommitment,
        failCommitment,
        deleteCommitment,
        refreshStats,
        updateStats,
        completeOnboarding,
        saveAiConfig,
        clearAiConfig,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
```

**Step 2: 创建导出文件**

```typescript
// src/store/index.ts
export { AppProvider, useApp } from './AppContext';
export * from './storage';
```

**Step 3: Commit**

```bash
git add src/store/
git commit -m "feat: 添加状态管理 Context"
```

---

## Phase 4: AI 服务

### Task 4.1: 创建 AI 服务

**Files:**
- Create: `src/services/ai.ts`

**Step 1: 创建 AI 服务文件**

```typescript
// src/services/ai.ts
import Taro from '@tarojs/taro';
import { EnergyRecord, Vision, AiReport, AiConfig } from '@/types';

const AI_SYSTEM_PROMPT = `你是一位融合心理学、灵性修行和神经科学视角的能量分析师。

当用户分享他们的能量状态记录时，请从以下三个角度进行分析：

1. 心理学视角：从存在主义、斯多葛心理学或东方心理学角度解读这个状态
2. 神经科学分析：解释可能的大脑机制、神经递质变化
3. 个性化建议：给出具体、可执行的改进建议

请用温和、支持性的语气，帮助用户理解自己，而不是评判。`;

export async function analyzeRecord(
  record: EnergyRecord,
  visions: Vision[],
  config: AiConfig
): Promise<AiReport> {
  const prompt = buildPrompt(record, visions);
  
  try {
    const response = await Taro.request({
      url: config.apiUrl,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: config.model,
        messages: [
          { role: 'system', content: AI_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]
      }
    });
    
    return parseAiReport(response.data, record.type);
  } catch (error) {
    console.error('AI analysis failed:', error);
    throw new Error('AI 分析失败，请检查网络或 API 配置');
  }
}

function buildPrompt(record: EnergyRecord, visions: Vision[]): string {
  const visionLabels = record.visions
    .map(id => visions.find(v => v.id === id)?.label)
    .filter(Boolean)
    .join('、');
  
  const typeText = record.type === 'flow' ? '聚能态' : '耗散态';
  const bodyStateText = record.customBodyState || record.bodyStateId;
  
  return `用户记录了一条${typeText}能量：

状态：${bodyStateText}
关联愿景：${visionLabels || '未关联'}
能量得分：${record.score}

用户日志：
"${record.journal}"

请从心理学、神经科学、个人成长三个角度进行分析，并给出具体建议。请用 JSON 格式返回，包含 philosophy、neuroscience、suggestion 三个字段。`;
}

function parseAiReport(data: any, type: 'flow' | 'drain'): AiReport {
  try {
    // 尝试从 OpenAI 格式解析
    const content = data.choices?.[0]?.message?.content || '';
    
    // 尝试提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        philosophy: parsed.philosophy || '无法解析心理学分析',
        neuroscience: parsed.neuroscience || '无法解析神经科学分析',
        suggestion: parsed.suggestion || '无法解析建议',
        generatedAt: Date.now(),
      };
    }
    
    // 如果不是 JSON，尝试按段落分割
    const lines = content.split('\n').filter((l: string) => l.trim());
    return {
      philosophy: lines[0] || '暂无分析',
      neuroscience: lines[1] || '暂无分析',
      suggestion: lines[2] || '暂无建议',
      generatedAt: Date.now(),
    };
  } catch (error) {
    console.error('Parse AI report failed:', error);
    return {
      philosophy: '解析失败',
      neuroscience: '解析失败',
      suggestion: '解析失败',
      generatedAt: Date.now(),
    };
  }
}
```

**Step 2: Commit**

```bash
git add src/services/ai.ts
git commit -m "feat: 添加 AI 分析服务"
```

---

## Phase 5: 公共组件

### Task 5.1: 创建能量球组件

**Files:**
- Create: `src/components/EnergyBall/index.tsx`
- Create: `src/components/EnergyBall/index.scss`

**Step 1: 创建组件**

```tsx
// src/components/EnergyBall/index.tsx
import { View, Text } from '@tarojs/components';
import './index.scss';

interface EnergyBallProps {
  score: number;
  type?: 'flow' | 'drain';
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

export default function EnergyBall({ 
  score, 
  type = 'flow', 
  size = 'large',
  onPress 
}: EnergyBallProps) {
  const handlePress = () => {
    Taro.vibrateShort({ type: 'light' });
    onPress?.();
  };
  
  return (
    <View 
      className={`energy-ball energy-ball--${type} energy-ball--${size}`}
      onClick={handlePress}
    >
      <Text className="energy-ball__score">{score}</Text>
      <Text className="energy-ball__label">能量值</Text>
    </View>
  );
}
```

```scss
// src/components/EnergyBall/index.scss

.energy-ball {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:active {
    transform: scale(0.95);
  }
  
  &--large {
    width: 400rpx;
    height: 400rpx;
  }
  
  &--medium {
    width: 200rpx;
    height: 200rpx;
  }
  
  &--small {
    width: 100rpx;
    height: 100rpx;
  }
  
  &--flow {
    background: linear-gradient(135deg, #00d4d4, #00b4b4);
    box-shadow: 0 0 80rpx rgba(0, 212, 212, 0.5);
  }
  
  &--drain {
    background: linear-gradient(135deg, #a060e0, #8040c0);
    box-shadow: 0 0 80rpx rgba(160, 80, 220, 0.5);
  }
  
  &__score {
    color: #fff;
    font-weight: bold;
  }
  
  &--large &__score {
    font-size: 96rpx;
  }
  
  &--medium &__score {
    font-size: 48rpx;
  }
  
  &--small &__score {
    font-size: 24rpx;
  }
  
  &__label {
    color: rgba(255, 255, 255, 0.7);
    margin-top: 8rpx;
  }
  
  &--large &__label {
    font-size: 28rpx;
  }
  
  &--medium &__label {
    font-size: 20rpx;
  }
  
  &--small &__label {
    display: none;
  }
}
```

**Step 2: Commit**

```bash
git add src/components/EnergyBall/
git commit -m "feat: 添加能量球组件"
```

---

### Task 5.2: 创建按钮组件

**Files:**
- Create: `src/components/Button/index.tsx`
- Create: `src/components/Button/index.scss`

**Step 1: 创建组件**

```tsx
// src/components/Button/index.tsx
import { View, Text } from '@tarojs/components';
import './index.scss';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  block?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export default function Button({
  children,
  type = 'primary',
  size = 'medium',
  block = false,
  disabled = false,
  onPress,
}: ButtonProps) {
  const handlePress = () => {
    if (disabled) return;
    Taro.vibrateShort({ type: 'light' });
    onPress?.();
  };
  
  return (
    <View
      className={`
        btn 
        btn--${type} 
        btn--${size}
        ${block ? 'btn--block' : ''}
        ${disabled ? 'btn--disabled' : ''}
      `}
      onClick={handlePress}
    >
      <Text className="btn__text">{children}</Text>
    </View>
  );
}
```

```scss
// src/components/Button/index.scss

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 48rpx;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:active:not(.btn--disabled) {
    transform: scale(0.98);
    opacity: 0.9;
  }
  
  &--block {
    width: 100%;
  }
  
  &--small {
    padding: 16rpx 32rpx;
    font-size: 24rpx;
  }
  
  &--medium {
    padding: 24rpx 48rpx;
    font-size: 28rpx;
  }
  
  &--large {
    padding: 32rpx 64rpx;
    font-size: 32rpx;
  }
  
  &--primary {
    background: linear-gradient(135deg, #00d4d4, #00b4b4);
    color: #fff;
  }
  
  &--secondary {
    background: rgba(255, 255, 255, 0.1);
    border: 2rpx solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
  }
  
  &--danger {
    background: rgba(220, 60, 60, 0.8);
    color: #fff;
  }
  
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &__text {
    color: inherit;
  }
}
```

**Step 2: Commit**

```bash
git add src/components/Button/
git commit -m "feat: 添加按钮组件"
```

---

### Task 5.3: 创建卡片组件

**Files:**
- Create: `src/components/Card/index.tsx`
- Create: `src/components/Card/index.scss`

**Step 1: 创建组件**

```tsx
// src/components/Card/index.tsx
import { View } from '@tarojs/components';
import './index.scss';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

export default function Card({ children, className = '', onPress }: CardProps) {
  return (
    <View 
      className={`card ${className}`}
      onClick={onPress}
    >
      {children}
    </View>
  );
}
```

```scss
// src/components/Card/index.scss

.card {
  background: rgba(255, 255, 255, 0.05);
  border: 2rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}
```

**Step 2: Commit**

```bash
git add src/components/Card/
git commit -m "feat: 添加卡片组件"
```

---

## Phase 6: 页面开发

### Task 6.1: 创建引导页

**Files:**
- Create: `src/pages/onboarding/index.tsx`
- Create: `src/pages/onboarding/index.scss`
- Create: `src/pages/onboarding/index.config.ts`
- Modify: `src/app.config.ts`

**Step 1: 创建页面配置**

```typescript
// src/pages/onboarding/index.config.ts
export default definePageConfig({
  navigationBarTitleText: '欢迎使用功过格',
  navigationBarBackgroundColor: '#0a0f1e',
  navigationBarTextStyle: 'white',
});
```

**Step 2: 创建页面组件**

```tsx
// src/pages/onboarding/index.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useApp } from '@/store';
import { PRESET_VISIONS } from '@/types';
import Button from '@/components/Button';
import './index.scss';

export default function Onboarding() {
  const { addVision, completeOnboarding, visions, isLoading } = useApp();
  const [selectedVisions, setSelectedVisions] = useState<string[]>([]);
  const [step, setStep] = useState<'welcome' | 'select'>('welcome');
  
  useEffect(() => {
    if (!isLoading && visions.length > 0) {
      Taro.redirectTo({ url: '/pages/home/index' });
    }
  }, [isLoading, visions]);
  
  const toggleVision = (visionId: string) => {
    setSelectedVisions(prev => {
      if (prev.includes(visionId)) {
        return prev.filter(id => id !== visionId);
      }
      if (prev.length >= 5) {
        Taro.showToast({ title: '最多选择5个愿景', icon: 'none' });
        return prev;
      }
      return [...prev, visionId];
    });
    Taro.vibrateShort({ type: 'light' });
  };
  
  const handleComplete = async () => {
    if (selectedVisions.length === 0) {
      Taro.showToast({ title: '请至少选择一个愿景', icon: 'none' });
      return;
    }
    
    Taro.showLoading({ title: '创建愿景...' });
    
    for (const visionId of selectedVisions) {
      const preset = PRESET_VISIONS.find(v => v.id === visionId);
      if (preset) {
        await addVision({
          title: preset.title,
          emoji: preset.emoji,
          label: preset.label,
          desc: preset.desc,
        });
      }
    }
    
    await completeOnboarding();
    Taro.hideLoading();
    
    Taro.redirectTo({ url: '/pages/home/index' });
  };
  
  if (isLoading) {
    return (
      <View className="onboarding">
        <Text className="onboarding__loading">加载中...</Text>
      </View>
    );
  }
  
  return (
    <View className="onboarding">
      {step === 'welcome' && (
        <View className="onboarding__welcome">
          <Text className="onboarding__title">功过格</Text>
          <Text className="onboarding__subtitle">能量觉察 · 自我修行</Text>
          <Text className="onboarding__desc">
            这是一面映照内在能量流动的镜子。
            我们不问"我有没有做错"，
            而是问："此刻，我的能量是耗散还是聚能？"
          </Text>
          <Button block onPress={() => setStep('select')}>
            开始设置愿景
          </Button>
        </View>
      )}
      
      {step === 'select' && (
        <View className="onboarding__select">
          <Text className="onboarding__tip">选择 1-5 个你最看重的愿景</Text>
          
          <ScrollView scrollY className="onboarding__list">
            {PRESET_VISIONS.map(vision => (
              <View
                key={vision.id}
                className={`vision-card ${selectedVisions.includes(vision.id) ? 'vision-card--selected' : ''}`}
                onClick={() => toggleVision(vision.id)}
              >
                <Text className="vision-card__emoji">{vision.emoji}</Text>
                <View className="vision-card__content">
                  <Text className="vision-card__title">{vision.title}</Text>
                  <Text className="vision-card__desc">{vision.desc}</Text>
                </View>
                {selectedVisions.includes(vision.id) && (
                  <Text className="vision-card__check">✓</Text>
                )}
              </View>
            ))}
          </ScrollView>
          
          <View className="onboarding__footer">
            <Text className="onboarding__count">已选择 {selectedVisions.length}/5</Text>
            <Button block onPress={handleComplete}>
              完成
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
```

**Step 3: 创建样式**

```scss
// src/pages/onboarding/index.scss

.onboarding {
  min-height: 100vh;
  background: linear-gradient(180deg, #0d1b3e, #0a1628);
  padding: 80rpx 40rpx;
  
  &__loading {
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    padding-top: 200rpx;
  }
  
  &__welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 160rpx;
  }
  
  &__title {
    font-size: 80rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 24rpx;
  }
  
  &__subtitle {
    font-size: 32rpx;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 80rpx;
  }
  
  &__desc {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.8;
    text-align: center;
    padding: 0 40rpx;
    margin-bottom: 80rpx;
  }
  
  &__select {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 160rpx);
  }
  
  &__tip {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
    margin-bottom: 32rpx;
  }
  
  &__list {
    flex: 1;
    overflow: hidden;
  }
  
  &__footer {
    padding: 32rpx 0;
    border-top: 2rpx solid rgba(255, 255, 255, 0.08);
  }
  
  &__count {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    margin-bottom: 24rpx;
    display: block;
  }
}

.vision-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 2rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  transition: all 0.2s ease;
  
  &--selected {
    background: rgba(0, 212, 212, 0.15);
    border-color: rgba(0, 212, 212, 0.3);
  }
  
  &__emoji {
    font-size: 48rpx;
    margin-right: 24rpx;
  }
  
  &__content {
    flex: 1;
  }
  
  &__title {
    font-size: 32rpx;
    color: #fff;
    font-weight: 500;
    display: block;
    margin-bottom: 8rpx;
  }
  
  &__desc {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.5);
    display: block;
  }
  
  &__check {
    font-size: 36rpx;
    color: #00d4d4;
    margin-left: 16rpx;
  }
}
```

**Step 4: 注册页面**

```typescript
// src/app.config.ts
export default defineAppConfig({
  pages: [
    'pages/onboarding/index',
    'pages/home/index',
    // ... 其他页面
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#0a0f1e',
    navigationBarTitleText: '功过格',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0a0f1e',
  },
  tabBar: {
    color: 'rgba(255,255,255,0.5)',
    selectedColor: '#00d4d4',
    backgroundColor: '#0a0f1e',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/home/index', text: '首页', iconPath: '...', selectedIconPath: '...' },
      { pagePath: 'pages/stats/index', text: '统计', iconPath: '...', selectedIconPath: '...' },
      { pagePath: 'pages/contract/index', text: '契约', iconPath: '...', selectedIconPath: '...' },
      { pagePath: 'pages/insights/index', text: '洞察', iconPath: '...', selectedIconPath: '...' },
    ],
  },
});
```

**Step 5: Commit**

```bash
git add src/pages/onboarding/ src/app.config.ts
git commit -m "feat: 添加引导页"
```

---

### Task 6.2: 创建首页

**Files:**
- Create: `src/pages/home/index.tsx`
- Create: `src/pages/home/index.scss`
- Create: `src/pages/home/index.config.ts`

**Step 1: 创建页面配置**

```typescript
// src/pages/home/index.config.ts
export default definePageConfig({
  navigationBarTitleText: '功过格',
});
```

**Step 2: 创建页面组件（核心逻辑，简化版）**

```tsx
// src/pages/home/index.tsx
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useApp } from '@/store';
import EnergyBall from '@/components/EnergyBall';
import Button from '@/components/Button';
import Card from '@/components/Card';
import './index.scss';

export default function Home() {
  const { stats, visions, records, isLoading } = useApp();
  
  const handleRecord = (type: 'flow' | 'drain') => {
    Taro.navigateTo({
      url: `/pages/record/index?type=${type}`
    });
  };
  
  const todayRecords = records.filter(r => {
    const today = new Date().toDateString();
    return new Date(r.createdAt).toDateString() === today;
  });
  
  if (isLoading) {
    return <View className="home"><Text>加载中...</Text></View>;
  }
  
  return (
    <View className="home">
      {/* 能量球 */}
      <View className="home__energy">
        <EnergyBall 
          score={stats.totalEnergy} 
          type={stats.totalEnergy >= 0 ? 'flow' : 'drain'}
          onPress={() => handleRecord('flow')}
        />
        <Text className="home__streak">🔥 连续觉察 {stats.streak} 天</Text>
      </View>
      
      {/* 愿景标签 */}
      <ScrollView scrollX className="home__visions">
        {visions.map(vision => (
          <View key={vision.id} className="vision-tag">
            <Text>{vision.emoji} {vision.label}</Text>
          </View>
        ))}
      </ScrollView>
      
      {/* 操作按钮 */}
      <View className="home__actions">
        <Button type="secondary" onPress={() => handleRecord('drain')}>
          🔴 耗散
        </Button>
        <Button type="primary" onPress={() => handleRecord('flow')}>
          🟢 聚能
        </Button>
      </View>
      
      {/* 今日记录 */}
      <View className="home__records">
        <Text className="home__records-title">今日记录</Text>
        {todayRecords.map(record => (
          <Card key={record.id}>
            <Text>{record.type === 'flow' ? '🟢' : '🔴'} {record.journal}</Text>
          </Card>
        ))}
      </View>
    </View>
  );
}
```

**Step 3: 创建样式（简化版）**

```scss
// src/pages/home/index.scss

.home {
  min-height: 100vh;
  background: linear-gradient(180deg, #0d1b3e, #0a1628);
  padding: 40rpx;
  
  &__energy {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80rpx 0;
  }
  
  &__streak {
    margin-top: 32rpx;
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.7);
  }
  
  &__visions {
    white-space: nowrap;
    padding: 24rpx 0;
  }
  
  &__actions {
    display: flex;
    justify-content: space-around;
    padding: 40rpx 0;
  }
  
  &__records {
    margin-top: 40rpx;
  }
  
  &__records-title {
    font-size: 32rpx;
    color: #fff;
    font-weight: 500;
    margin-bottom: 24rpx;
    display: block;
  }
}

.vision-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 32rpx;
  padding: 16rpx 32rpx;
  margin-right: 16rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}
```

**Step 4: Commit**

```bash
git add src/pages/home/
git commit -m "feat: 添加首页"
```

---

## 后续任务（简化描述）

由于篇幅限制，后续任务简化描述，实际实现时需完整展开：

### Task 6.3: 记录页
- 复用 Expo `app/record.tsx` 逻辑
- 实现三步流程：身体扫描 → 愿景选择 → 日志输入
- 使用 Taro Picker 替代 WheelPicker

### Task 6.4: 统计页
- 复用 Expo `app/(tabs)/stats.tsx` 逻辑
- 使用 ECharts for 小程序或 Canvas 绘制图表

### Task 6.5: 契约页
- 复用 Expo `app/(tabs)/contract.tsx` 逻辑
- 实现创建/完成/失败承诺流程

### Task 6.6: 洞察页
- 复用 Expo `app/(tabs)/insights.tsx` 逻辑
- 集成 AI 服务

### Task 6.7: 愿景页
- 复用 Expo `app/vision.tsx` 逻辑
- 实现愿景 CRUD

---

## 执行检查清单

每个任务完成后验证：

- [ ] 代码编译通过：`npm run dev:weapp`
- [ ] 无 TypeScript 错误
- [ ] 页面可正常加载
- [ ] 功能符合预期
- [ ] 已提交 git commit

---

## 总结

本计划将功过格微信小程序开发分解为 **6 个阶段，约 20 个具体任务**。

关键复用点：
- 类型定义 100% 复用
- 数据层逻辑 90% 复用（改存储 API）
- 状态管理模式 100% 复用
- 业务逻辑 85% 复用

关键重写点：
- UI 层（WXML/WXSS → Taro 组件）
- 能量球动画（Skia → CSS/Canvas）
- 存储层（SQLite → Taro Storage）
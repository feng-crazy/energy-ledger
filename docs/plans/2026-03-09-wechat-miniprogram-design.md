# 功过格微信小程序设计文档

**创建日期**: 2026-03-09
**状态**: 待实现
**框架**: Taro + React

## 概述

基于现有 Expo React Native 项目，开发微信小程序版本。采用 Taro 框架实现跨端复用，保持功能完整性和视觉一致性。

## 关键决策

| 项目 | 决策 | 理由 |
|------|------|------|
| 框架 | Taro + React | 可复用 React 组件逻辑，一套代码可编译到多端 |
| 数据存储 | 纯本地存储 | wx.setStorage，两平台数据独立 |
| AI 分析 | 接入真实 API | 用户可配置 API Key（DeepSeek/OpenAI 等） |
| 功能范围 | 完整功能 | 6 个主要页面全部实现 |
| 能量球 | 先静态图形 | 使用 CSS 渐变实现，后续可升级为 Canvas |
| 项目位置 | 同级目录 | `/Users/hedengfeng/workspace/tmp/energy-ledger-taro` |

## 项目结构

```
energy-ledger-taro/
├── config/                      # Taro 编译配置
│   ├── index.ts
│   ├── dev.ts
│   └── prod.ts
├── src/
│   ├── app.config.ts            # 小程序全局配置
│   ├── app.tsx                  # 入口组件
│   ├── app.scss                 # 全局样式
│   │
│   ├── pages/                   # 页面目录
│   │   ├── home/                # 首页（能量罗盘）
│   │   │   ├── index.tsx
│   │   │   ├── index.scss
│   │   │   └── index.config.ts
│   │   ├── record/              # 记录页
│   │   ├── stats/               # 统计页
│   │   ├── contract/            # 契约页
│   │   ├── insights/            # 洞察页
│   │   ├── vision/              # 愿景页
│   │   └── onboarding/          # 引导页
│   │
│   ├── components/              # 公共组件
│   │   ├── EnergyBall/          # 能量球组件
│   │   ├── Button/              # 按钮组件
│   │   ├── Card/                # 卡片组件
│   │   ├── Modal/               # 弹窗组件
│   │   └── BodyStateCard/       # 身体状态卡片
│   │
│   ├── store/                   # 状态管理
│   │   ├── AppContext.tsx       # React Context
│   │   └── storage.ts           # 存储层
│   │
│   ├── types/                   # 类型定义
│   │   └── index.ts             # 直接复用 Expo 版本
│   │
│   ├── utils/                   # 工具函数
│   │   ├── theme.ts             # 主题系统
│   │   └── helpers.ts           # 辅助函数
│   │
│   └── services/                # 服务层
│       └── ai.ts                # AI 分析服务
│
├── project.config.json          # 小程序项目配置
├── package.json
└── tsconfig.json
```

## 页面设计

### 1. 首页 (pages/home)

**功能**:
- 能量球展示（静态圆形 + 颜色渐变）
- 能量值显示
- 连续觉察天数
- 愿景标签滚动
- 今日记录列表
- 三个操作按钮：耗散 / 聚能 / 转念

**复用来源**: `app/(tabs)/index.tsx`

**迁移要点**:
- StyleSheet → SCSS
- 能量球从 Skia 改为 CSS 实现
- 触觉反馈: `expo-haptics` → `Taro.vibrateShort()`

### 2. 记录页 (pages/record)

**功能**:
- 三步流程：身体扫描 → 愿景选择 → 日志输入
- 耗散态选项（5 种 + 自定义）
- 聚能态选项（4 种 + 自定义）
- 提交动画和反馈

**复用来源**: `app/record.tsx`

**迁移要点**:
- 滚动选择器: WheelPicker → Taro Picker
- 动画: Reanimated → CSS transition

### 3. 统计页 (pages/stats)

**功能**:
- 周期切换（今日/本周/本月）
- 能量时间轴
- 愿景雷达图
- 月度热力图

**复用来源**: `app/(tabs)/stats.tsx`

**迁移要点**:
- 图表: 使用 ECharts for 小程序 或自绘 Canvas

### 4. 契约页 (pages/contract)

**功能**:
- 有承诺状态展示
- 创建承诺流程
- 倒计时显示
- 完成/失败操作

**复用来源**: `app/(tabs)/contract.tsx`

**迁移要点**:
- 倒计时逻辑直接复用
- 时间选择器: Taro Picker

### 5. 洞察页 (pages/insights)

**功能**:
- 记录列表
- AI 分析按钮
- AI 报告展示

**复用来源**: `app/(tabs)/insights.tsx`

**迁移要点**:
- AI 服务从 Mock 改为真实 API 调用
- 支持用户配置 API Key

### 6. 愿景页 (pages/vision)

**功能**:
- 愿景列表
- 添加/删除/编辑愿景
- 预设愿景选择

**复用来源**: `app/vision.tsx`

**迁移要点**:
- 逻辑直接复用

### 7. 引导页 (pages/onboarding)

**功能**:
- 欢迎界面
- 愿景选择（1-5 个）
- 完成后跳转首页

**复用来源**: `app/onboarding.tsx`

**迁移要点**:
- 逻辑直接复用

## 数据层设计

### 存储层 (storage.ts)

```typescript
// 从 Expo 版本迁移，改用 Taro 存储 API

import Taro from '@tarojs/taro';
import { Vision, EnergyRecord, Commitment, UserStats, AiConfig } from '@/types';

// 愿景
export async function getVisions(): Promise<Vision[]> {
  try {
    const { data } = await Taro.getStorage({ key: 'visions' });
    return data || [];
  } catch {
    return [];
  }
}

export async function saveVisions(visions: Vision[]): Promise<void> {
  await Taro.setStorage({ key: 'visions', data: visions });
}

// 能量记录
export async function getRecords(): Promise<EnergyRecord[]> {
  try {
    const { data } = await Taro.getStorage({ key: 'records' });
    return data || [];
  } catch {
    return [];
  }
}

export async function saveRecords(records: EnergyRecord[]): Promise<void> {
  await Taro.setStorage({ key: 'records', data: records });
}

// ... 其他 CRUD 方法类似
```

### 状态管理 (AppContext.tsx)

```typescript
// 复用 Expo 版本的 Context 模式
// 只需修改存储层调用

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Storage from './storage';

interface AppContextType {
  visions: Vision[];
  records: EnergyRecord[];
  activeCommitments: Commitment[];
  stats: UserStats;
  hasOnboarded: boolean;
  isLoading: boolean;
  aiConfig: AiConfig | null;
  // ... actions
}

// 组件结构和 Expo 版本保持一致
```

## AI 服务设计

```typescript
// services/ai.ts

import Taro from '@tarojs/taro';
import { EnergyRecord, Vision, AiReport, AiConfig } from '@/types';

const AI_SYSTEM_PROMPT = `你是一位哲学、灵性修行和神经科学领域的专家...`;

export async function analyzeRecord(
  record: EnergyRecord,
  visions: Vision[],
  config: AiConfig
): Promise<AiReport> {
  const prompt = buildPrompt(record, visions);
  
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
  
  return parseAiReport(response.data);
}

function buildPrompt(record: EnergyRecord, visions: Vision[]): string {
  const visionLabels = record.visions
    .map(id => visions.find(v => v.id === id)?.label)
    .filter(Boolean)
    .join('、');
  
  return `用户的能量记录：
类型：${record.type === 'flow' ? '聚能' : '耗散'}
状态：${record.bodyStateId}
愿景：${visionLabels}
日志：${record.journal}

请从哲学、神经科学、个人成长三个角度进行分析，并给出建议。`;
}

function parseAiReport(data: any): AiReport {
  // 解析 AI 返回的内容
  // 返回结构化的 AiReport
}
```

## 能量球组件

```tsx
// components/EnergyBall/index.tsx

import { View, Text } from '@tarojs/components';
import './index.scss';

interface EnergyBallProps {
  score: number;
  type: 'flow' | 'drain';
  onPress?: () => void;
}

export default function EnergyBall({ score, type, onPress }: EnergyBallProps) {
  return (
    <View 
      className={`energy-ball energy-ball--${type}`}
      onClick={onPress}
    >
      <Text className="energy-ball__score">{score}</Text>
    </View>
  );
}
```

```scss
// components/EnergyBall/index.scss

.energy-ball {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &--flow {
    background: linear-gradient(135deg, #00d4d4, #00b4b4);
    box-shadow: 0 0 40px rgba(0, 212, 212, 0.5);
  }
  
  &--drain {
    background: linear-gradient(135deg, #a060e0, #8040c0);
    box-shadow: 0 0 40px rgba(160, 80, 220, 0.5);
  }
  
  &__score {
    font-size: 48px;
    font-weight: bold;
    color: #fff;
  }
}
```

## 主题系统

```typescript
// utils/theme.ts - 直接复用 Expo 版本

export const colors = {
  background: {
    primary: '#0a0f1e',
    secondary: '#0d1b3e',
  },
  flow: {
    primary: '#00d4d4',
    secondary: '#00b4b4',
    light: 'rgba(0, 212, 212, 0.15)',
  },
  drain: {
    primary: '#a060e0',
    secondary: '#8040c0',
    light: 'rgba(160, 80, 220, 0.15)',
  },
  transform: {
    primary: '#ffb400',
    secondary: '#ff9500',
  },
  // ... 其他颜色定义
};

export const spacing = {
  xs: '8rpx',
  sm: '16rpx',
  md: '24rpx',
  lg: '32rpx',
  xl: '40rpx',
  // ...
};
```

## 类型定义

```typescript
// types/index.ts - 完全复用 Expo 版本

export type EnergyType = 'flow' | 'drain';

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

// ... 其他类型定义完全相同
```

## 开发阶段

| 阶段 | 内容 | 预计工作量 |
|------|------|------------|
| **Phase 1** | 项目初始化 + 配置 | 0.5 天 |
| **Phase 2** | 数据层 + 状态管理 | 1 天 |
| **Phase 3** | 引导页 + 愿景页 | 0.5 天 |
| **Phase 4** | 首页 + 记录页 | 1.5 天 |
| **Phase 5** | 统计页 + 契约页 | 1.5 天 |
| **Phase 6** | 洞察页 + AI 服务 | 1 天 |
| **Phase 7** | 测试 + 优化 | 1 天 |

**总计**: 约 7 天

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Taro 版本兼容性 | 中 | 使用 Taro 3.x 稳定版本 |
| 图表组件缺失 | 中 | 使用 ECharts 小程序版或自绘 |
| AI API 调用限制 | 低 | 支持多种 API 提供商 |
| 能量球效果简化 | 低 | 后续可升级为 Canvas 动画 |

## 后续优化

1. **能量球动画升级**: 使用 Canvas 2D 实现脉冲、渐变等动态效果
2. **数据云同步**: 接入微信云开发，实现跨设备同步
3. **分享功能**: 生成能量报告图片，分享到朋友圈
4. **订阅消息**: 提醒用户完成微承诺
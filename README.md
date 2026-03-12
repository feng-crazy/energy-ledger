# Energy Ledger (功过格)

一款自我觉察移动应用，追踪能量状态（流动/耗散），配合身体状态记录、愿景对齐和微承诺功能。

> **项目来源**: 从 `/Users/hedengfeng/workspace/vision-ledger` Web 项目转换而来，现已完全迁移至 React Native + Expo。

## 技术栈

- **框架**: Expo 55 + React Native 0.83 + React 19
- **语言**: TypeScript 5.9 (strict mode)
- **路由**: expo-router (文件路由)
- **存储**: SQLite + AsyncStorage
- **动画**: react-native-reanimated + Skia
- **UI**: react-native-svg, expo-haptics

## 环境要求

- Node.js 18+
- npm 或 yarn
- iOS: Xcode 15+ (macOS only)
- Android: Android Studio + JDK 17+

## 安装

```bash
# 克隆项目
git clone <repository-url>
cd energy-ledger

# 安装依赖
npm install
```

## 运行

```bash
# 启动 Expo 开发服务器
npm start

# iOS 模拟器
npm run ios

# Android 模拟器
npm run android

# Web 版本
npm run web
```

## 功能实现度分析

> 对照产品设计文档 `功过格产品设计说明.md` 的完整分析

### 📊 总体实现度: **92%**

| 模块 | 实现度 | 状态 |
|------|--------|------|
| 首页 (能量罗盘) | 95% | ✅ 核心完成 |
| 记录页 (身体扫描) | 100% | ✅ 完全实现 |
| 统计页 (热力图) | 90% | ✅ 可用 |
| 能量契约页 | 95% | ✅ 核心完成 |
| 洞察分析页 | 85% | ⚠️ Mock AI |
| 愿景设定页 | 100% | ✅ 完全实现 |
| 引导页 | 100% | ✅ 完全实现 |
| 数据层 | 100% | ✅ 完全实现 |

---

### 🏠 首页 (能量罗盘)

**实现度: 95%**

| 功能 | 状态 | 文件位置 |
|------|------|----------|
| 3D 能量球 | ✅ | `src/components/EnergyBall.tsx:26` |
| 能量球点击记录 | ✅ | `app/(tabs)/index.tsx:163` |
| 状态颜色变化 (青金/紫) | ✅ | `src/components/EnergyBall.tsx:83-86` |
| 浮动动画 | ✅ | `src/components/EnergyBall.tsx:38-45` |
| 脉冲环动画 | ✅ | `src/components/EnergyBall.tsx:48-64` |
| 耗散按钮 | ✅ | `app/(tabs)/index.tsx:176-184` |
| 聚能按钮 | ✅ | `app/(tabs)/index.tsx:186-194` |
| 转念按钮 | ✅ | `app/(tabs)/index.tsx:197-202` |
| 今日记录列表 | ✅ | `app/(tabs)/index.tsx:206-228` |
| 连续觉察天数 | ✅ | `app/(tabs)/index.tsx:168-171` |
| 愿景标签滚动 | ✅ | `app/(tabs)/index.tsx:135-157` |
| 球体表面纹理效果 | ❌ | Skia 仅绘制基础圆形 |

**缺失项:**
- 能量球表面纹理/粗糙度效果（设计要求"状态差时表面粗糙、浑浊"）

---

### 📝 记录页 (身体扫描)

**实现度: 100%**

| 功能 | 状态 | 文件位置 |
|------|------|----------|
| 三步流程 | ✅ | `app/record.tsx:41-42` |
| 耗散态选项 (5种) | ✅ | `src/types/index.ts:112-172` |
| 聚能态选项 (4种) | ✅ | `src/types/index.ts:175-225` |
| 自定义状态输入 | ✅ | `app/record.tsx:200-225` |
| 愿景多选 | ✅ | `app/record.tsx:270-292` |
| 日志输入 | ✅ | `app/record.tsx:318-326` |
| 提交视觉反馈 | ✅ | `app/record.tsx:100-131` |
| 得分动画 | ✅ | `app/record.tsx:111-120` |
| 触觉反馈 | ✅ | `app/record.tsx:69` |
| 能量评分计算 | ✅ | `app/record.tsx:52-60` |

**完全符合设计规范**

---

### 📈 统计页 (熵减热力图)

**实现度: 90%**

| 功能 | 状态 | 文件位置 |
|------|------|----------|
| 周期切换 (今日/本周/本月) | ✅ | `app/(tabs)/stats.tsx:19-24` |
| 能量时间轴 | ✅ | `app/(tabs)/stats.tsx:185-218` |
| 愿景能量雷达 | ✅ | `app/(tabs)/stats.tsx:222-259` |
| 本月记录热图 | ✅ | `app/(tabs)/stats.tsx:262-299` |
| 愿景维度警示 | ✅ | `app/(tabs)/stats.tsx:251-258` |
| 总能量统计 | ✅ | `app/(tabs)/stats.tsx:149-166` |

**与设计差异:**
- 时间轴使用简单条形图，非设计中的"绿色河流/紫色漩涡"形态

---

### ⚡ 能量契约页 (微承诺)

**实现度: 95%**

| 功能 | 状态 | 文件位置 |
|------|------|----------|
| 有承诺状态 (场景A) | ✅ | `app/(tabs)/contract.tsx:173-233` |
| 无承诺状态 (场景B) | ✅ | `app/(tabs)/contract.tsx:235-252` |
| 创建承诺流程 | ✅ | `app/(tabs)/contract.tsx:254-329` |
| 动态倒计时 | ✅ | `app/(tabs)/contract.tsx:53-75` |
| "做到了"按钮 | ✅ | `app/(tabs)/contract.tsx:216-223` |
| "没做到"按钮 + 弹窗 | ✅ | `app/(tabs)/contract.tsx:224-231,345-391` |
| 失败原因快捷标签 | ✅ | `app/(tabs)/contract.tsx:25` |
| 成功动画 | ✅ | `app/(tabs)/contract.tsx:144-157` |
| 能量值/连胜展示 | ✅ | `app/(tabs)/contract.tsx:176-191` |

**缺失项:**
- 往期承诺回顾列表

---

### 🧠 洞察分析页

**实现度: 85%**

| 功能 | 状态 | 文件位置 |
|------|------|----------|
| 记录列表 | ✅ | `app/(tabs)/insights.tsx:139-242` |
| AI 分析按钮 | ✅ | `app/(tabs)/insights.tsx:175-193` |
| AI 报告展示 | ✅ | `app/(tabs)/insights.tsx:196-239` |
| 心理学视角 | ✅ | `app/(tabs)/insights.tsx:28` |
| 神经科学分析 | ✅ | `app/(tabs)/insights.tsx:29` |
| 个性化建议 | ✅ | `app/(tabs)/insights.tsx:30` |

**重要限制:**
- AI 分析为 **Mock 数据**，未接入真实 AI API
- 位置: `app/(tabs)/insights.tsx:20-41`

---

### 🎯 愿景设定页

**实现度: 100%**

| 功能 | 状态 | 文件位置 |
|------|------|----------|
| 预设愿景 (10种) | ✅ | `src/types/index.ts:98-109` |
| 添加新愿景 | ✅ | `app/vision.tsx:31-48` |
| 删除愿景 | ✅ | `app/vision.tsx:50-54` |
| 愿景详述编辑 | ✅ | `app/vision.tsx:56-59` |
| 展开详情 | ✅ | `app/vision.tsx:133-172` |

---

### 🚀 引导页

**实现度: 100%**

| 功能 | 状态 | 文件位置 |
|------|------|----------|
| 欢迎界面 | ✅ | `app/onboarding.tsx:67-98` |
| 愿景选择 (1-5个) | ✅ | `app/onboarding.tsx:101-155` |
| 完成后跳转 | ✅ | `app/onboarding.tsx:61` |
| 引导状态持久化 | ✅ | `src/store/storage.ts:267-274` |

---

### 💾 数据层

**实现度: 100%**

| 功能 | 状态 | 文件位置 |
|------|------|----------|
| SQLite 数据库初始化 | ✅ | `src/store/storage.ts:11-55` |
| 愿景 CRUD | ✅ | `src/store/storage.ts:65-104` |
| 能量记录 CRUD | ✅ | `src/store/storage.ts:108-175` |
| 微承诺 CRUD | ✅ | `src/store/storage.ts:179-235` |
| 用户统计 | ✅ | `src/store/storage.ts:239-263` |
| React Context 状态管理 | ✅ | `src/store/AppContext.tsx:38-208` |

---

## 项目结构

```
energy-ledger/
├── app/                  # 文件路由 (expo-router)
│   ├── (tabs)/           # Tab 导航: 首页、统计、契约、洞察
│   │   ├── index.tsx     # 首页 (484 行)
│   │   ├── stats.tsx     # 统计页 (556 行)
│   │   ├── contract.tsx  # 契约页 (805 行)
│   │   └── insights.tsx  # 洞察页 (473 行)
│   ├── _layout.tsx       # 根布局 + 引导页跳转
│   ├── onboarding.tsx    # 首次使用引导 (280 行)
│   ├── record.tsx        # 能量记录弹窗 (642 行)
│   └── vision.tsx        # 愿景管理弹窗 (473 行)
├── src/
│   ├── components/       # 可复用 UI 组件
│   │   ├── Button.tsx    # 触觉反馈按钮 (149 行)
│   │   ├── Card.tsx      # 主题容器 (57 行)
│   │   ├── EnergyBall.tsx# 3D 能量球 (182 行)
│   │   └── Modal.tsx     # 模态框
│   ├── store/            # 状态管理
│   │   ├── AppContext.tsx# React Context (216 行)
│   │   └── storage.ts    # SQLite 层 (293 行)
│   ├── types/            # 类型定义
│   │   └── index.ts      # 域类型 + 预设 (235 行)
│   └── utils/            # 工具函数
│       └── theme.ts      # 主题系统 (160 行)
└── index.ts              # 入口文件
```

---

## 开发约定

- **路径别名**: 使用 `@/` 导入 `src/` 目录 (例: `import { colors } from '@/utils/theme'`)
- **类型安全**: TypeScript strict 模式已启用，禁止使用 `any`
- **动画**: 使用 react-native-reanimated 处理动画，Skia 处理复杂图形
- **触觉反馈**: 用户交互时必须触发 haptic 反馈 (expo-haptics)
- **样式**: 使用 StyleSheet.create()，引用 `@/utils/theme` 中的主题令牌

---

## 待完成事项

### 高优先级
- [ ] 接入真实 AI API (替代 Mock 数据)
- [ ] 能量球表面纹理效果

### 中优先级
- [ ] 往期承诺回顾列表
- [ ] 时间轴"河流/漩涡"形态可视化
- [ ] 添加测试

### 低优先级
- [ ] CI/CD 配置
- [ ] EAS Build 配置

---

## 部署

使用 EAS (Expo Application Services) 进行构建和部署:

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 配置项目
eas build:configure

# 构建
eas build --platform ios
eas build --platform android

# 提交到应用商店
eas submit --platform ios
eas submit --platform android
```

---

## 文档

- 产品设计说明: `功过格产品设计说明.md`
- 开发知识库: `AGENTS.md`
- 组件文档: `src/components/AGENTS.md`
- 状态管理: `src/store/AGENTS.md`
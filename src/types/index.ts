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
  title: string; // 愿景名称（用户自定义）
  emoji: string;
  label: string; // 标签（简短分类）
  desc: string; // 概念描述
  detail?: string; // 详细描述
  energyScore: number; // 愿景累计能量值
  createdAt: number;
  updatedAt: number;
}

// 能量记录
export interface EnergyRecord {
  id: string;
  type: EnergyType;
  bodyStateId: string;
  customBodyState?: string;
  visions: string[]; // Vision IDs
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

// 每日记录数据
export interface DailyRecordData {
  time: string;
  energy: number;
  drain: number;
}

// 雷达图数据
export interface RadarData {
  vision: string;
  value: number;
  fullMark: number;
  stage?: number;
  totalScore?: number;
}

// 应用状态
export interface AppState {
  visions: Vision[];
  records: EnergyRecord[];
  commitments: Commitment[];
  stats: UserStats;
  hasOnboarded: boolean;
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
  RECORD_WITH_VISION_BONUS: 10, // 绑定愿景的记录加分
  RECORD_BASE: 5, // 无愿景记录的基础分
  COMMITMENT_BONUS: 20, // 承诺完成加分
};
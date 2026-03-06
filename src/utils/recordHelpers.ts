// Record Helpers - 记录相关工具函数
import { DRAIN_STATES, FLOW_STATES, Vision, AiReport } from '@/types';

/**
 * 获取身体状态标签
 * @param type - 记录类型 (flow/drain)
 * @param stateId - 身体状态 ID
 * @param customBodyState - 自定义状态描述（如果有）
 */
export const getStateLabel = (type: string, stateId: string, customBodyState?: string): string => {
  if (customBodyState) return customBodyState;
  const states = type === 'flow' ? FLOW_STATES : DRAIN_STATES;
  const state = states.find(s => s.id === stateId);
  return state?.label || '自定义';
};

/**
 * 获取身体状态 Emoji
 * @param type - 记录类型 (flow/drain)
 * @param stateId - 身体状态 ID
 */
export const getStateEmoji = (type: string, stateId: string): string => {
  const states = type === 'flow' ? FLOW_STATES : DRAIN_STATES;
  const state = states.find(s => s.id === stateId);
  return state?.emoji || '✍️';
};

/**
 * 获取愿景标签（统一使用 title）
 * @param visionId - 愿景 ID
 * @param visions - 愿景列表
 */
export const getVisionLabel = (visionId: string, visions: Vision[]): string => {
  const vision = visions.find(v => v.id === visionId);
  return vision?.title || '';
};

/**
 * 获取愿景 Emoji
 * @param visionId - 愿景 ID
 * @param visions - 愿景列表
 */
export const getVisionEmoji = (visionId: string, visions: Vision[]): string => {
  const vision = visions.find(v => v.id === visionId);
  return vision?.emoji || '🎯';
};

/**
 * 格式化时间（仅时分）
 * @param timestamp - 时间戳
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * 格式化日期时间（今天/昨天/完整日期）
 * @param timestamp - 时间戳
 */
export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const timeStr = formatTime(timestamp);
  
  if (isToday) return `今天 ${timeStr}`;
  if (date.toDateString() === yesterday.toDateString()) return `昨天 ${timeStr}`;
  return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${timeStr}`;
};

/**
 * 格式化日期（用于分组）
 * @param timestamp - 时间戳
 */
export const formatDate = (timestamp: number): { label: string; showFull: boolean } => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return { label: '今天', showFull: false };
  } else if (date.toDateString() === yesterday.toDateString()) {
    return { label: '昨天', showFull: false };
  } else {
    return { 
      label: `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`,
      showFull: true 
    };
  }
};

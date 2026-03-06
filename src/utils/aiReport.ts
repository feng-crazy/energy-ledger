// AI Report Generator - AI 分析报告生成工具
import { AiReport, EnergyRecord } from '@/types';

/**
 * Mock AI 报告生成器
 * TODO: 替换为真实 AI API 调用
 */
export const generateAiReport = async (record: EnergyRecord): Promise<AiReport> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  const isFlow = record.type === 'flow';
  
  if (isFlow) {
    return {
      philosophy: "你所描述的心流体验，与庄子所言'无为而无不为'高度契合。当自我意识退场，真正的创造力才能涌现。这不是偶然，而是你长期积累的厚积薄发。",
      neuroscience: "心流状态激活了大脑的默认模式网络与执行网络的同步协作，前额叶皮层的自我监控功能降低，使得创造性思维得以自由流动。多巴胺与去甲肾上腺素的平衡分泌是这种体验的神经基础。",
      suggestion: "建议记录触发这次心流的前置条件（时间、环境、身体状态），尝试将其系统化，创造可复制的心流触发仪式。",
      generatedAt: Date.now(),
    };
  } else {
    return {
      philosophy: "你所描述的逃避行为背后，是一种存在主义式的焦虑——面对自由时的不安（萨特语）。刷屏是一种现代人对抗'虚无感'的临时出口，但它带来的是更深的空洞。",
      neuroscience: "短视频的即时奖励机制持续激活多巴胺系统，形成强化回路。持续注意力碎片化会削弱前额叶的自我调节能力，使'停下来'变得越来越困难——这是神经可塑性的双刃剑。",
      suggestion: "睡前 30 分钟设定一个'数字宵禁'。用'5 秒法则'（倒数 5-4-3-2-1 后立即放下手机）打破自动化行为模式。焦虑感会在最初的 90 秒内消退，坚持过去就是突破。",
      generatedAt: Date.now(),
    };
  }
};

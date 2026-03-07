import { Platform } from 'react-native';
import { AiReport, EnergyRecord, AiConfig } from '@/types';

const isWeb = Platform.OS === 'web';

export function isAiReportAvailable(): boolean {
  // On native platforms (iOS, Android), AI report is always available
  if (!isWeb) return true;
  // On web, AI report is not available due to CORS issues with proxy services
  return false;
}

const SYSTEM_PROMPT = `你是一位融合心理学、灵性修行和神经科学视角的深度洞察分析师。你的任务是根据用户的能量状态记录，提供三个维度的深度分析：

1. 心理学视角：从存在主义、道家、佛学、心理学等角度解读用户的体验
2. 神经科学：从脑科学、神经递质、认知模式角度解释背后的机制
3. 个性化建议：给出具体可执行的改进建议

请用温暖而有洞察力的语气回应，避免说教，多用启发式的语言。每个维度控制在100-150字左右。

回复格式：
## 心理学视角
[内容]

## 神经科学
[内容]

## 个性化建议
[内容]`;

function buildUserPrompt(record: EnergyRecord): string {
  const typeText = record.type === 'flow' ? '聚能态（心流/专注/积极）' : '耗散态（消耗/逃避/消极）';
  const bodyStateText = record.customBodyState || record.bodyStateId;
  const visionsText = record.visions.length > 0 ? `相关愿景: ${record.visions.join(', ')}` : '';
  const journalText = record.journal || '无详细记录';

  return `用户刚才记录了一次${typeText}体验：

身体状态: ${bodyStateText}
${visionsText}
日志内容: ${journalText}

请从心理学、神经科学、个性化建议三个维度给出深度分析。`;
}

function parseAiResponse(content: string): AiReport {
  const sections = content.split(/##\s*/).filter(s => s.trim());

  let philosophy = '';
  let neuroscience = '';
  let suggestion = '';

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const title = lines[0].toLowerCase();
    const body = lines.slice(1).join('\n').trim();

    if (title.includes('心理学') || title.includes('philosophy')) {
      philosophy = body;
    } else if (title.includes('神经') || title.includes('neuro')) {
      neuroscience = body;
    } else if (title.includes('建议') || title.includes('suggestion') || title.includes('推荐')) {
      suggestion = body;
    }
  }

  if (!philosophy || !neuroscience || !suggestion) {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    if (paragraphs.length >= 3) {
      philosophy = paragraphs[0];
      neuroscience = paragraphs[1];
      suggestion = paragraphs[2];
    } else {
      philosophy = content.substring(0, 200);
      neuroscience = content.substring(200, 400);
      suggestion = content.substring(400, 600);
    }
  }

  return {
    philosophy: philosophy || '无法解析心理学视角分析',
    neuroscience: neuroscience || '无法解析神经科学分析',
    suggestion: suggestion || '无法解析个性化建议',
    generatedAt: Date.now(),
  };
}

export async function generateAiReport(record: EnergyRecord, config: AiConfig): Promise<AiReport> {
  // Safety check: should not be called in production web
  if (!isAiReportAvailable()) {
    throw new Error('AI 报告功能在 Web 端不可用');
  }

  const targetUrl = `${config.apiUrl}/chat/completions`;

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(record) },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API 请求失败: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  return parseAiResponse(content);
}
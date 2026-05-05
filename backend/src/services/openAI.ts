import OpenAI from 'openai';
import dotenv from 'dotenv';
import { AISummary } from '../models/index';

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type SummaryType = 'trend' | 'code' | 'anomaly' | 'daily';

// Check MongoDB cache before calling OpenAI
async function getCached(type: SummaryType, scope: string): Promise<string | null> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const doc = await AISummary.findOne({
    type, scope,
    generatedAt: { $gte: oneHourAgo },
  }).sort({ generatedAt: -1 });
  return doc?.content ?? null;
}

export interface CodeStat {
  code: string;
  shortDesc: string;
  count: number;
  pct: number;
  avgMinutes: number;
  totalMinutes: number;
  chargeable: string;
  reasons: string[];
}

export interface TrendData {
  month: string;
  events: number;
  totalMinutes: number;
}

export async function generateTrendAnalysis(
  trends: TrendData[],
  topCodes: CodeStat[],
  uploadId?: string
): Promise<string> {
  const scope = `trend_${trends.map(t => t.month).join('_')}`;
  const cached = await getCached('trend', scope);
  if (cached) return cached;

  const prompt = `You are an aviation operations analyst for Hawaiian Airlines cargo operations.

MONTHLY TREND DATA:
${trends.map(t => `${t.month}: ${t.events} events, ${t.totalMinutes} minutes`).join('\n')}

TOP DELAY CODES:
${topCodes.slice(0,10).map(c => `${c.code} (${c.shortDesc}): ${c.count} events (${c.pct}%), avg ${c.avgMinutes}min`).join('\n')}

Write a structured analysis:
1. **Executive Summary** (2-3 sentences)
2. **Key Drivers** (top 3 causes with percentages)
3. **Critical Patterns** (time patterns, anomalies)
4. **Recommended Actions** (3 specific steps)
5. **Watch Items** (2-3 things to monitor)

Use actual numbers. Under 400 words.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 600,
    temperature: 0.3,
  });

  const content = response.choices[0].message.content ?? 'Analysis unavailable.';

  await AISummary.create({
    type: 'trend', scope, content,
    tokensUsed: response.usage?.total_tokens ?? 0,
  });

  return content;
}

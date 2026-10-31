// src/app/api/ai/route.ts
import { NextResponse } from 'next/server';
import { getAIRecommendations, beautyChatbotResponse, createAiResponse, sanitizeAiHistory, sanitizeAiString } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { mode, gender, hairType, faceShape, message, history } = body;

    if (mode === 'consultation') {
      const recommendation = getAIRecommendations(
        gender || 'women',
        hairType || 'curly',
        faceShape || 'oval'
      );
      return NextResponse.json({ recommendation });
    }

    // Chat mode
    const sanitizedMsg = sanitizeAiString(message);
    const sanitizedHist = sanitizeAiHistory(history);

    // If OPENAI_API_KEY is configured, try live AI generation
    if (process.env.OPENAI_API_KEY && sanitizedMsg) {
      try {
        const reply = await createAiResponse(sanitizedMsg);
        return NextResponse.json({ reply });
      } catch (err) {
        console.warn('Live AI fallback to rule-based engine:', err);
      }
    }

    // Default to smart beauty chatbot engine
    const reply = beautyChatbotResponse(sanitizedMsg, sanitizedHist);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Error in /api/ai:', error);
    return NextResponse.json({ error: 'AI processing failed' }, { status: 500 });
  }
}


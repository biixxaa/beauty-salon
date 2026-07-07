// src/app/api/ai/route.ts
import { NextResponse } from 'next/server';
import {
  getAIRecommendations,
  beautyChatbotResponse,
  sanitizeAiHistory,
  sanitizeAiString,
  MAX_AI_MESSAGE_LENGTH,
} from '@/lib/ai';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();
    const mode = sanitizeAiString(body?.mode).toLowerCase();
    const message = sanitizeAiString(body?.message);
    const history = sanitizeAiHistory(body?.history);
    const gender = sanitizeAiString(body?.gender).toLowerCase();
    const hairType = sanitizeAiString(body?.hairType);
    const faceShape = sanitizeAiString(body?.faceShape);

    if (mode === 'chat') {
      if (!message) {
        return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
      }

      if (message.length > MAX_AI_MESSAGE_LENGTH) {
        return NextResponse.json({ error: 'Message is too long.' }, { status: 413 });
      }

      const botReply = beautyChatbotResponse(message, history);
      return NextResponse.json({ reply: botReply });
    }

    if (mode === 'consultation') {
      if (!gender || !hairType || !faceShape) {
        return NextResponse.json({ error: 'Gender, hairType, and faceShape are required.' }, { status: 400 });
      }

      const recommendation = getAIRecommendations(gender as any, hairType, faceShape);

      if (user) {
        await prisma.profile.update({
          where: { userId: user.id },
          data: {
            hairType,
            faceShape,
            stylePreference: recommendation.title,
          },
        });
      }

      return NextResponse.json({ recommendation });
    }

    return NextResponse.json({ error: 'Invalid mode. Use "chat" or "consultation".' }, { status: 400 });
  } catch (error: any) {
    console.error('AI API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

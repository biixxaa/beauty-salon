// src/lib/ai.ts

export interface RecommendationResult {
  title: string;
  description: string;
  imageUrl: string;
  matchingServices: string[];
}

export const MAX_AI_MESSAGE_LENGTH = 600;
export const MAX_AI_HISTORY_ITEMS = 10;

export function sanitizeAiString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 1000);
}

export function sanitizeAiHistory(value: unknown): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is { role: 'user' | 'assistant'; content: string } =>
        item && typeof item === 'object' && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string'
    )
    .slice(-MAX_AI_HISTORY_ITEMS)
    .map((item) => ({
      role: item.role,
      content: sanitizeAiString(item.content),
    }));
}

export function getAIRecommendations(
  gender: 'men' | 'women' | 'kids' | string,
  hairType: string,
  faceShape: string
): RecommendationResult {
  const normalizedGender = sanitizeAiString(gender).toLowerCase();
  const normalizedFaceShape = sanitizeAiString(faceShape).toLowerCase();
  const normalizedHairType = sanitizeAiString(hairType).toLowerCase();

  if (normalizedGender === 'men') {
    if (normalizedFaceShape === 'oval') {
      return {
        title: 'Classic Pompadour with Mid Fade',
        description: 'For oval faces, adding volume on top helps highlight symmetry. A pompadour keeps hair off the forehead, showing off your balanced facial structure.',
        imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=300',
        matchingServices: ['Executive Gentleman Cut', 'Signature Fade & Wash'],
      };
    } else if (normalizedFaceShape === 'round') {
      return {
        title: 'Textured Crop with High skin Fade',
        description: 'Creating angles is key for round faces. The high fade creates length, while a textured top adds height and structure.',
        imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=300',
        matchingServices: ['Modern Skin Fade', 'Beard Trim & Razor Lineup'],
      };
    }
    return {
      title: 'Low Buzz Cut with Beard Lineup',
      description: 'A clean buzz cut paired with a sharp, well-groomed beard creates a strong masculine jawline frame suited for square or heart face shapes.',
      imageUrl: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?q=80&w=300',
      matchingServices: ['Executive Gentleman Cut', 'Classic Hot Towel Shave'],
    };
  }

  if (normalizedGender === 'women') {
    if (normalizedHairType === 'coily' || normalizedHairType === 'kinky') {
      return {
        title: 'Defined Afro Puff with Golden Highlights',
        description: 'Embrace your natural 4C coily texture! A high afro puff keeps hair protected and voluminous, while gold highlights complement warm Ethiopian skin tones.',
        imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=300',
        matchingServices: ['Natural Hair Styling & Hydration', 'Golden Radiance Facial'],
      };
    }

    if (normalizedFaceShape === 'round') {
      return {
        title: 'Asymmetrical Bob Cut',
        description: 'An asymmetrical bob draws the eyes downwards, creating an elongating illusion that balances a round face structure perfectly.',
        imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=300',
        matchingServices: ['Luxury Haircut & Blow Dry', 'Deep Conditioning Treatment'],
      };
    }

    return {
      title: 'Soft Beachy Waves with Balayage',
      description: 'Soft waves break up strong angles. Ideal for oval and diamond face shapes, adding texture and movement around the cheeks.',
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=300',
      matchingServices: ['Luxury Haircut & Blow Dry', 'Premium Color & Balayage'],
    };
  }

  return {
    title: 'Tapered Kid Curls',
    description: 'A cute, low-maintenance haircut that keeps curls light and easy to manage while looking stylish and tidy.',
    imageUrl: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?q=80&w=300',
    matchingServices: ['Tapered Kid Curls', 'Wash & Blow Dry'],
  };
}

export function beautyChatbotResponse(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): string {
  const safeMessage = sanitizeAiString(message).toLowerCase();

  if (safeMessage.includes('hair') && (safeMessage.includes('dry') || safeMessage.includes('damage'))) {
    return 'For dry or damaged hair, I highly recommend booking Saba\'s "Deep Conditioning Treatment" or "Natural Hair Styling & Hydration" which use premium Moroccan oils to restore hydration. Also, consider reducing heat styling to twice a month!';
  }

  if (safeMessage.includes('shave') || safeMessage.includes('razor') || safeMessage.includes('skin irritation')) {
    return 'Razor burn is common. Make sure your barber uses a hot towel pre-shave (like Dawit\'s "Classic Hot Towel Shave") to open pores and soften hairs. Afterward, apply a cooling post-shave balm containing aloe vera.';
  }

  if (safeMessage.includes('nail') || safeMessage.includes('manicure') || safeMessage.includes('gel')) {
    return 'For long-lasting nails, a Gel Manicure is perfect. Tigist Bekele at Saba\'s Luxury Salon is highly rated for gel extensions and custom nail art. To maintain cuticle health, apply jojoba oil nightly!';
  }

  if (safeMessage.includes('telebirr') || safeMessage.includes('cbe') || safeMessage.includes('pay')) {
    return 'Our platform allows instant payments via Telebirr or CBE Birr at checkout! Alternatively, you can book online and choose the "Pay Cash at Salon" option to complete your transaction in person.';
  }

  return 'Hello! I am your AI Beauty Consultant. I can help recommend hairstyles based on your face shape, advise on skincare routines, suggest hair treatment services, or help you find the best nail technicians in Addis Ababa. What are you looking to achieve today?';
}

export async function createAiResponse(message: string) {
  const prompt = sanitizeAiString(message);

  if (!prompt) {
    throw new Error('Prompt cannot be empty');
  }

  if (prompt.length > MAX_AI_MESSAGE_LENGTH) {
    throw new Error('Prompt too long');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return 'This feature is not configured yet. Please add OPENAI_API_KEY to your environment.';
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a beauty salon assistant for Beuty.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 250,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI provider error: ${response.status} ${text}`);
  }

  const json = await response.json();
  return json?.choices?.[0]?.message?.content?.trim() || 'The AI assistant did not return a response.';
}

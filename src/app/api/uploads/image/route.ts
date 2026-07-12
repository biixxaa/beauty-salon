import { NextResponse } from 'next/server';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const VALID_IMAGE_PATTERN = /^data:image\/(jpeg|jpg|png);base64,[A-Za-z0-9+/=]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { base64, filename } = body;

    if (!base64 || typeof base64 !== 'string') {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    if (!VALID_IMAGE_PATTERN.test(base64)) {
      return NextResponse.json({ error: 'Invalid image format. Only JPEG and PNG base64 payloads are accepted.' }, { status: 400 });
    }

    const payload = base64.split(',')[1];
    const estimatedBytes = Math.ceil((payload.length * 3) / 4);

    if (estimatedBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image exceeds maximum size of 5MB.' }, { status: 413 });
    }

    const uploadName = typeof filename === 'string' && filename.trim()
      ? filename.replace(/[^a-zA-Z0-9._-]/g, '-')
      : `upload-${Date.now()}`;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey) {
      const mockUrl = `https://res.cloudinary.com/demo/image/upload/v${Date.now()}/${uploadName}.jpg`;
      console.log('[Uploads][SIMULATED] Uploaded', mockUrl);
      return NextResponse.json({ url: mockUrl });
    }

    const form = new FormData();
    form.append('file', base64);
    form.append('api_key', apiKey);

    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
    if (uploadPreset) {
      form.append('upload_preset', uploadPreset);
    }

    const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form as any,
    });

    const result = await resp.json();
    if (!resp.ok) {
      console.error('Cloudinary upload failed', result);
      return NextResponse.json({ error: 'Upload failed', detail: result }, { status: 500 });
    }

    return NextResponse.json({ url: result.secure_url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Upload API error:', msg);
    return NextResponse.json({ error: msg || 'Internal Server Error' }, { status: 500 });
  }
}

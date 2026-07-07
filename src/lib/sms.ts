export async function sendSms({ to, message }: { to: string; message: string }) {
  const twilioSid = process.env.TWILIO_SID;
  if (!twilioSid) {
    console.log('[SMS][SIMULATED] To:', to, 'Message:', message);
    return { ok: true, simulated: true };
  }

  try {
    const twilio = await import('twilio');
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    const msg = await client.messages.create({ body: message, from: process.env.TWILIO_FROM, to });
    console.log('SMS sent:', msg.sid);
    return { ok: true, sid: msg.sid };
  } catch (e) {
    console.error('Failed to send SMS:', e);
    return { ok: false, error: String(e) };
  }
}

export function normalizeE164(phone: string) {
  const trimmed = phone.trim();
  // Expecting "+<countrycode><number>" (E.164). We validate elsewhere.
  return trimmed;
}

export function normalizeTwilioFrom(from: string) {
  // Twilio sends From like "whatsapp:+1234567890"
  return from.replace(/^whatsapp:/i, '').trim();
}

export function toTwilioWhatsAppTo(e164: string) {
  const num = e164.trim();
  return num.toLowerCase().startsWith('whatsapp:') ? num : `whatsapp:${num}`;
}


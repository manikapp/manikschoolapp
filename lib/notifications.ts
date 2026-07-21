/**
 * Sends a WhatsApp message via Meta's WhatsApp Cloud API.
 *
 * Requires two env vars, set once you've gone through Meta's WhatsApp Business
 * setup (see the design doc's build-phase risk notes — plan for approval lead
 * time here, it's not instant):
 *   WHATSAPP_ACCESS_TOKEN   — permanent token from your Meta app
 *   WHATSAPP_PHONE_NUMBER_ID — the sending number's ID from Meta Business Manager
 *
 * Until those are set, this logs to the console instead of failing loudly —
 * lets the rest of the attendance flow be tested locally without a live
 * WhatsApp account.
 */
export async function sendWhatsAppMessage(toPhone: string, message: string): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(`[whatsapp:dev-mode] to ${toPhone}: ${message}`);
    return true;
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toPhone,
        type: "text",
        text: { body: message }
      })
    }
  );

  if (!response.ok) {
    console.error("WhatsApp send failed", await response.text());
    return false;
  }
  return true;
}

export function clockInMessage(studentName: string, time: string): string {
  return `${studentName} arrived at school at ${time}.`;
}

export function clockOutMessage(studentName: string, time: string): string {
  return `${studentName} was dismissed from school at ${time}.`;
}

export function teacherClockMessage(teacherName: string, action: "in" | "out", time: string): string {
  return `${teacherName} clocked ${action} at ${time}.`;
}

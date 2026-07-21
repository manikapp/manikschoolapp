import QRCode from "qrcode";
import { createHmac, randomUUID } from "crypto";

/**
 * Generates the qr_token stored on a user's row at creation time.
 * The QR itself never encodes personal data directly — just this
 * opaque, signed token, which the server resolves back to a profile
 * via POST /api/qr-resolve (see the API reference doc, section 1).
 */
export function generateQrToken(userCode: string): string {
  const secret = process.env.QR_SIGNING_SECRET!;
  const nonce = randomUUID();
  const signature = createHmac("sha256", secret)
    .update(`${userCode}.${nonce}`)
    .digest("hex")
    .slice(0, 16);
  return `${userCode}.${nonce}.${signature}`;
}

export function verifyQrToken(token: string, userCode: string): boolean {
  const secret = process.env.QR_SIGNING_SECRET!;
  const [code, nonce, signature] = token.split(".");
  if (code !== userCode) return false;
  const expected = createHmac("sha256", secret)
    .update(`${code}.${nonce}`)
    .digest("hex")
    .slice(0, 16);
  return signature === expected;
}

/** Renders the QR as a data URL, ready to drop into an <img> or a PDF. */
export async function qrTokenToDataUrl(qrToken: string): Promise<string> {
  return QRCode.toDataURL(qrToken, { margin: 1, width: 320 });
}

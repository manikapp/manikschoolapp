/**
 * Generates a simple circular "official stamp" as an SVG string — school name
 * around the top, "OFFICIAL SEAL" arced along the bottom, accent-colored ring.
 * Kept as plain text layout rather than curved text-on-a-path for v1 simplicity;
 * a more elaborate crest/seal design is a good later iteration once a school
 * wants something more bespoke than a functional stamp.
 */
export function generateStampSvg(params: { schoolName: string; accentColor?: string }): string {
  const accent = params.accentColor ?? "#0F6E56";
  const { schoolName } = params;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <circle cx="150" cy="150" r="140" fill="none" stroke="${accent}" stroke-width="4"/>
  <circle cx="150" cy="150" r="120" fill="none" stroke="${accent}" stroke-width="1.5"/>
  <text x="150" y="120" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="${accent}">
    ${escapeXml(schoolName)}
  </text>
  <text x="150" y="160" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="${accent}" letter-spacing="3">
    OFFICIAL SEAL
  </text>
  <text x="150" y="200" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="${accent}">
    School Sleek Verified
  </text>
</svg>`;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

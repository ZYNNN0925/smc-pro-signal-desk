import crypto from "node:crypto";

export function timingSafeEqualText(left?: string | null, right?: string | null) {
  if (!left || !right) {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  const maxLength = Math.max(leftBuffer.length, rightBuffer.length);
  const paddedLeft = Buffer.alloc(maxLength);
  const paddedRight = Buffer.alloc(maxLength);

  leftBuffer.copy(paddedLeft);
  rightBuffer.copy(paddedRight);

  return crypto.timingSafeEqual(paddedLeft, paddedRight) && leftBuffer.length === rightBuffer.length;
}

export function anySecretMatches(expected: string | undefined, candidates: Array<string | null | undefined>) {
  if (!expected) {
    return true;
  }

  return candidates.some((candidate) => timingSafeEqualText(candidate, expected));
}

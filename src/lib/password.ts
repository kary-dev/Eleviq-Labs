import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/** Hash a password as "salt:derivedKey" (scrypt). Node runtime only. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const dk = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${dk}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored || !stored.includes(":")) return false;
  const [salt, key] = stored.split(":");
  const dk = scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, "hex");
  if (keyBuf.length !== dk.length) return false;
  return timingSafeEqual(keyBuf, dk);
}

/** Human-friendly password like "SolarPrime48?" */
export function generatePassword(): string {
  const a = ["Solar", "Lunar", "Nova", "Pixel", "Echo", "Vivid", "Prime", "Hyper", "Neon", "Aero", "Volt", "Zephyr"];
  const b = ["Prime", "Wave", "Pulse", "Flux", "Spark", "Drift", "Core", "Shift", "Bloom", "Crest"];
  const sym = "!?#$%&";
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${pick(a)}${pick(b)}${num}${pick(sym.split(""))}`;
}

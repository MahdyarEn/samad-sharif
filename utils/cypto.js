import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = Buffer.from(process.env.CREDENTIAL_SECRET, "hex"); // 32 bytes
const IV_LENGTH = 16;

export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

export function decrypt(data) {
  const [ivHex, tagHex, encrypted] = data.split(":");

  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(ivHex, "hex"));

  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
export function isEncrypted(value) {
  return typeof value === "string" && value.includes(":") && value.split(":").length === 3;
}
export function safeDecrypt(value) {
  if (!value) return value;

  if (!isEncrypted(value)) {
    return value;
  }

  return decrypt(value);
}

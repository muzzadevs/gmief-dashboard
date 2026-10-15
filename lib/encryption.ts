/**
 * Utilidades de encriptación AES-256-GCM para datos sensibles.
 *
 * Formato almacenado: `iv_hex:authTag_hex:ciphertext_hex`
 * - iv: 12 bytes (24 hex chars) – vector de inicialización único por encriptación
 * - authTag: 16 bytes (32 hex chars) – tag de autenticación GCM
 * - ciphertext: texto cifrado en hex
 */
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recomendado para GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function parseEncryptionKey(key: string, variableName: string): Buffer {
  if (!/^[a-fA-F0-9]{64}$/.test(key)) {
    throw new Error(`${variableName} debe tener 32 bytes (64 caracteres hexadecimales)`);
  }
  return Buffer.from(key, "hex");
}

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY no está configurada en las variables de entorno. " +
      "Genera una clave de 32 bytes con: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return parseEncryptionKey(key, "ENCRYPTION_KEY");
}

function getDecryptionKeys(): Buffer[] {
  const keys = [getEncryptionKey()];
  const previousKey = process.env.ENCRYPTION_KEY_PREVIOUS;
  if (previousKey) {
    const parsedPreviousKey = parseEncryptionKey(previousKey, "ENCRYPTION_KEY_PREVIOUS");
    if (!keys[0].equals(parsedPreviousKey)) keys.push(parsedPreviousKey);
  }
  return keys;
}

/**
 * Encripta un texto plano usando AES-256-GCM.
 * @returns string en formato `iv:authTag:ciphertext` (todo en hex)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Desencripta un texto encriptado con AES-256-GCM.
 * @param encryptedText string en formato `iv:authTag:ciphertext` (hex)
 * @returns texto plano original
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(":");

  if (parts.length !== 3) {
    throw new Error("Formato de texto encriptado inválido");
  }

  const [ivHex, authTagHex, ciphertext] = parts;
  if (
    !/^[a-fA-F0-9]{24}$/.test(ivHex) ||
    !/^[a-fA-F0-9]{32}$/.test(authTagHex) ||
    !/^(?:[a-fA-F0-9]{2})*$/.test(ciphertext)
  ) {
    throw new Error("Formato de texto encriptado inválido");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  for (const key of getDecryptionKeys()) {
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
      });
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertext, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch {
      continue;
    }
  }

  throw new Error("No se pudo descifrar el texto con las claves configuradas");
}

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { env } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(purpose: string): Buffer {
  const encryptionKey =
    env.SERVER_ENCRYPTION_KEY ??
    (env.NODE_ENV !== "production" ? env.NEXTAUTH_SECRET : undefined);

  if (!encryptionKey) {
    throw new Error("SERVER_ENCRYPTION_KEY is required to encrypt GitHub credentials");
  }

  return createHash("sha256")
    .update(
      `${purpose}:${encryptionKey}`,
    )
    .digest();
}

export function encryptServerSecret(
  value: string,
  purpose: string,
): string {
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(
    ALGORITHM,
    getKey(purpose),
    iv,
  );

  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [iv, tag, ciphertext]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptServerSecret(
  value: string,
  purpose: string,
): string {
  const [
    ivEncoded,
    tagEncoded,
    ciphertextEncoded,
  ] = value.split(".");

  if (
    !ivEncoded ||
    !tagEncoded ||
    !ciphertextEncoded
  ) {
    throw new Error(
      "Invalid encrypted secret envelope",
    );
  }

  const iv = Buffer.from(
    ivEncoded,
    "base64url",
  );

  const tag = Buffer.from(
    tagEncoded,
    "base64url",
  );

  const ciphertext = Buffer.from(
    ciphertextEncoded,
    "base64url",
  );

  const decipher = createDecipheriv(
    ALGORITHM,
    getKey(purpose),
    iv,
  );

  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

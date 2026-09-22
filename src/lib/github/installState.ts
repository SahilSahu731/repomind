import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import { env } from "@/lib/env";

interface InstallStatePayload {
  userId: string;
  nonce: string;
  exp: number;
}

function sign(
  payload: string,
): string {
  return createHmac(
    "sha256",
    env.NEXTAUTH_SECRET,
  )
    .update(payload)
    .digest("base64url");
}

export function createGitHubInstallState(
  userId: string,
): string {
  const payload:
    InstallStatePayload = {
      userId,

      nonce:
        randomUUID(),

      exp:
        Date.now() +
        10 * 60 * 1000,
    };

  const encoded =
    Buffer.from(
      JSON.stringify(payload),
    ).toString("base64url");

  return (
    `${encoded}.${sign(encoded)}`
  );
}

export function verifyGitHubInstallState(
  state: string,
  expectedUserId: string,
): boolean {
  const [
    encoded,
    signature,
  ] = state.split(".");

  if (
    !encoded ||
    !signature
  ) {
    return false;
  }

  const expected =
    sign(encoded);

  const signatureBuffer =
    Buffer.from(signature);

  const expectedBuffer =
    Buffer.from(expected);

  if (
    signatureBuffer.length !==
      expectedBuffer.length ||
    !timingSafeEqual(
      signatureBuffer,
      expectedBuffer,
    )
  ) {
    return false;
  }

  try {
    const payload =
      JSON.parse(
        Buffer.from(
          encoded,
          "base64url",
        ).toString("utf8"),
      ) as InstallStatePayload;

    return (
      payload.userId ===
        expectedUserId &&
      payload.exp >
        Date.now()
    );
  } catch {
    return false;
  }
}

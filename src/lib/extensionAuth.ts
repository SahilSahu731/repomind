import type { NextRequest } from "next/server";
import { decode, encode } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAllowedExtensionOrigin } from "@/lib/cors";
import { env } from "@/lib/env";

const EXTENSION_TOKEN_MAX_AGE_SECONDS = 12 * 60 * 60;
const AUTH_REDIRECT_PATH = "/repomind-auth";
const STATE_PATTERN = /^[A-Za-z0-9_-]{24,160}$/;
const CHROMIUM_APP_HOST_PATTERN = /^([a-p]{32})\.chromiumapp\.org$/;
const EXTENSION_ID_PATTERN = /^[a-p]{32}$/;

export interface ExtensionPrincipal {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  githubUsername: string | null;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  creditsRemaining: number;
}

interface ExtensionTokenPayload {
  id?: unknown;
  sub?: unknown;
  kind?: unknown;
  name?: unknown;
  email?: unknown;
  picture?: unknown;
  githubUsername?: unknown;
}

function tokenSecret(): string {
  // A dedicated secret prevents an extension bearer from also being accepted as
  // a website session. The fallback keeps existing local setups buildable.
  return env.EXTENSION_TOKEN_SECRET ?? `repomind-extension:${env.NEXTAUTH_SECRET}`;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function isValidExtensionState(state: string | null): state is string {
  return typeof state === "string" && STATE_PATTERN.test(state);
}

export function validateExtensionRedirectUri(value: string | null): URL | null {
  if (!value) return null;

  try {
    const redirect = new URL(value);
    const hostMatch = redirect.hostname.match(CHROMIUM_APP_HOST_PATTERN);

    if (
      redirect.protocol !== "https:" ||
      !hostMatch ||
      redirect.pathname !== AUTH_REDIRECT_PATH ||
      redirect.username ||
      redirect.password ||
      redirect.search ||
      redirect.hash
    ) {
      return null;
    }

    const extensionOrigin = `chrome-extension://${hostMatch[1]}`;
    return isAllowedExtensionOrigin(extensionOrigin) ? redirect : null;
  } catch {
    return null;
  }
}

export function validateExtensionId(value: string | null): string | null {
  if (!value || !EXTENSION_ID_PATTERN.test(value)) return null;
  return isAllowedExtensionOrigin(`chrome-extension://${value}`) ? value : null;
}

export async function issueExtensionToken(
  user: ExtensionPrincipal
): Promise<string> {
  return encode({
    secret: tokenSecret(),
    maxAge: EXTENSION_TOKEN_MAX_AGE_SECONDS,
    token: {
      sub: user.id,
      id: user.id,
      kind: "extension",
      name: user.name,
      email: user.email,
      picture: user.image,
      githubUsername: user.githubUsername,
    },
  });
}

async function principalFromBearer(req: NextRequest): Promise<ExtensionPrincipal | null> {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const serializedToken = authorization.slice("Bearer ".length).trim();
  if (!serializedToken) return null;

  try {
    const payload = await decode({
      token: serializedToken,
      secret: tokenSecret(),
    }) as ExtensionTokenPayload | null;

    const id = optionalString(payload?.id) ?? optionalString(payload?.sub);
    if (!payload || payload.kind !== "extension" || !id) return null;

    return {
      id,
      name: optionalString(payload.name),
      email: optionalString(payload.email),
      image: optionalString(payload.picture),
      githubUsername: optionalString(payload.githubUsername),
      plan: "FREE",
      creditsRemaining: 3,
    };
  } catch {
    return null;
  }
}

export async function getExtensionPrincipal(
  req: NextRequest
): Promise<ExtensionPrincipal | null> {
  // If a caller supplied Authorization, it must authenticate as an extension
  // bearer. Never let a malformed/expired bearer fall through to a browser
  // session that happens to be present on the request.
  if (req.headers.has("authorization")) {
    return principalFromBearer(req);
  }

  // Same-origin calls can still use the regular website session. Extension
  // requests use the short-lived bearer token above.
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
    githubUsername: session.user.githubUsername ?? null,
    plan: session.user.plan,
    creditsRemaining: session.user.creditsRemaining,
  };
}

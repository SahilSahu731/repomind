import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { compare, hash } from "bcryptjs";

interface LocalAuthUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface LocalAuthUser {
  id: string;
  email: string;
  user_metadata: {
    name: string;
    full_name: string;
    avatar_url?: string;
  };
}

const authDirectory = path.join(process.cwd(), ".repomind");
const authFile = path.join(authDirectory, "auth-users.json");
let mutationQueue: Promise<void> = Promise.resolve();

async function readUsers(): Promise<LocalAuthUserRecord[]> {
  try {
    const contents = await readFile(authFile, "utf8");
    const parsed = JSON.parse(contents) as unknown;
    return Array.isArray(parsed) ? (parsed as LocalAuthUserRecord[]) : [];
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeUsers(users: LocalAuthUserRecord[]): Promise<void> {
  await mkdir(authDirectory, { recursive: true });
  const temporaryFile = path.join(authDirectory, `auth-users-${randomUUID()}.tmp`);
  await writeFile(temporaryFile, JSON.stringify(users, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryFile, authFile);
}

function publicUser(user: LocalAuthUserRecord): LocalAuthUser {
  return {
    id: user.id,
    email: user.email,
    user_metadata: {
      name: user.name,
      full_name: user.name,
    },
  };
}

export async function localSignUpWithPassword(
  name: string,
  email: string,
  password: string
): Promise<{ user?: LocalAuthUser; error?: { message: string } }> {
  let result: { user?: LocalAuthUser; error?: { message: string } } = {};

  const operation = mutationQueue.then(async () => {
    const users = await readUsers();
    if (users.some((user) => user.email === email)) {
      result = { error: { message: "User already registered" } };
      return;
    }

    const user: LocalAuthUserRecord = {
      id: randomUUID(),
      name,
      email,
      passwordHash: await hash(password, 12),
      createdAt: new Date().toISOString(),
    };

    await writeUsers([...users, user]);
    result = { user: publicUser(user) };
  });

  mutationQueue = operation.catch(() => undefined);
  await operation;
  return result;
}

export async function localSignInWithPassword(
  email: string,
  password: string
): Promise<{ user?: LocalAuthUser; error?: { message: string } }> {
  await mutationQueue;
  const users = await readUsers();
  const user = users.find((candidate) => candidate.email === email);

  if (!user || !(await compare(password, user.passwordHash))) {
    return { error: { message: "Invalid email or password" } };
  }

  return { user: publicUser(user) };
}

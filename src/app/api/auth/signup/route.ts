import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { getApiError } from "@/lib/errors";
import { signupSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const error = getApiError(
        "INVALID_INPUT",
        parsed.error.issues[0]?.message ?? "Invalid signup payload"
      );
      return fail(error.code, error.message, error.status);
    }

    const email = parsed.data.email.trim().toLowerCase();

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      const error = getApiError("EMAIL_IN_USE");
      return fail(error.code, error.message, error.status);
    }

    const passwordHash = await hash(parsed.data.password, 12);

    const user = await db.user.create({
      data: {
        name: parsed.data.name.trim(),
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return ok({ user }, 201);
  } catch (error) {
    const signupError = getApiError(
      "SIGNUP_FAILED",
      `Could not create account: ${String(error)}`
    );
    return fail(signupError.code, signupError.message, signupError.status);
  }
}

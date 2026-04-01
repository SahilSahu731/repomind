import { fail, ok } from "@/lib/api";
import { getApiError } from "@/lib/errors";
import { supabaseSignUpWithPassword } from "@/lib/supabaseAuth";
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

    const result = await supabaseSignUpWithPassword(
      parsed.data.name.trim(),
      email,
      parsed.data.password
    );

    if (result.error?.message?.toLowerCase().includes("already registered")) {
      const error = getApiError("EMAIL_IN_USE");
      return fail(error.code, error.message, error.status);
    }

    if (!result.user?.id) {
      const error = getApiError("SIGNUP_FAILED", result.error?.message);
      return fail(error.code, error.message, error.status);
    }

    const user = {
      id: result.user.id,
      name: parsed.data.name.trim(),
      email,
    };

    return ok({ user }, 201);
  } catch (error) {
    const signupError = getApiError(
      "SIGNUP_FAILED",
      `Could not create account: ${String(error)}`
    );
    return fail(signupError.code, signupError.message, signupError.status);
  }
}

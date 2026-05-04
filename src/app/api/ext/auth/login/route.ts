import { redirect } from "next/navigation";
import { env } from "@/lib/env";

export async function GET() {
  // Redirect the user to the standard NextAuth GitHub sign-in flow.
  // After sign-in, the callback endpoint will redirect back to the extension.
  const callbackUrl = `${env.NEXTAUTH_URL}/api/ext/auth/callback`;
  redirect(
    `/api/auth/signin/github?callbackUrl=${encodeURIComponent(callbackUrl)}`
  );
}

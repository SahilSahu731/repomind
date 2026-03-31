import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { getApiError } from "@/lib/errors";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    const error = getApiError("UNAUTHORIZED");
    return fail(error.code, error.message, error.status);
  }

  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));
  const status = searchParams.get("status") ?? "all";

  const where = {
    userId: session.user.id,
    ...(status !== "all" ? { status: status as never } : {}),
  };

  const [repos, total] = await Promise.all([
    db.repo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.repo.count({ where }),
  ]);

  return ok({
    repos,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

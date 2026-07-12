import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "./config";
import { db } from "@/lib/db";

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, image: true },
  });

  return user;
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

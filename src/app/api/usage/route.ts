import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUsage } from "@/lib/usage/tracker";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const usage = await getUsage(userId);
    return NextResponse.json(usage);
  } catch (error) {
    console.error("Usage error:", error);
    return NextResponse.json(
      { error: "Failed to get usage" },
      { status: 500 }
    );
  }
}

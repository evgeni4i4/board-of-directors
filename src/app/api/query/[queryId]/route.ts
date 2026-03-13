import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getQueryWithResponses } from "@/lib/supabase/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ queryId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { queryId } = await params;

  try {
    const data = await getQueryWithResponses(queryId);

    if (data.query.user_id !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Query not found" }, { status: 404 });
  }
}

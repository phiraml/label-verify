import { NextRequest, NextResponse } from "next/server";
import { getAllApplications, getPendingApplications, searchApplications } from "@/lib/mock-cola-database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const query = searchParams.get("q");

  if (query) {
    const results = searchApplications(query);
    return NextResponse.json({
      applications: results,
      total: results.length,
    });
  }

  if (status === "pending") {
    const pending = getPendingApplications();
    return NextResponse.json({
      applications: pending,
      total: pending.length,
    });
  }

  const all = getAllApplications();
  return NextResponse.json({
    applications: all,
    total: all.length,
  });
}

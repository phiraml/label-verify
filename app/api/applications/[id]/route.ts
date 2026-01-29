import { NextRequest, NextResponse } from "next/server";
import { getApplication } from "@/lib/mock-cola-database";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const application = getApplication(params.id);

  if (!application) {
    return NextResponse.json(
      { error: "Application not found", id: params.id },
      { status: 404 }
    );
  }

  return NextResponse.json(application);
}

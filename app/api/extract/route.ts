import { NextRequest, NextResponse } from "next/server";
import { preprocessImage } from "@/lib/image-processing";
import { extractLabel } from "@/lib/openai";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { image } = body as { image?: string };

    if (!image) {
      return NextResponse.json(
        { error: "Image is required (base64 encoded)" },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(image, "base64");
    const processed = await preprocessImage(imageBuffer);

    const extraction = await extractLabel(processed.base64);

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      id: `ext_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      processing_time_ms: processingTime,
      ...extraction,
    });
  } catch (error) {
    console.error("Extraction error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

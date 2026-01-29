import { NextRequest, NextResponse } from "next/server";
import { getApplication } from "@/lib/mock-cola-database";
import { preprocessImage } from "@/lib/image-processing";
import { verifyLabel } from "@/lib/openai";
import type { ApplicationData } from "@/lib/types";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { image, application_id, application_data } = body as {
      image?: string;
      application_id?: string;
      application_data?: ApplicationData;
    };

    if (!image) {
      return NextResponse.json(
        { error: "Image is required (base64 encoded)" },
        { status: 400 }
      );
    }

    let appData: ApplicationData | null = null;

    if (application_data) {
      appData = application_data;
    } else if (application_id) {
      appData = getApplication(application_id);
      if (!appData) {
        return NextResponse.json(
          { error: "Application not found", id: application_id },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Either application_id or application_data is required" },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(image, "base64");
    const processed = await preprocessImage(imageBuffer);

    const { result, image_quality } = await verifyLabel(
      processed.base64,
      appData
    );

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      application_id: appData.id,
      timestamp: new Date().toISOString(),
      processing_time_ms: processingTime,
      result,
      image_quality,
    });
  } catch (error) {
    console.error("Verification error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

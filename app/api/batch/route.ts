import { NextRequest } from "next/server";
import { getApplication } from "@/lib/mock-cola-database";
import { preprocessImage } from "@/lib/image-processing";
import { verifyLabel } from "@/lib/openai";
import { config } from "@/lib/config";
import type { ApplicationData, BatchItem, BatchResultItem } from "@/lib/types";

class Semaphore {
  private queue: (() => void)[] = [];
  private current = 0;

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.current--;
    const next = this.queue.shift();
    if (next) {
      this.current++;
      next();
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items?: BatchItem[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Items array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (items.length > config.limits.maxBatchSize) {
      return new Response(
        JSON.stringify({
          error: `Maximum batch size is ${config.limits.maxBatchSize}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const semaphore = new Semaphore(config.limits.batchConcurrency);

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        const batchStart = Date.now();
        let completed = 0;
        let approved = 0;
        let needsReview = 0;
        let rejected = 0;
        let errors = 0;

        const processItem = async (item: BatchItem) => {
          await semaphore.acquire();
          try {
            const itemStart = Date.now();

            let appData: ApplicationData | null = null;
            if (item.application_data) {
              appData = item.application_data;
            } else if (item.application_id) {
              appData = getApplication(item.application_id);
            }

            if (!appData) {
              errors++;
              const result: BatchResultItem = {
                id: item.id,
                status: "REJECTED",
                processing_time_ms: Date.now() - itemStart,
                critical_issues: ["Application data not found"],
                warnings: [],
                error: "Application data not found",
              };
              send("result", result);
              return;
            }

            const imageBuffer = Buffer.from(item.image, "base64");
            const processed = await preprocessImage(imageBuffer);
            const { result, image_quality } = await verifyLabel(
              processed.base64,
              appData
            );

            const processingTime = Date.now() - itemStart;

            if (result.overall_status === "APPROVED") approved++;
            else if (result.overall_status === "NEEDS_REVIEW") needsReview++;
            else rejected++;

            const batchResult: BatchResultItem = {
              id: item.id,
              status: result.overall_status,
              processing_time_ms: processingTime,
              critical_issues: result.critical_issues,
              warnings: result.warnings,
              result,
              image_quality,
            };

            send("result", batchResult);
          } catch (err) {
            errors++;
            send("result", {
              id: item.id,
              status: "REJECTED",
              processing_time_ms: 0,
              critical_issues: [],
              warnings: [],
              error: err instanceof Error ? err.message : "Processing failed",
            });
          } finally {
            completed++;
            send("progress", {
              completed,
              total: items.length,
              current_id: item.id,
            });
            semaphore.release();
          }
        };

        await Promise.all(items.map(processItem));

        send("complete", {
          total: items.length,
          approved,
          needs_review: needsReview,
          rejected,
          errors,
          total_time_ms: Date.now() - batchStart,
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Batch error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

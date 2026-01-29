"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ResultDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href="/verify">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Verification
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">
            Result: {params.id}
          </h1>
          <p className="text-muted-foreground">
            Detailed results are displayed inline during the verification
            flow. Use the Full Verify or Batch pages to view results.
          </p>
        </div>
      </div>
    </div>
  );
}

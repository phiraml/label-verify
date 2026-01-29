import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface BatchProgressProps {
  completed: number;
  total: number;
  approved: number;
  needsReview: number;
  rejected: number;
  errors: number;
  isProcessing: boolean;
}

export function BatchProgress({
  completed,
  total,
  approved,
  needsReview,
  rejected,
  errors,
  isProcessing,
}: BatchProgressProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium">
                Processing {completed} of {total}...
              </span>
            </>
          ) : (
            <span className="text-sm font-medium">
              Complete: {completed} of {total}
            </span>
          )}
        </div>
        <span className="text-sm text-muted-foreground">{percent}%</span>
      </div>

      <Progress value={percent} className="h-2" />

      <div className="flex gap-4">
        <div className="flex items-center gap-1.5 text-sm">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-700">{approved} approved</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-yellow-700">{needsReview} review</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-700">{rejected} rejected</span>
        </div>
        {errors > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <XCircle className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">{errors} errors</span>
          </div>
        )}
      </div>
    </div>
  );
}

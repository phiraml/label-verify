import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GovernmentWarningResult } from "@/lib/types";

interface GovernmentWarningCheckProps {
  warning: GovernmentWarningResult;
}

export function GovernmentWarningCheck({
  warning,
}: GovernmentWarningCheckProps) {
  const allPassed =
    warning.present &&
    warning.header_all_caps &&
    warning.header_appears_bold &&
    warning.text_complete &&
    warning.issues.length === 0;

  const checks = [
    {
      label: "Warning present on label",
      passed: warning.present,
    },
    {
      label: '"GOVERNMENT WARNING:" in ALL CAPITALS',
      passed: warning.header_all_caps,
    },
    {
      label: '"GOVERNMENT WARNING:" appears bold/heavier',
      passed: warning.header_appears_bold,
    },
    {
      label: "Warning text is word-for-word complete",
      passed: warning.text_complete,
    },
  ];

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        allPassed
          ? "border-green-200 bg-green-50/50"
          : "border-red-200 bg-red-50/50"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        {allPassed ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
        <h3 className="font-semibold">
          Government Warning (27 CFR Part 16)
        </h3>
      </div>

      <div className="space-y-2">
        {checks.map((check, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {check.passed ? (
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span
              className={cn(
                check.passed ? "text-green-800" : "text-red-800"
              )}
            >
              {check.label}
            </span>
          </div>
        ))}
      </div>

      {warning.issues.length > 0 && (
        <div className="mt-3 border-t border-red-200 pt-3">
          <p className="text-sm font-medium text-red-800 mb-1">Issues:</p>
          <ul className="space-y-1">
            {warning.issues.map((issue, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-red-700"
              >
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warning.text && (
        <div className="mt-3 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Extracted warning text:
          </p>
          <p className="text-xs text-muted-foreground italic">
            {warning.text}
          </p>
        </div>
      )}
    </div>
  );
}

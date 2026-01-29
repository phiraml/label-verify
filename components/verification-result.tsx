"use client";

import { GovernmentWarningCheck } from "./government-warning-check";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  VerificationResult as VerificationResultType,
  ImageQuality,
  FieldComparison,
} from "@/lib/types";

const CFR_REFERENCES: Record<string, string> = {
  brand_name: "27 CFR 5.34 / 4.33 / 7.54",
  fanciful_name: "27 CFR 5.34 / 4.33 / 7.54",
  class_type: "27 CFR 5.35 / 4.34 / 7.55",
  abv: "27 CFR 5.65 / 4.36 / 7.71",
  net_contents: "27 CFR 5.38 / 4.37 / 7.58",
  producer_name: "27 CFR 5.36 / 4.35 / 7.56",
  producer_address: "27 CFR 5.36 / 4.35 / 7.56",
  country_of_origin: "27 CFR 5.36(d) / 4.35(d)",
  government_warning: "27 CFR Part 16",
  vintage_year: "27 CFR 4.27",
  appellation: "27 CFR 4.25",
};

const FIELD_LABELS: Record<string, string> = {
  brand_name: "Brand Name",
  fanciful_name: "Fanciful Name",
  class_type: "Class/Type",
  abv: "Alcohol Content",
  net_contents: "Net Contents",
  producer_name: "Producer Name",
  producer_address: "Producer Address",
  country_of_origin: "Country of Origin",
  government_warning: "Government Warning",
  vintage_year: "Vintage Year",
  appellation: "Appellation",
};

const statusIcons = {
  pass: { icon: CheckCircle, className: "text-green-600" },
  warning: { icon: AlertTriangle, className: "text-yellow-600" },
  fail: { icon: XCircle, className: "text-red-600" },
};

interface VerificationResultProps {
  result: VerificationResultType;
  imageQuality: ImageQuality;
  processingTimeMs: number;
}

export function VerificationResult({
  result,
  imageQuality,
}: VerificationResultProps) {
  const passCount = result.field_comparisons.filter(
    (fc) => fc.status === "pass"
  ).length;
  const warningCount = result.field_comparisons.filter(
    (fc) => fc.status === "warning"
  ).length;
  const failCount = result.field_comparisons.filter(
    (fc) => fc.status === "fail"
  ).length;

  const hasCriticalIssues = result.critical_issues.length > 0;
  const hasWarnings = result.warnings.length > 0;
  const hasIssues = hasCriticalIssues || hasWarnings;

  return (
    <div className="space-y-5">
      {!imageQuality.readable && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Image Quality Issues</p>
            <p className="text-sm text-yellow-700">
              {imageQuality.issues.join(", ")}. Results may be less accurate.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1 rounded-lg border border-green-200 bg-green-50/50 p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{passCount}</div>
          <div className="text-xs text-green-600 font-medium">Pass</div>
        </div>
        <div className="flex-1 rounded-lg border border-yellow-200 bg-yellow-50/50 p-3 text-center">
          <div className="text-2xl font-bold text-yellow-700">
            {warningCount}
          </div>
          <div className="text-xs text-yellow-600 font-medium">Warning</div>
        </div>
        <div className="flex-1 rounded-lg border border-red-200 bg-red-50/50 p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{failCount}</div>
          <div className="text-xs text-red-600 font-medium">Fail</div>
        </div>
      </div>

      {hasIssues && (
        <div className="rounded-lg border border-red-200 bg-red-50/30 overflow-hidden">
          {hasCriticalIssues && (
            <div className="p-4">
              <h3 className="flex items-center gap-2 font-semibold text-red-800 mb-2">
                <XCircle className="h-5 w-5" />
                Critical Issues ({result.critical_issues.length})
              </h3>
              <ul className="space-y-1">
                {result.critical_issues.map((issue, i) => (
                  <li key={i} className="text-sm text-red-700 ml-7">
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hasCriticalIssues && hasWarnings && <Separator />}
          {hasWarnings && (
            <div className="p-4">
              <h3 className="flex items-center gap-2 font-semibold text-yellow-800 mb-2">
                <AlertTriangle className="h-5 w-5" />
                Warnings ({result.warnings.length})
              </h3>
              <ul className="space-y-1">
                {result.warnings.map((warning, i) => (
                  <li key={i} className="text-sm text-yellow-700 ml-7">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {result.allowable_revisions_applied.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="flex items-center gap-2 font-semibold text-blue-800 mb-2">
            <CheckCircle className="h-5 w-5" />
            Allowable Revisions Applied
          </h3>
          <ul className="space-y-1">
            {result.allowable_revisions_applied.map((rev, i) => (
              <li key={i} className="text-sm text-blue-700 ml-7">
                {rev}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-3">Field-by-Field Comparison</h3>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40px] px-3"></TableHead>
                <TableHead className="px-3">Field</TableHead>
                <TableHead className="px-3">Application</TableHead>
                <TableHead className="px-3">Label</TableHead>
                <TableHead className="px-3 w-[100px]">Match</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.field_comparisons.map((fc) => (
                <FieldComparisonTableRow key={fc.field} comparison={fc} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {result.extracted_fields.government_warning && (
        <div>
          <h3 className="font-semibold mb-3">Government Warning Analysis</h3>
          <GovernmentWarningCheck
            warning={result.extracted_fields.government_warning}
          />
        </div>
      )}
    </div>
  );
}

function FieldComparisonTableRow({
  comparison,
}: {
  comparison: FieldComparison;
}) {
  const { icon: Icon, className: iconClass } = statusIcons[comparison.status];
  const cfrRef = CFR_REFERENCES[comparison.field];
  const fieldLabel = FIELD_LABELS[comparison.field] || comparison.field;

  return (
    <>
      <TableRow
        className={cn(
          comparison.status === "pass" && "bg-green-50/40",
          comparison.status === "warning" && "bg-yellow-50/40",
          comparison.status === "fail" && "bg-red-50/40",
          comparison.note && "border-b-0"
        )}
      >
        <TableCell className="px-3 py-2">
          <Icon className={cn("h-4 w-4", iconClass)} />
        </TableCell>
        <TableCell className="px-3 py-2 font-medium">
          <span className="flex items-center gap-1.5">
            {fieldLabel}
            {cfrRef && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{cfrRef}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </span>
        </TableCell>
        <TableCell className="px-3 py-2 text-sm">
          {comparison.application_value || "—"}
        </TableCell>
        <TableCell className="px-3 py-2 text-sm">
          {comparison.label_value || "—"}
        </TableCell>
        <TableCell className="px-3 py-2">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-xs font-medium",
              comparison.match_type === "exact" &&
                "bg-green-100 text-green-700",
              comparison.match_type === "fuzzy" && "bg-blue-100 text-blue-700",
              comparison.match_type === "normalized" &&
                "bg-blue-100 text-blue-700",
              comparison.match_type === "mismatch" &&
                "bg-red-100 text-red-700",
              comparison.match_type === "missing" &&
                "bg-gray-100 text-gray-700"
            )}
          >
            {comparison.match_type}
          </span>
        </TableCell>
      </TableRow>
      {comparison.note && (
        <TableRow
          className={cn(
            comparison.status === "pass" && "bg-green-50/40",
            comparison.status === "warning" && "bg-yellow-50/40",
            comparison.status === "fail" && "bg-red-50/40"
          )}
        >
          <TableCell className="px-3 pt-0 pb-2" />
          <TableCell
            colSpan={4}
            className="px-3 pt-0 pb-2 text-xs text-muted-foreground"
          >
            {comparison.note}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

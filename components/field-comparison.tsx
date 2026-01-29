import { CheckCircle, XCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldComparison as FieldComparisonType } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

interface FieldComparisonProps {
  comparison: FieldComparisonType;
}

export function FieldComparisonRow({ comparison }: FieldComparisonProps) {
  const { icon: Icon, className: iconClass } = statusIcons[comparison.status];
  const cfrRef = CFR_REFERENCES[comparison.field];
  const fieldLabel = FIELD_LABELS[comparison.field] || comparison.field;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3",
        comparison.status === "pass" && "border-green-200 bg-green-50/50",
        comparison.status === "warning" && "border-yellow-200 bg-yellow-50/50",
        comparison.status === "fail" && "border-red-200 bg-red-50/50"
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconClass)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{fieldLabel}</span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-xs",
              comparison.match_type === "exact" && "bg-green-100 text-green-700",
              comparison.match_type === "fuzzy" && "bg-blue-100 text-blue-700",
              comparison.match_type === "normalized" && "bg-blue-100 text-blue-700",
              comparison.match_type === "mismatch" && "bg-red-100 text-red-700",
              comparison.match_type === "missing" && "bg-gray-100 text-gray-700"
            )}
          >
            {comparison.match_type}
          </span>
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
        </div>
        <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Application: </span>
            <span>{comparison.application_value || "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Label: </span>
            <span>{comparison.label_value || "—"}</span>
          </div>
        </div>
        {comparison.note && (
          <p className="mt-1 text-sm text-muted-foreground">
            {comparison.note}
          </p>
        )}
      </div>
    </div>
  );
}

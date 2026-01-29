import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OverallStatus } from "@/lib/types";

const statusConfig: Record<
  OverallStatus | "PROCESSING",
  { label: string; className: string; icon: React.ElementType }
> = {
  APPROVED: {
    label: "Approved",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  NEEDS_REVIEW: {
    label: "Needs Review",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: AlertTriangle,
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Loader2,
  },
};

interface StatusBadgeProps {
  status: OverallStatus | "PROCESSING";
  size?: "sm" | "default" | "lg";
}

export function StatusBadge({ status, size = "default" }: StatusBadgeProps) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        cfg.className,
        size === "sm" && "text-xs px-2 py-0.5",
        size === "lg" && "text-base px-4 py-2"
      )}
    >
      <Icon
        className={cn(
          "mr-1",
          size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4",
          status === "PROCESSING" && "animate-spin"
        )}
      />
      {cfg.label}
    </Badge>
  );
}

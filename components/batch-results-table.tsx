"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import type { BatchResultItem, OverallStatus } from "@/lib/types";

interface BatchResultsTableProps {
  results: BatchResultItem[];
  onViewDetail?: (result: BatchResultItem) => void;
}

type SortField = "id" | "status" | "processing_time_ms";
type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<OverallStatus, number> = {
  REJECTED: 0,
  NEEDS_REVIEW: 1,
  APPROVED: 2,
};

export function BatchResultsTable({
  results,
  onViewDetail,
}: BatchResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filter, setFilter] = useState<OverallStatus | "ALL">("ALL");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 ml-1" />
    );
  };

  const filtered =
    filter === "ALL"
      ? results
      : results.filter((r) => r.status === filter);

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "id") return a.id.localeCompare(b.id) * dir;
    if (sortField === "processing_time_ms")
      return (a.processing_time_ms - b.processing_time_ms) * dir;
    if (sortField === "status")
      return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * dir;
    return 0;
  });

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2">
        {(["ALL", "REJECTED", "NEEDS_REVIEW", "APPROVED"] as const).map(
          (f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "ALL"
                ? `All (${results.length})`
                : f === "REJECTED"
                  ? `Rejected (${results.filter((r) => r.status === "REJECTED").length})`
                  : f === "NEEDS_REVIEW"
                    ? `Review (${results.filter((r) => r.status === "NEEDS_REVIEW").length})`
                    : `Approved (${results.filter((r) => r.status === "APPROVED").length})`}
            </Button>
          )
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("id")}
              >
                <div className="flex items-center">
                  Label ID
                  <SortIcon field="id" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("status")}
              >
                <div className="flex items-center">
                  Status
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead>Issues</TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => toggleSort("processing_time_ms")}
              >
                <div className="flex items-center justify-end">
                  Time
                  <SortIcon field="processing_time_ms" />
                </div>
              </TableHead>
              {onViewDetail && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((result) => (
              <TableRow key={result.id}>
                <TableCell className="font-mono text-sm">
                  {result.id}
                </TableCell>
                <TableCell>
                  <StatusBadge status={result.status} size="sm" />
                </TableCell>
                <TableCell className="text-sm">
                  {result.error ? (
                    <span className="text-destructive">{result.error}</span>
                  ) : result.critical_issues.length > 0 ? (
                    <span className="text-red-600">
                      {result.critical_issues[0]}
                      {result.critical_issues.length > 1 &&
                        ` (+${result.critical_issues.length - 1} more)`}
                    </span>
                  ) : result.warnings.length > 0 ? (
                    <span className="text-yellow-600">
                      {result.warnings[0]}
                      {result.warnings.length > 1 &&
                        ` (+${result.warnings.length - 1} more)`}
                    </span>
                  ) : (
                    <span className="text-green-600">No issues</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {(result.processing_time_ms / 1000).toFixed(1)}s
                </TableCell>
                {onViewDetail && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(result)}
                    >
                      View
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={onViewDetail ? 5 : 4}
                  className="text-center text-muted-foreground py-8"
                >
                  No results to display
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { config } from "@/lib/config";

interface UploadZoneProps {
  multiple?: boolean;
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

export function UploadZone({
  multiple = false,
  maxFiles = 50,
  onFilesSelected,
  className,
}: UploadZoneProps) {
  const [previews, setPreviews] = useState<
    { file: File; url: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: unknown[]) => {
      setError(null);

      if (rejectedFiles && (rejectedFiles as unknown[]).length > 0) {
        setError("Some files were rejected. Use JPG, PNG, TIFF, or WebP under 10MB.");
        return;
      }

      const newPreviews = acceptedFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));

      if (multiple) {
        setPreviews((prev) => [...prev, ...newPreviews]);
        onFilesSelected([
          ...previews.map((p) => p.file),
          ...acceptedFiles,
        ]);
      } else {
        previews.forEach((p) => URL.revokeObjectURL(p.url));
        setPreviews(newPreviews);
        onFilesSelected(acceptedFiles);
      }
    },
    [multiple, onFilesSelected, previews]
  );

  const removeFile = (index: number) => {
    setPreviews((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      onFilesSelected(updated.map((p) => p.file));
      return updated;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/tiff": [".tiff", ".tif"],
      "image/webp": [".webp"],
    },
    maxSize: config.limits.maxFileSizeBytes,
    multiple,
    maxFiles: multiple ? maxFiles : 1,
  });

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          previews.length > 0 && !multiple && "p-4"
        )}
      >
        <input {...getInputProps()} />
        {previews.length > 0 && !multiple ? (
          <div className="relative w-full">
            <img
              src={previews[0].url}
              alt="Label preview"
              className="mx-auto max-h-64 rounded-md object-contain"
            />
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {previews[0].file.name} ({(previews[0].file.size / 1024).toFixed(0)} KB)
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Click or drop to replace
            </p>
          </div>
        ) : (
          <>
            <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-medium">
              {isDragActive
                ? "Drop label image here"
                : multiple
                  ? "Drop label images here, or click to select"
                  : "Drop a label image here, or click to select"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              JPG, PNG, TIFF, or WebP up to 10MB
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}

      {multiple && previews.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">
            {previews.length} file{previews.length !== 1 ? "s" : ""} selected
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {previews.map((preview, i) => (
              <div
                key={i}
                className="group relative rounded-md border bg-muted/50 p-2"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs">
                    {preview.file.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

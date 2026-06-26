"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { dashboardInputClass } from "@/lib/dashboard-ui";
import { readFileAsDataUrl } from "@/lib/image-crop";
import { isOptimizableRemoteImage } from "@/lib/utils";
import { ImageCropDialog } from "@/components/dashboard/ImageCropDialog";

export type BusinessImageKind = "logo" | "banner" | "gallery";

type Props = {
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  kind: BusinessImageKind;
  aspectRatio: number;
  outputWidth: number;
  previewClassName?: string;
  previewShape?: "square" | "wide" | "circle";
  allowUrl?: boolean;
};

export function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  kind,
  aspectRatio,
  outputWidth,
  previewClassName,
  previewShape = "square",
  allowUrl = true,
}: Props) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  async function uploadBlob(blob: Blob) {
    setUploading(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", blob, `${kind}.webp`);
      data.append("kind", kind);
      const res = await fetch("/api/dashboard/upload/image", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Upload failed.");
      }
      onChange(json.url);
    } finally {
      setUploading(false);
    }
  }

  async function handleFileSelect(file: File) {
    setError("");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCropSrc(dataUrl);
      setCropOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read image.");
    }
  }

  const previewClasses =
    previewClassName ??
    (previewShape === "circle"
      ? "size-16 rounded-full"
      : previewShape === "wide"
        ? "h-28 w-full rounded-xl"
        : "h-24 w-24 rounded-xl");

  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>

      {value.trim() ? (
        <div className={`relative mt-3 overflow-hidden border bg-muted/20 ${previewClasses}`}>
          {previewShape === "circle" ? (
            <Image
              src={value.trim()}
              alt=""
              width={64}
              height={64}
              className="size-full object-contain"
              unoptimized={!isOptimizableRemoteImage(value.trim())}
            />
          ) : (
            <Image
              src={value.trim()}
              alt=""
              fill
              className="object-cover"
              sizes="320px"
              unoptimized={!isOptimizableRemoteImage(value.trim())}
            />
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/75"
            aria-label={`Remove ${label.toLowerCase()}`}
          >
            <Icon name="x-lg" className="text-xs" />
          </button>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor={inputId} className="inline-flex">
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void handleFileSelect(file);
            }}
          />
          <span className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
            <Icon name="upload" className="text-xs" />
            {uploading ? "Uploading…" : value.trim() ? "Replace image" : "Upload image"}
          </span>
        </label>
      </div>

      {allowUrl ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${dashboardInputClass} mt-3`}
          placeholder="Or paste an image URL"
        />
      ) : null}

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

      {cropSrc ? (
        <ImageCropDialog
          open={cropOpen}
          onOpenChange={(open) => {
            setCropOpen(open);
            if (!open) setCropSrc(null);
          }}
          imageSrc={cropSrc}
          title={`Adjust ${label.toLowerCase()}`}
          description="Drag to reposition and use zoom to frame the image."
          aspectRatio={aspectRatio}
          outputWidth={outputWidth}
          shape={previewShape === "circle" ? "circle" : "rectangle"}
          onConfirm={uploadBlob}
        />
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import {
  cropImageWithTransform,
  type CropTransform,
} from "@/lib/image-crop";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  title: string;
  description?: string;
  aspectRatio: number;
  outputWidth: number;
  onConfirm: (blob: Blob) => void | Promise<void>;
};

const DEFAULT_TRANSFORM: CropTransform = { scale: 1, offsetX: 0, offsetY: 0 };

function coverScale(
  image: { width: number; height: number },
  frame: { width: number; height: number },
  scale: number,
) {
  const base = Math.max(frame.width / image.width, frame.height / image.height);
  return base * Math.max(1, scale);
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  title,
  description,
  aspectRatio,
  outputWidth,
  onConfirm,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [transform, setTransform] = useState<CropTransform>(DEFAULT_TRANSFORM);
  const [frameSize, setFrameSize] = useState({ width: 320, height: 180 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setTransform(DEFAULT_TRANSFORM);
      setImageSize(null);
      setError("");
    }
  }, [open, imageSrc]);

  useEffect(() => {
    const node = frameRef.current;
    if (!node || !open) return;

    const updateSize = () => {
      const width = node.clientWidth;
      setFrameSize({
        width,
        height: Math.round(width / aspectRatio),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [aspectRatio, open]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: transform.offsetX,
      offsetY: transform.offsetY,
    };
  }, [transform.offsetX, transform.offsetY]);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setTransform((current) => ({
      ...current,
      offsetX: dragRef.current!.offsetX + (event.clientX - dragRef.current!.x),
      offsetY: dragRef.current!.offsetY + (event.clientY - dragRef.current!.y),
    }));
  }, []);

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  async function handleConfirm() {
    setSaving(true);
    setError("");
    try {
      const { blob } = await cropImageWithTransform(imageSrc, frameSize, transform, {
        outputWidth,
        mimeType: "image/webp",
        quality: 0.9,
      });
      await onConfirm(blob);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not crop image.");
    } finally {
      setSaving(false);
    }
  }

  const displayScale =
    imageSize && frameSize.width > 0
      ? coverScale(imageSize, frameSize, transform.scale)
      : 1;
  const displayWidth = imageSize ? imageSize.width * displayScale : "auto";
  const displayHeight = imageSize ? imageSize.height * displayScale : "auto";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed inset-x-4 top-[8vh] z-50 mx-auto flex max-h-[84vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl dark:border-neutral-800">
          <div className="flex items-start justify-between border-b px-5 py-4 dark:border-neutral-800">
            <div>
              <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <Icon name="x-lg" />
            </Dialog.Close>
          </div>

          <div className="space-y-4 overflow-y-auto px-5 py-4">
            <div
              ref={frameRef}
              className="relative w-full touch-none overflow-hidden rounded-xl border bg-muted/30 dark:border-neutral-800"
              style={{ height: frameSize.height || undefined }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt=""
                draggable={false}
                onLoad={(event) => {
                  setImageSize({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  });
                }}
                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: displayWidth,
                  height: displayHeight,
                  transform: `translate(calc(-50% + ${transform.offsetX}px), calc(-50% + ${transform.offsetY}px))`,
                }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/10 ring-inset dark:ring-white/10" />
            </div>

            <div>
              <label className="text-sm font-medium">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={transform.scale}
                onChange={(e) =>
                  setTransform((current) => ({ ...current, scale: Number(e.target.value) }))
                }
                className="mt-2 w-full"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Drag to reposition. Use zoom to frame the image before saving.
            </p>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t px-5 py-4 dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={handleConfirm} className="min-h-11">
              {saving ? "Saving…" : "Use image"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

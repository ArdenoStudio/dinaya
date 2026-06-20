import Image from "next/image";

/** Auth7-style halftone cloud panel (pre-dithered raster, not CSS gradients). */
export function AuthHalftonePanelArt() {
  return (
    <Image
      src="/auth/signin-panel.avif"
      alt=""
      fill
      priority
      sizes="(min-width: 1024px) 50vw, 0px"
      className="object-cover"
      aria-hidden
    />
  );
}

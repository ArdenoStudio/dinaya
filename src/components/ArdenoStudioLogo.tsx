import Image from "next/image";
import { cn } from "@/lib/utils";

type ArdenoStudioLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const SIZE = {
  sm: { className: "h-7", width: 168, height: 62 },
  md: { className: "h-9", width: 216, height: 80 },
  lg: { className: "h-11", width: 264, height: 98 },
  xl: { className: "h-14 sm:h-16", width: 320, height: 118 },
} as const;

export function ArdenoStudioLogo({ className, size = "md" }: ArdenoStudioLogoProps) {
  const { className: heightClass, width, height } = SIZE[size];

  return (
    <span className={cn("relative inline-flex items-center justify-center", className)}>
      <Image
        src="/ardeno-studio-logo-light.svg"
        alt="Ardeno Studio"
        width={width}
        height={height}
        className={cn(heightClass, "w-auto max-w-full dark:hidden")}
      />
      <Image
        src="/ardeno-studio-logo.svg"
        alt="Ardeno Studio"
        width={width}
        height={height}
        className={cn(heightClass, "w-auto max-w-full hidden dark:block")}
      />
    </span>
  );
}

"use client"

import { cn } from "@/lib/utils"

interface Avatar {
  imageUrl: string
  profileUrl: string
}
interface AvatarCirclesProps {
  className?: string
  numPeople?: number
  avatarUrls: Avatar[]
}

export const AvatarCircles = ({
  numPeople,
  className,
  avatarUrls,
}: AvatarCirclesProps) => {
  return (
    <div className={cn("z-10 flex -space-x-4 rtl:space-x-reverse", className)}>
      {avatarUrls.map((url, index) => (
        <span key={index}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Magic UI avatar stack */}
          <img
            className="h-10 w-10 rounded-full border-2 border-white object-cover dark:border-gray-800"
            src={url.imageUrl}
            width={40}
            height={40}
            alt={`Avatar ${index + 1}`}
          />
        </span>
      ))}
      {(numPeople ?? 0) > 0 && (
        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-muted text-center text-xs font-medium text-muted-foreground dark:border-gray-800">
          +{numPeople}
        </span>
      )}
    </div>
  )
}

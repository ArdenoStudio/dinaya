interface OrbitProps {
  radiusPx?: number;
  children: React.ReactNode;
  orbitingObjects: React.ReactNode[];
  defaultObjectSize?: number;
  durationSeconds?: number;
  keepUpright?: boolean;
}

export function Orbit({
  radiusPx = 144,
  children,
  orbitingObjects = [],
  defaultObjectSize = 32,
  durationSeconds = 8,
  keepUpright = false,
}: OrbitProps) {
  const orbitDiameter = radiusPx * 2;
  const containerSize = orbitDiameter + defaultObjectSize;
  const initialOffset = radiusPx + defaultObjectSize / 2;

  const positionedObjects = orbitingObjects.map((object, index) => {
    const delaySeconds = -(index * (durationSeconds / orbitingObjects.length));
    return (
      <div
        key={index}
        className="absolute flex items-center justify-center"
        style={{
          animationName: "spin",
          animationDuration: `${durationSeconds}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationDelay: `${delaySeconds}s`,
          transformOrigin: `calc(50% + ${radiusPx}px) 50%`,
          left: `calc(50% - ${initialOffset}px)`,
          top: `calc(50% - ${defaultObjectSize / 2}px)`,
          width: `${defaultObjectSize}px`,
          height: `${defaultObjectSize}px`,
        }}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={
            keepUpright
              ? {
                  animationName: "spin",
                  animationDuration: `${durationSeconds}s`,
                  animationTimingFunction: "linear",
                  animationIterationCount: "infinite",
                  animationDelay: `${delaySeconds}s`,
                  animationDirection: "reverse",
                }
              : undefined
          }
        >
          {object}
        </div>
      </div>
    );
  });

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: `${containerSize}px`,
        height: `${containerSize}px`,
      }}
    >
      {/* Orbital path */}
      <div
        className="absolute animate-pulse rounded-full border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/60"
        style={{ width: `${orbitDiameter}px`, height: `${orbitDiameter}px` }}
      />
      {positionedObjects}
      {children}
    </div>
  );
}

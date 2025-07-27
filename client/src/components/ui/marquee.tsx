import React, { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  direction?: "left" | "right";
  speed?: number;
  pauseOnHover?: boolean;
}

export function Marquee({
  children,
  className,
  direction = "left",
  speed = 40,
  pauseOnHover = true,
}: MarqueeProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  // Adjust speed based on viewport width
  const responsiveSpeed = viewportWidth < 640 ? speed * 0.7 : speed;

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex overflow-hidden",
        pauseOnHover && "hover:[--play-state:paused]",
        className
      )}
    >
      <div
        className="flex min-w-full shrink-0 items-center justify-around gap-2 sm:gap-4"
        style={
          {
            "--duration": `${responsiveSpeed}s`,
            "--direction": direction === "right" ? "reverse" : "normal",
            "--play-state": "running",
            animation:
              "scroll var(--duration) linear infinite var(--direction)",
            animationPlayState: "var(--play-state)",
          } as React.CSSProperties
        }
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className="flex min-w-full shrink-0 items-center justify-around gap-2 sm:gap-4"
        style={
          {
            "--duration": `${responsiveSpeed}s`,
            "--direction": direction === "right" ? "reverse" : "normal",
            "--play-state": "running",
            animation:
              "scroll var(--duration) linear infinite var(--direction)",
            animationPlayState: "var(--play-state)",
          } as React.CSSProperties
        }
      >
        {children}
      </div>

      <style jsx global>{`
        @keyframes scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-100% - 0.5rem));
          }
        }

        @media (min-width: 640px) {
          @keyframes scroll {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(calc(-100% - 1rem));
            }
          }
        }
      `}</style>
    </div>
  );
}

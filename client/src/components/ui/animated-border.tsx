import React, { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedBorderProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  duration?: number;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: string;
  animateGlow?: boolean;
}

export function AnimatedBorder({
  children,
  className,
  containerClassName,
  duration = 2.5,
  borderWidth = 1,
  borderColor = "var(--gaming-purple)",
  borderRadius = "0.75rem",
  animateGlow = true,
}: AnimatedBorderProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile or has small screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Adjust animation properties for mobile
  const mobileDuration = isMobile ? duration * 1.5 : duration;
  const mobileGlowOpacity = isMobile ? 0.2 : 0.3;

  return (
    <div
      className={cn(
        "relative rounded-xl p-[1px] overflow-hidden",
        containerClassName
      )}
      style={{
        borderRadius,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(var(--rotate), ${borderColor} 0%, var(--gaming-purple-light) 20%, transparent 80%)`,
          width: "200%",
          height: "200%",
          top: "-50%",
          left: "-50%",
          animation: `border-rotate ${mobileDuration}s linear infinite`,
        }}
      />
      {animateGlow && (
        <div
          className={cn(
            "absolute inset-0 blur-xl",
            isMobile ? "blur-lg" : "blur-xl"
          )}
          style={{
            background: `linear-gradient(var(--rotate), ${borderColor} 0%, var(--gaming-purple-light) 20%, transparent 80%)`,
            width: "200%",
            height: "200%",
            top: "-50%",
            left: "-50%",
            opacity: mobileGlowOpacity,
            animation: `border-rotate ${mobileDuration}s linear infinite`,
          }}
        />
      )}
      <div
        className={cn(
          "relative rounded-[calc(0.75rem-1px)] bg-[var(--dashboard-card)] h-full",
          className
        )}
        style={{
          borderRadius: `calc(${borderRadius} - ${borderWidth}px)`,
        }}
      >
        {children}
      </div>
      <style jsx global>{`
        @keyframes border-rotate {
          0% {
            --rotate: 0deg;
          }
          100% {
            --rotate: 360deg;
          }
        }
      `}</style>
    </div>
  );
}

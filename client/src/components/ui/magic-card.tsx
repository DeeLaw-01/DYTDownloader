import React, { useState, useRef, ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MagicCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  borderRadius?: string;
  animateOnHover?: boolean;
}

export function MagicCard({
  children,
  className,
  glowColor = "var(--gaming-purple)",
  borderRadius = "0.75rem",
  animateOnHover = true,
}: MagicCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!animateOnHover || !cardRef.current || isMobile) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();

    // Calculate position relative to card
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosition({ x, y });
    setOpacity(0.15);
  };

  const handleMouseLeave = () => {
    if (!animateOnHover || isMobile) return;
    setOpacity(0);
  };

  // Handle touch events for mobile
  const handleTouchStart = () => {
    if (isMobile) {
      setOpacity(0.1);
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setPosition({
          x: rect.width / 2,
          y: rect.height / 2,
        });
      }
    }
  };

  const handleTouchEnd = () => {
    if (isMobile) {
      setOpacity(0);
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        !isMobile && "hover:scale-[1.02]",
        className
      )}
      style={{ borderRadius }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Glow effect */}
      <div
        className="absolute pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${glowColor} 0%, transparent 70%)`,
          top: "-100%",
          left: "-100%",
          width: "300%",
          height: "300%",
          opacity,
        }}
      />

      {/* Card content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

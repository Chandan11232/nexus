"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedBackgroundProps {
  className?: string;
}

export function AnimatedBackground({ className }: AnimatedBackgroundProps) {
  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-white to-accent-50 dark:from-surface-950 dark:via-surface-950 dark:to-surface-900" />
      
      <motion.div
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-brand-500/20 via-transparent to-accent-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-accent-500/15 via-transparent to-brand-500/15 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 5 }}
      />
      
      <motion.div
        className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-r from-brand-400/10 via-transparent to-accent-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-surface-200/30 to-transparent dark:via-surface-800/30" />
      
      <GridPattern />
      <FloatingOrbs />
    </div>
  );
}

function GridPattern() {
  return (
    <div className="absolute inset-0 opacity-30" aria-hidden="true">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
      </svg>
    </div>
  );
}

function FloatingOrbs() {
  const orbs = [
    { x: "10%", y: "20%", size: "80px", delay: 0, color: "brand" },
    { x: "85%", y: "15%", size: "60px", delay: 2, color: "accent" },
    { x: "15%", y: "80%", size: "100px", delay: 4, color: "brand" },
    { x: "90%", y: "85%", size: "70px", delay: 6, color: "accent" },
    { x: "50%", y: "5%", size: "50px", delay: 1, color: "brand" },
    { x: "5%", y: "50%", size: "90px", delay: 3, color: "accent" },
  ];

  return (
    <>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute rounded-full blur-3xl opacity-20",
            `bg-${orb.color}-500`,
            `w-[${orb.size}] h-[${orb.size}]`,
            `left-[${orb.x}] top-[${orb.y}]`
          )}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 15 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}
    </>
  );
}

export function NoiseOverlay() {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
      aria-hidden="true"
    />
  );
}

export function Scanlines() {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none opacity-[0.02]"
      style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)`,
      }}
      aria-hidden="true"
    />
  );
}
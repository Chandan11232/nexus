import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  }
  return num.toString();
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export const easing = {
  spring: [0.34, 1.56, 0.64, 1] as const,
  smooth: [0.25, 0.46, 0.45, 0.94] as const,
  snappy: [0.4, 0, 0.2, 1] as const,
};
"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Globe, Shield, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroProps {
  className?: string;
}

export function Hero({ className }: HeroProps) {
  const features = [
    { icon: Zap, label: "Real-time Collab", desc: "CRDT-powered conflict-free editing" },
    { icon: Brain, label: "AI Insights", desc: "Summarize, tag, search semantically" },
    { icon: Globe, label: "Global Edge", desc: "Published docs in <50ms worldwide" },
    { icon: Shield, label: "Zero Trust", desc: "Private network, mTLS, signed URLs" },
  ];

  return (
    <section className={cn("relative min-h-screen flex items-center justify-center overflow-hidden", className)}>
      <motion.div
        className="container relative z-10 px-4 md:px-6 lg:px-8 pt-24 pb-16"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
          },
        }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-brand-500/20 dark:border-brand-500/30 mb-8"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            whileHover={{ scale: 1.02 }}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-brand-500"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              Now deployed on Zerops Edge — 4 regions globally
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
          >
            <span className="block text-surface-900 dark:text-surface-50">
              Collaborative
            </span>
            <span className="block gradient-text">
              Knowledge Base
            </span>
            <span className="block text-surface-900 dark:text-surface-50">
              with AI Superpowers
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl lg:text-2xl text-surface-600 dark:text-surface-400 max-w-3xl mx-auto mb-10 text-balance"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            Write together in real-time. Get AI summaries, semantic search, and auto-tagging.
            Publish instantly to global edge. No signup required — just start writing.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <a
              href="/editor"
              className="group relative btn-primary px-8 py-4 text-lg z-10"
              style={{ textDecoration: "none" }}
            >
              <span>Start Writing Free</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <a
              href="#demo"
              className="btn-secondary px-8 py-4 text-lg z-10"
              style={{ textDecoration: "none" }}
            >
              Watch Demo
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </a>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-surface-500 dark:text-surface-500 mb-12"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <span className="flex items-center gap-1.5">
              <input type="checkbox" checked disabled className="w-4 h-4 accent-brand-500" aria-label="No signup required" />
              No signup required
            </span>
            <span className="flex items-center gap-1.5">
              <input type="checkbox" checked disabled className="w-4 h-4 accent-brand-500" aria-label="Real-time collaboration" />
              Real-time collaboration
            </span>
            <span className="flex items-center gap-1.5">
              <input type="checkbox" checked disabled className="w-4 h-4 accent-brand-500" aria-label="AI powered" />
              AI powered
            </span>
            <span className="flex items-center gap-1.5">
              <input type="checkbox" checked disabled className="w-4 h-4 accent-brand-500" aria-label="Global edge publishing" />
              Global edge publishing
            </span>
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.label}
                className="flex items-center gap-3 px-5 py-3 rounded-xl glass"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -2 }}
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-surface-900 dark:text-surface-50 text-sm">{feature.label}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-500">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

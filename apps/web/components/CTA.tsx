"use client";

import { motion } from "framer-motion";
import { ArrowRight, Github, Twitter, MessageCircle, ExternalLink, Zap, Globe, Shield, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

export function CTA({ className }: { className?: string }) {
  return (
    <section className={cn("relative py-20 md:py-32 lg:py-40 px-4 md:px-6 lg:px-8 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-accent-500/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-brand-500/5 to-transparent" />
      
      <div className="container relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-brand-500/30 dark:border-brand-500/40 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-green-500"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
              Live on Zerops Edge — 4 Regions
            </span>
          </motion.div>

          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Ready to Build Your Own
            <br />
            <span className="gradient-text">Global Knowledge Base</span>?
          </motion.h2>

          <motion.p
            className="text-lg md:text-xl text-surface-600 dark:text-surface-400 mb-10 max-w-2xl mx-auto text-balance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Clone the repo, deploy to Zerops in minutes. Full infrastructure as code, auto-scaling, global edge — all configured in one YAML file.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <a
              href="https://github.com/yourusername/nexus"
              target="_blank"
              rel="noopener noreferrer"
              className="group btn-primary px-8 py-4 text-lg flex items-center gap-2"
              style={{ textDecoration: "none" }}
            >
              <Github className="w-5 h-5" aria-hidden="true" />
              <span>View Source on GitHub</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <a
              href="https://zerops.io"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-8 py-4 text-lg flex items-center gap-2"
              style={{ textDecoration: "none" }}
            >
              <Zap className="w-5 h-5" aria-hidden="true" />
              <span>Deploy on Zerops</span>
              <ExternalLink className="w-5 h-5" aria-hidden="true" />
            </a>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-surface-500 dark:text-surface-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" aria-hidden="true" />
              <span>Zero Trust Network</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" aria-hidden="true" />
              <span>Global Edge</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" aria-hidden="true" />
              <span>AI Workers</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" aria-hidden="true" />
              <span>Auto-scaling</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <a
            href="https://github.com/yourusername/nexus"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg glass hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5 text-surface-600 dark:text-surface-400" aria-hidden="true" />
          </a>
          <a
            href="https://twitter.com/nexus"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg glass hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="w-5 h-5 text-surface-600 dark:text-surface-400" aria-hidden="true" />
          </a>
          <a
            href="https://discord.gg/nexus"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg glass hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            aria-label="Discord"
          >
            <MessageCircle className="w-5 h-5 text-surface-600 dark:text-surface-400" aria-hidden="true" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
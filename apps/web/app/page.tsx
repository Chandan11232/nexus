"use client";

import { motion } from "framer-motion";
import { ArrowRight, Brain, Globe, Zap, FileText, Users, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Nav */}
      <nav className="h-14 border-b border-surface-800 flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg">Nexus</span>
        </div>
        <div className="flex-1" />
        <Link
          href="/editor"
          className="btn-primary text-sm px-4 py-1.5"
        >
          Open Editor
          <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span className="text-sm text-brand-400 font-medium">Live on Zerops Edge — 4 regions</span>
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="text-white">Write together.</span>
            <br />
            <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
              Ship faster.
            </span>
          </motion.h1>

          <motion.p
            className="text-lg text-surface-400 mb-10 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            A collaborative knowledge base with AI superpowers.
            Real-time editing, semantic search, global edge publishing.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/editor" className="btn-primary px-8 py-3 text-base">
              <span>Start Writing Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {[
              { icon: Users, label: "Real-time Collab" },
              { icon: Brain, label: "AI Insights" },
              { icon: Globe, label: "Global Edge" },
              { icon: Zap, label: "Auto-scale" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
                <Icon className="w-4 h-4 text-brand-400" />
                <span className="text-sm text-surface-300">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-surface-800 flex items-center justify-center px-6">
        <p className="text-xs text-surface-500">
          Built for Zerops Hackathon · Powered by Groq + Llama 3.3
        </p>
      </footer>
    </div>
  );
}

"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { 
  Type, 
  Users, 
  Sparkles, 
  Search, 
  FileText, 
  Globe, 
  Download, 
  Share2,
  Zap,
  Brain,
  Layers,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

const demoFeatures = [
  {
    icon: Type,
    title: "Real-time Collaborative Editing",
    desc: "Multiple users edit simultaneously with CRDT-powered conflict resolution. See cursors, selections, and presence in real-time.",
    highlight: "Zero conflict, zero lag",
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    desc: "Auto-generate summaries, extract key points, semantic search across all docs, and smart tagging — all running on auto-scaling workers.",
    highlight: "Runs on Zerops auto-scaling",
  },
  {
    icon: Globe,
    title: "Instant Global Publishing",
    desc: "One-click publish to Zerops Edge network. Your docs served from Tokyo, Frankfurt, Virginia, Sydney with <50ms latency worldwide.",
    highlight: "4 regions, instant purge",
  },
  {
    icon: FileText,
    title: "Rich Content Blocks",
    desc: "Notion-style slash commands: headings, lists, code blocks, tables, embeds, images, callouts, math, diagrams — all collaborative.",
    highlight: "15+ block types",
  },
  {
    icon: Search,
    title: "Semantic Search",
    desc: "Vector embeddings stored in pgvector on read replicas. Search by meaning, not keywords. Powered by scheduled reindex jobs.",
    highlight: "pgvector + read replicas",
  },
  {
    icon: Download,
    title: "Export & Share",
    desc: "Export to PDF, HTML, Markdown, or static site bundle. Signed URLs for secure sharing. Scheduled cleanup of temp files.",
    highlight: "Object Storage + signed URLs",
  },
];

const editorBlocks = [
  { type: "heading", level: 1, content: "Project Alpha — Technical Spec" },
  { type: "paragraph", content: "This document outlines the architecture for our new real-time collaboration platform." },
  { type: "heading", level: 2, content: "Core Requirements" },
  { type: "list", items: ["Sub-100ms latency for cursor sync", "Conflict-free concurrent editing", "Offline-first with sync on reconnect", "End-to-end encryption for sensitive docs"] },
  { type: "heading", level: 2, content: "Tech Stack" },
  { type: "code", language: "yaml", content: `services:
  frontend:
    type: nextjs
    regions: [tokyo, fra, iad, syd]
  api:
    type: go
    scaling: cpu>70%, ws_connections>100
  workers:
    type: python
    scaling: queue_depth>10
  database:
    type: postgresql
    replicas: 2
  storage:
    type: s3
  edge:
    type: cdn
    purge: instant` },
  { type: "callout", variant: "info", content: "💡 Deployed on Zerops with auto-scaling, read replicas, and global edge." },
  { type: "paragraph", content: "The system uses Yjs CRDTs for conflict resolution, WebSocket connections for real-time sync, and pgvector for semantic search." },
];

export function Demo({ className }: { className?: string }) {
  const [activeTab, setActiveTab] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  
  useEffect(() => {
    const unsubscribe = scrollY.on((v) => setScrollProgress(v));
    return unsubscribe;
  }, [scrollY]);

  const y = useTransform(scrollY, [0, 1], [0, -100]);

  return (
    <section id="demo" className={cn("relative py-20 md:py-32 lg:py-40 px-4 md:px-6 lg:px-8", className)}>
      <div className="container">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-brand-500/20 dark:border-brand-500/30 text-sm font-medium text-brand-600 dark:text-brand-400 mb-4">
            <Zap className="w-4 h-4" aria-hidden="true" />
            Live Demo — No Login Required
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Experience the <span className="gradient-text">Editor</span> in Action
          </h2>
          <p className="text-lg text-surface-600 dark:text-surface-400">
            This is a live preview of the collaborative editor. Open in multiple tabs to test real-time sync.
          </p>
        </motion.div>

        <motion.div
          ref={containerRef}
          className="relative"
          style={{ height: "600px" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="absolute inset-0 glass-strong rounded-3xl border-2 border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-accent-500/5" />
            
            <EditorPreview 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
              scrollProgress={scrollProgress}
              y={y}
            />
          </div>

          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3"
            style={{ y }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {demoFeatures.map((_, i) => (
              <motion.button
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  i === activeTab 
                    ? "bg-brand-500 w-8" 
                    : "bg-surface-300 dark:bg-surface-600 hover:bg-brand-500/50"
                )}
                onClick={() => setActiveTab(i)}
                aria-label={`View feature ${i + 1}`}
                whileTap={{ scale: 0.8 }}
              />
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {demoFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="card-interactive group relative overflow-hidden"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              style={{ "--index": i }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-2">{feature.title}</h3>
                <p className="text-surface-600 dark:text-surface-400 mb-4">{feature.desc}</p>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  {feature.highlight}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function EditorPreview({ 
  activeTab, 
  setActiveTab,
  scrollProgress,
  y
}: { 
  activeTab: number;
  setActiveTab: (index: number) => void;
  scrollProgress: number;
  y: any;
}) {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [typingIndex, setTypingIndex] = useState(0);
  const [showCursors, setShowCursors] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTypingIndex((prev) => (prev + 1) % editorBlocks.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Toolbar showCursors={showCursors} setShowCursors={setShowCursors} />
        
        <div className="flex-1 flex overflow-hidden">
          <EditorArea 
            blocks={editorBlocks} 
            typingIndex={typingIndex}
            cursorPos={cursorPos}
            showCursors={showCursors}
            scrollProgress={scrollProgress}
          />
          
          <AIPanel />
        </div>
      </div>
    </div>
  );
}

function Sidebar({ activeTab, setActiveTab }: { activeTab: number; setActiveTab: (index: number) => void }) {
  const tabs = [
    { id: 0, label: "Editor", icon: FileText },
    { id: 1, label: "AI Chat", icon: Sparkles },
    { id: 2, label: "Search", icon: Search },
    { id: 3, label: "History", icon: Layers },
    { id: 4, label: "Publish", icon: Globe },
  ];

  return (
    <motion.div
      className="w-64 bg-white/50 dark:bg-surface-900/50 border-r border-surface-200 dark:border-surface-800 flex flex-col"
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="p-4 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <span className="font-bold text-surface-900 dark:text-surface-50">Nexus</span>
        </div>
      </div>
      
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200",
              activeTab === tab.id
                ? "bg-gradient-to-r from-brand-500/10 to-accent-500/10 text-brand-600 dark:text-brand-400"
                : "text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
            )}
            onClick={() => setActiveTab(tab.id)}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + tab.id * 0.05 }}
          >
            <tab.icon className={cn("w-5 h-5 flex-shrink-0", activeTab === tab.id && "text-brand-500")} aria-hidden="true" />
            <span className="font-medium">{tab.label}</span>
          </motion.button>
        ))}
      </nav>

      <div className="p-3 border-t border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
            <Users className="w-5 h-5 text-surface-600 dark:text-surface-400" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-surface-900 dark:text-surface-50 truncate">Sarah Chen</p>
            <p className="text-xs text-surface-500 dark:text-surface-500">Editing • 2 min ago</p>
          </div>
          <motion.div
            className="w-2 h-2 rounded-full bg-green-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function Toolbar({ showCursors, setShowCursors }: { showCursors: boolean; setShowCursors: (show: boolean) => void }) {
  const tools = [
    { icon: Type, label: "Text", shortcut: "⌘1" },
    { icon: Sparkles, label: "AI", shortcut: "⌘2" },
    { icon: Search, label: "Search", shortcut: "⌘K" },
    { icon: Eye, label: "Preview", shortcut: "⌘3" },
  ];

  return (
    <motion.div
      className="border-b border-surface-200 dark:border-surface-800 px-4 py-2 bg-white/50 dark:bg-surface-900/50"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-1">
        {tools.map((tool, i) => (
          <motion.button
            key={tool.label}
            className="p-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}
          >
            <tool.icon className="w-5 h-5" aria-hidden="true" />
          </motion.button>
        ))}
        
        <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-2" />
        
        <motion.button
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
            showCursors
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-surface-500 dark:text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
          )}
          onClick={() => setShowCursors(!showCursors)}
          whileTap={{ scale: 0.95 }}
        >
          <Users className="w-4 h-4" aria-hidden="true" />
          <span>3 editing</span>
        </motion.button>

        <div className="flex-1" />

        <motion.div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-surface-400 dark:text-surface-600" aria-hidden="true" />
          <span className="text-sm text-surface-500 dark:text-surface-500 font-mono">nexus.app/alpha-spec</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

function EditorArea({ 
  blocks, 
  typingIndex,
  cursorPos,
  showCursors,
  scrollProgress 
}: { 
  blocks: any[];
  typingIndex: number;
  cursorPos: { x: number; y: number };
  showCursors: boolean;
  scrollProgress: number;
}) {
  return (
    <motion.div
      className="flex-1 overflow-y-auto p-6 bg-white dark:bg-surface-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {blocks.map((block, i) => (
          <motion.div
            key={i}
            className={cn(
              "block relative",
              i === typingIndex && "ring-2 ring-brand-500/30 rounded-lg"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
          >
            {renderBlock(block, i)}
            
            {showCursors && i === typingIndex && (
              <motion.div
                className="absolute left-0 top-0 w-px h-full bg-brand-500"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))}

        <motion.div
          className="h-20 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <div className="flex items-center gap-2 text-surface-400 dark:text-surface-600">
            <motion.div
              className="w-6 h-px bg-surface-300 dark:bg-surface-700"
              animate={{ scaleX: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <Type className="w-5 h-5 opacity-50" aria-hidden="true" />
            <motion.div
              className="w-6 h-px bg-surface-300 dark:bg-surface-700"
              animate={{ scaleX: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </div>
        </motion.div>
      </div>

      {showCursors && (
        <>
          <FakeCursor x={120} y={200} name="Sarah" color="#0ea5e9" />
          <FakeCursor x={400} y={350} name="Marcus" color="#d946ef" />
          <FakeCursor x={280} y={500} name="You" color="#22c55e" />
        </>
      )}
    </motion.div>
  );
}

function FakeCursor({ x, y, name, color }: { x: number; y: number; name: string; color: string }) {
  return (
    <motion.div
      className="pointer-events-none fixed z-50"
      style={{ left: x, top: y }}
      animate={{
        y: [0, -5, 0],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="flex flex-col items-start gap-1">
        <div 
          className="w-px h-20" 
          style={{ backgroundColor: color }} 
        />
        <motion.div
          className="px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
          style={{ backgroundColor: color }}
          animate={{ x: [-5, 0, -5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {name}
        </motion.div>
      </div>
    </motion.div>
  );
}

function renderBlock(block: any, index: number) {
  const styles: Record<string, string> = {
    heading: "font-bold text-surface-900 dark:text-surface-50",
    paragraph: "text-surface-600 dark:text-surface-400 leading-relaxed",
    list: "text-surface-600 dark:text-surface-400 space-y-1 pl-6",
    code: "font-mono text-sm bg-surface-100 dark:bg-surface-900 rounded-lg p-4 overflow-x-auto",
    callout: "rounded-lg p-4 border-l-4",
  };

  switch (block.type) {
    case "heading":
      return (
        <h2 className={cn(styles.heading, block.level === 1 ? "text-3xl" : "text-2xl")}>
          {block.content}
        </h2>
      );
    case "paragraph":
      return <p className={styles.paragraph}>{block.content}</p>;
    case "list":
      return (
        <ul className={styles.list}>
          {block.items.map((item: string, i: number) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-brand-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "code":
      return (
        <div className={styles.code}>
          <div className="flex items-center justify-between mb-2 text-xs text-surface-500 dark:text-surface-500">
            <span>{block.language}</span>
            <Download className="w-4 h-4 opacity-50 hover:opacity-100" aria-hidden="true" />
          </div>
          <pre className="text-surface-100 dark:text-surface-100 whitespace-pre-wrap">{block.content}</pre>
        </div>
      );
    case "callout":
      const variantStyles = {
        info: "bg-brand-50 dark:bg-brand-900/30 border-brand-500",
        warning: "bg-amber-50 dark:bg-amber-900/30 border-amber-500",
        success: "bg-green-50 dark:bg-green-900/30 border-green-500",
      };
      return (
        <div className={cn(styles.callout, variantStyles[block.variant as keyof typeof variantStyles] || variantStyles.info)}>
          <p className="text-surface-700 dark:text-surface-300">{block.content}</p>
        </div>
      );
    default:
      return <p className={styles.paragraph}>{block.content}</p>;
  }
}

function AIPanel() {
  const [input, setInput] = useState("");
  const messages = [
    { role: "assistant", content: "I've analyzed this document. Key insights: 1) Real-time sync needs WebSocket + CRDT, 2) AI workers should auto-scale on queue depth, 3) Edge publishing requires instant cache purge." },
    { role: "user", content: "Can you generate a summary for the README?" },
    { role: "assistant", content: "# Project Alpha — Technical Spec\n\nA real-time collaborative knowledge base with AI-powered insights, built on Zerops with global edge deployment.\n\n## Features\n- **Real-time Collaboration**: CRDT-powered conflict-free editing\n- **AI Insights**: Auto-summarization, semantic search, smart tagging\n- **Global Edge**: <50ms latency worldwide via Zerops Edge\n- **Zero Trust**: Private network, mTLS, signed URLs\n\n## Tech Stack\n- Frontend: Next.js on Edge (4 regions)\n- API: Go with WebSocket support\n- Workers: Python (auto-scaling)\n- Database: PostgreSQL + 2 read replicas\n- Storage: S3-compatible Object Storage" },
  ];

  return (
    <motion.div
      className="w-80 bg-white/50 dark:bg-surface-900/50 border-l border-surface-200 dark:border-surface-800 flex flex-col"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="p-4 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-brand-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <span className="font-bold text-surface-900 dark:text-surface-50">AI Assistant</span>
          <motion.div className="ml-auto w-2 h-2 rounded-full bg-green-500" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
        </div>
        <p className="text-xs text-surface-500 dark:text-surface-500">Powered by auto-scaling workers on Zerops</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            className={cn(
              "flex gap-3",
              msg.role === "user" && "flex-row-reverse"
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
          >
            <div 
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                msg.role === "assistant" 
                  ? "bg-gradient-to-br from-accent-500 to-brand-500" 
                  : "bg-surface-100 dark:bg-surface-800"
              )}
            >
              {msg.role === "assistant" ? (
                <Brain className="w-4 h-4 text-white" aria-hidden="true" />
              ) : (
                <Users className="w-4 h-4 text-surface-600 dark:text-surface-400" aria-hidden="true" />
              )}
            </div>
            <div 
              className={cn(
                "max-w-[200px] px-3 py-2 rounded-2xl text-sm",
                msg.role === "assistant"
                  ? "bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-50 rounded-br-none"
                  : "bg-brand-500 text-white rounded-bl-none"
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 border-t border-surface-200 dark:border-surface-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI anything..."
            className="flex-1 input text-sm py-2"
            aria-label="Ask AI"
          />
          <motion.button
            className="btn-primary px-4"
            whileTap={{ scale: 0.95 }}
            disabled={!input.trim()}
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
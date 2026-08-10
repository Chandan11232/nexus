"use client";

import { motion } from "framer-motion";
import { 
  CheckCircle, 
  Code, 
  Database, 
  Server, 
  Globe, 
  Cpu, 
  HardDrive, 
  Clock, 
  Shield,
  Network,
  Zap,
  Brain,
  Layers,
  Terminal,
  GitBranch,
  Docker,
  Kubernetes,
} from "lucide-react";
import { cn } from "@/lib/utils";

const techStack = [
  { category: "Frontend", icon: Code, color: "brand", items: [
    { name: "Next.js 14", desc: "App Router, Edge Runtime, ISR", icon: null },
    { name: "React 18", desc: "Concurrent features, Server Components", icon: null },
    { name: "Tailwind CSS", desc: "Utility-first, dark mode, animations", icon: null },
    { name: "Framer Motion", desc: "Production animations, gestures", icon: null },
    { name: "TypeScript", desc: "Strict mode, type-safe APIs", icon: null },
  ]},
  { category: "Backend", icon: Server, color: "accent", items: [
    { name: "Go 1.22", desc: "High-performance API, WebSocket", icon: null },
    { name: "Gin/Fiber", desc: "Fast HTTP framework", icon: null },
    { name: "SQLC", desc: "Type-safe SQL from queries", icon: null },
    { name: "pgvector", desc: "Vector similarity search", icon: null },
    { name: "Yjs/Automerge", desc: "CRDT for real-time sync", icon: null },
  ]},
  { category: "AI/Workers", icon: Brain, color: "brand", items: [
    { name: "Python 3.11", desc: "ML ecosystem, async workers", icon: null },
    { name: "Celery/RQ", desc: "Distributed task queue", icon: null },
    { name: "Transformers", desc: "Local embedding models", icon: null },
    { name: "LangChain", desc: "LLM orchestration", icon: null },
    { name: "OpenTelemetry", desc: "Distributed tracing", icon: null },
  ]},
  { category: "Data & Storage", icon: Database, color: "accent", items: [
    { name: "PostgreSQL 16", desc: "ACID, partitioning, replicas", icon: null },
    { name: "Read Replicas", desc: "Horizontal read scaling", icon: null },
    { name: "S3-Compatible", desc: "Object storage, signed URLs", icon: null },
    { name: "Redis/Valkey", desc: "Pub/sub, caching, sessions", icon: null },
    { name: "RabbitMQ", desc: "Message broker, DLQ, retries", icon: null },
  ]},
  { category: "Platform (Zerops)", icon: Globe, color: "brand", items: [
    { name: "Edge Global", desc: "4 regions, instant purge", icon: null },
    { name: "Auto-scaling", desc: "CPU, queue, custom metrics", icon: null },
    { name: "Private Network", desc: "mTLS, zero-trust mesh", icon: null },
    { name: "Scheduled Jobs", desc: "Cron, reliability, alerts", icon: null },
    { name: "Managed Services", desc: "PG, Redis, RabbitMQ, S3", icon: null },
  ]},
  { category: "DevOps", icon: Terminal, color: "accent", items: [
    { name: "zerops.yml", desc: "Infrastructure as code", icon: null },
    { name: "GitHub Actions", desc: "CI/CD pipelines", icon: null },
    { name: "Docker", desc: "Container images", icon: null },
    { name: "Local Parity", desc: "docker-compose.dev.yml", icon: null },
    { name: "Observability", desc: "Logs, metrics, traces", icon: null },
  ]},
];

const zeropsServices = [
  { name: "Edge Global Deployment", icon: Globe, desc: "Tokyo, Frankfurt, Virginia, Sydney — instant cache purge", featured: true },
  { name: "Managed PostgreSQL", icon: Database, desc: "Primary + 2 read replicas, automated backups, pgvector", featured: true },
  { name: "Auto-scaling Containers", icon: Cpu, desc: "CPU, memory, custom metrics (queue depth, WS connections)", featured: true },
  { name: "Object Storage (S3)", icon: HardDrive, desc: "Signed URLs, multipart upload, static hosting, lifecycle", featured: true },
  { name: "Private Network / VPN", icon: Shield, desc: "Zero-trust mesh, mTLS, no public IPs for internal services", featured: false },
  { name: "Scheduled Jobs (Cron)", icon: Clock, desc: "Analytics rollup, search reindex, cleanup, monitoring", featured: false },
  { name: "Managed Redis/Valkey", icon: Layers, desc: "Pub/sub, caching, sessions, rate limiting", featured: false },
  { name: "Managed RabbitMQ", icon: GitBranch, desc: "Message routing, dead letters, retries, DLQ", featured: false },
];

export function TechStack({ className }: { className?: string }) {
  return (
    <section className={cn("relative py-20 md:py-32 lg:py-40 px-4 md:px-6 lg:px-8", className)}>
      <div className="container">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-brand-500/20 dark:border-brand-500/30 text-sm font-medium text-brand-600 dark:text-brand-400 mb-4">
            <Terminal className="w-4 h-4" aria-hidden="true" />
            Tech Stack — Production Ready
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Modern Stack, <span className="gradient-text">Zero Compromise</span>
          </h2>
          <p className="text-lg text-surface-600 dark:text-surface-400">
            Every technology chosen for a reason. Type-safe end-to-end, horizontally scalable, globally distributed.
          </p>
        </motion.div>

        <motion.div
          className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {techStack.map((category, catIndex) => (
            <motion.div
              key={category.category}
              className="card group relative overflow-hidden"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              style={{ "--index": catIndex }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", `bg-${category.color}-500/10 text-${category.color}-600 dark:text-${category.color}-400`)}>
                    <category.icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 dark:text-surface-50">{category.category}</h3>
                </div>
                <div className="space-y-3">
                  {category.items.map((item, i) => (
                    <motion.div
                      key={item.name}
                      className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-900/50 hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + catIndex * 0.1 + i * 0.05 }}
                    >
                      <CheckCircle className={cn("w-5 h-5 flex-shrink-0 mt-0.5", `text-${category.color}-500`)} aria-hidden="true" />
                      <div>
                        <div className="font-medium text-surface-900 dark:text-surface-50">{item.name}</div>
                        <div className="text-sm text-surface-500 dark:text-surface-500">{item.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h3 className="text-2xl font-bold text-center text-surface-900 dark:text-surface-50 mb-8">
            Zerops Services <span className="gradient-text">In Use</span>
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {zeropsServices.map((service, i) => (
              <motion.div
                key={service.name}
                className={cn(
                  "card p-4 group relative",
                  service.featured && "ring-2 ring-brand-500/30"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", service.featured ? "bg-brand-500/10 text-brand-600 dark:text-brand-400" : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400")}>
                    <service.icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-surface-900 dark:text-surface-50 truncate">{service.name}</h4>
                    <p className="text-sm text-surface-500 dark:text-surface-500 mt-0.5">{service.desc}</p>
                  </div>
                  {service.featured && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium">
                      Featured
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
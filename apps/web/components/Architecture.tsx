"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Server,
  Database,
  Globe,
  Cpu,
  HardDrive,
  Clock,
  Layers,
  Zap,
  Shield,
  Network,
  BarChart2,
  ArrowRightLeft,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

const services = [
  {
    id: "frontend",
    name: "Frontend (Next.js)",
    icon: Globe,
    description: "Edge-deployed React app with ISR, middleware auth, and instant cache purge on publish",
    zerops: "Edge Global Deployment",
    details: ["4 regions: Tokyo, Frankfurt, Virginia, Sydney", "Edge middleware for geo-routing", "ISR for published docs", "Service worker for offline"],
    metrics: { latency: "<50ms", uptime: "99.99%", regions: 4 },
    color: "brand",
    position: { top: "10%", left: "8%" },
  },
  {
    id: "api",
    name: "API (Go)",
    icon: Server,
    description: "WebSocket + REST API with read-replica routing, JWT auth, and real-time presence",
    zerops: "Auto-scaling Container",
    details: ["Custom metrics: CPU > 70%, WS > 100", "Read-replica routing middleware", "Advisory locks for publish", "mTLS service mesh"],
    metrics: { p99: "45ms", scale: "0-20 replicas", websockets: "10k+/instance" },
    color: "accent",
    position: { top: "10%", right: "8%" },
  },
  {
    id: "workers",
    name: "AI Workers (Python)",
    icon: Cpu,
    description: "Celery queue processing embeddings, summarization, exports — scales on queue depth",
    zerops: "Auto-scaling Workers",
    details: ["Queue depth > 10 → +2 workers", "pgvector embeddings", "PDF/HTML export to S3", "Scheduled batch jobs"],
    metrics: { jobs: "50k/day", scale: "0-15 workers", avgTime: "2.3s" },
    color: "brand",
    position: { bottom: "10%", left: "8%" },
  },
  {
    id: "database",
    name: "PostgreSQL + Replicas",
    icon: Database,
    description: "Primary with 2 read replicas, pgvector for search, partitioned analytics",
    zerops: "Managed PostgreSQL",
    details: ["Primary: writes, advisory locks", "Replica 1: analytics, search", "Replica 2: exports, reporting", "Monthly partitioning"],
    metrics: { lag: "<500ms", storage: "500GB", connections: "500" },
    color: "accent",
    position: { bottom: "10%", right: "8%" },
  },
  {
    id: "storage",
    name: "Object Storage (S3)",
    icon: HardDrive,
    description: "Direct browser uploads via signed URLs, static site hosting, lifecycle rules",
    zerops: "S3-Compatible Storage",
    details: ["Presigned PUT/GET URLs", "Multipart for large files", "Static site hosting", "24h temp cleanup"],
    metrics: { durability: "99.999999999%", cdn: "global", maxFile: "5GB" },
    color: "brand",
    position: { top: "50%", left: "2%", transform: "translateY(-50%)" },
  },
  {
    id: "edge",
    name: "Edge CDN",
    icon: Globe,
    description: "Instant global cache purge, custom domains, TLS termination, DDoS protection",
    zerops: "Edge/Global Deployment",
    details: ["4 PoPs worldwide", "Instant purge API", "Custom domain support", "WAF + DDoS"],
    metrics: { latency: "<30ms", hitRate: "95%", purge: "<1s" },
    color: "accent",
    position: { top: "50%", right: "2%", transform: "translateY(-50%)" },
  },
  {
    id: "cron",
    name: "Scheduled Jobs",
    icon: Clock,
    description: "Analytics rollup, search reindex, cleanup, replica lag monitoring",
    zerops: "Cron / Scheduled Jobs",
    details: ["Every 5min: analytics rollup", "Hourly: search reindex", "Daily: temp cleanup", "2min: replica lag alert"],
    metrics: { jobs: "720/day", reliability: "99.9%", maxRuntime: "5min" },
    color: "brand",
    position: { bottom: "30%", left: "50%", transform: "translateX(-50%)" },
  },
];

const connections = [
  { from: "frontend", to: "api", label: "HTTPS/WSS", animated: true },
  { from: "api", to: "database", label: "SQL (rw/r)", animated: true },
  { from: "api", to: "workers", label: "Job queue", animated: false },
  { from: "workers", to: "database", label: "Vectors/exports", animated: false },
  { from: "workers", to: "storage", label: "S3 uploads", animated: false },
  { from: "api", to: "storage", label: "Signed URLs", animated: false },
  { from: "frontend", to: "edge", label: "Cache purge", animated: true },
  { from: "cron", to: "database", label: "Maintenance", animated: false },
];

export function Architecture({ className }: { className?: string }) {
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  const getConnectedServices = (id: string) => {
    return connections
      .filter((c) => c.from === id || c.to === id)
      .map((c) => (c.from === id ? c.to : c.from));
  };

  const isConnected = (id: string) => {
    if (!hoveredService) return true;
    if (hoveredService === id) return true;
    return getConnectedServices(hoveredService).includes(id);
  };

  return (
    <section className={cn("relative py-20 md:py-32 lg:py-40 px-4 md:px-6 lg:px-8 overflow-hidden", className)}>
      <div className="container">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-brand-500/20 dark:border-brand-500/30 text-sm font-medium text-brand-600 dark:text-brand-400 mb-4">
            <Layers className="w-4 h-4" aria-hidden="true" />
            Architecture — Built on Zerops
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            <span className="gradient-text">7 Services</span>, Zero Ops
          </h2>
          <p className="text-lg text-surface-600 dark:text-surface-400">
            Every component runs on managed Zerops services. Private network, auto-scaling, global edge — all configured in one YAML.
          </p>
        </motion.div>

        <div className="relative" style={{ height: "600px" }}>
          <NetworkCanvas 
            services={services} 
            connections={connections} 
            hoveredService={hoveredService}
          />

          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isActive={hoveredService === service.id}
              isConnected={isConnected(service.id)}
              onMouseEnter={() => setHoveredService(service.id)}
              onMouseLeave={() => setHoveredService(null)}
            />
          ))}
        </div>

        <motion.div
          className="grid md:grid-cols-3 gap-6 mt-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          <StatCard
            icon={Zap}
            value="<100ms"
            label="P99 Latency (API)"
            detail="Global edge + read replicas"
            color="brand"
          />
          <StatCard
            icon={Shield}
            value="Zero Trust"
            label="Network Security"
            detail="mTLS, private network, no public IPs"
            color="accent"
          />
          <StatCard
            icon={BarChart2}
            value="Auto-scale"
            label="All Compute"
            detail="CPU, queue depth, custom metrics"
            color="brand"
          />
        </motion.div>
      </div>
    </section>
  );
}

function NetworkCanvas({
  services,
  connections,
  hoveredService
}: {
  services: any[];
  connections: any[];
  hoveredService: string | null;
}) {
  const getConnectedServices = (id: string) => {
    return connections
      .filter((c) => c.from === id || c.to === id)
      .map((c) => (c.from === id ? c.to : c.from));
  };

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1200 600"
      preserveAspectRatio="none"
    >
      <defs>
        <marker 
          id="arrowhead" 
          markerWidth="10" 
          markerHeight="7" 
          refX="9" 
          refY="3.5" 
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
        </marker>
        <linearGradient id="gradient-brand" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>

      {connections.map((conn, i) => {
        const from = services.find((s) => s.id === conn.from);
        const to = services.find((s) => s.id === conn.to);
        if (!from || !to) return null;

        const fromPos = getPosition(from.position);
        const toPos = getPosition(to.position);

        const isHighlighted = hoveredService && (hoveredService === conn.from || hoveredService === conn.to);

        return (
          <g key={i}>
            <motion.path
              d={getPath(fromPos, toPos)}
              stroke={isHighlighted ? "url(#gradient-brand)" : "currentColor"}
              strokeWidth={isHighlighted ? 3 : 1.5}
              strokeDasharray={conn.animated ? "8,4" : "none"}
              fill="none"
              opacity={isHighlighted ? 1 : 0.3}
              className="text-surface-300 dark:text-surface-700"
              style={{ filter: isHighlighted ? "drop-shadow(0 0 8px rgba(14,165,233,0.6))" : "none" }}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.5 + i * 0.1, ease: "easeOut" }}
            >
              {conn.animated && (
                <animateMotion
                  path={getPath(fromPos, toPos)}
                  dur="3s"
                  repeatCount="indefinite"
                  rotate="auto"
                >
                  <circle r={4} fill="url(#gradient-brand)" opacity={isHighlighted ? 1 : 0} />
                </animateMotion>
              )}
            </motion.path>
            
            {conn.label && (
              <text
                x={(fromPos.x + toPos.x) / 2}
                y={(fromPos.y + toPos.y) / 2 - 10}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                className="text-surface-500 dark:text-surface-500"
                opacity={isHighlighted ? 1 : 0.5}
              >
                {conn.label}
              </text>
            )}
          </g>
        );
      })}

      {services.map((service) => {
        const pos = getPosition(service.position);
        const isHighlighted = hoveredService === service.id;
        const isDimmed = hoveredService && hoveredService !== service.id && !getConnectedServices(hoveredService).includes(service.id);

        return (
          <g key={service.id}>
            <motion.circle
              cx={pos.x}
              cy={pos.y}
              r={isHighlighted ? 28 : 22}
              fill={isHighlighted ? `url(#gradient-${service.color})` : "currentColor"}
              className={cn(
                "text-surface-100 dark:text-surface-900",
                `hover:text-${service.color}-500`
              )}
              stroke={isHighlighted ? "currentColor" : "transparent"}
              strokeWidth={3}
              opacity={isDimmed ? 0.3 : 1}
              style={{ 
                filter: isHighlighted ? "drop-shadow(0 0 20px currentColor)" : "none",
                cursor: "pointer",
              }}
              onMouseEnter={() => {}}
              onMouseLeave={() => {}}
              whileHover={{ r: isHighlighted ? 30 : 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
            <text
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              fontSize="14"
              fontWeight="600"
              fill="currentColor"
              className="text-surface-900 dark:text-surface-50"
              opacity={isDimmed ? 0.3 : 1}
              pointerEvents="none"
            >
              {service.icon === Globe ? "🌐" : service.icon === Server ? "⚙" : service.icon === Cpu ? "🧠" : service.icon === Database ? "🗄" : service.icon === HardDrive ? "💾" : service.icon === Clock ? "⏰" : "🔗"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function getPosition(position: any) {
  const width = 1200;
  const height = 600;
  
  let x = 0, y = 0;
  
  if (position.top) {
    y = parseFloat(position.top) / 100 * height;
  } else if (position.bottom) {
    y = height - parseFloat(position.bottom) / 100 * height;
  } else {
    y = height / 2;
  }
  
  if (position.left) {
    x = parseFloat(position.left) / 100 * width;
  } else if (position.right) {
    x = width - parseFloat(position.right) / 100 * width;
  } else {
    x = width / 2;
  }
  
  return { x, y };
}

function getPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(dist * 0.3, 100);
  
  const perpX = -dy / dist * offset;
  const perpY = dx / dist * offset;
  
  return `M${from.x},${from.y} Q${midX + perpX},${midY + perpY} ${to.x},${to.y}`;
}

function ServiceCard({ 
  service, 
  isActive, 
  isConnected,
  onMouseEnter,
  onMouseLeave,
}: { 
  service: any; 
  isActive: boolean; 
  isConnected: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const pos = getPosition(service.position);
  
  return (
    <motion.div
      className={cn(
        "absolute glass-strong rounded-2xl p-5 min-w-[280px] max-w-[320px] z-10",
        "border border-surface-200/50 dark:border-surface-700/50",
        "shadow-2xl shadow-black/5",
        !isConnected && "opacity-30 pointer-events-none"
      )}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: service.position.transform || "translate(-50%, -50%)",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          `bg-${service.color}-500/10 text-${service.color}-600 dark:text-${service.color}-400`
        )}>
          <service.icon className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-surface-900 dark:text-surface-50 truncate">{service.name}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 font-medium">
            {service.zerops}
          </span>
        </div>
      </div>

      <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">{service.description}</p>

      <div className="space-y-2 mb-4">
        {service.details.map((detail: string, i: number) => (
          <motion.div
            key={i}
            className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-500"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.05 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
            {detail}
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-surface-200/50 dark:border-surface-700/50">
        {Object.entries(service.metrics).map(([key, value]) => (
          <div key={key} className="flex-1 text-center">
            <div className="font-bold text-surface-900 dark:text-surface-50 text-lg">{value}</div>
            <div className="text-xs text-surface-500 dark:text-surface-500">{key}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, value, label, detail, color }: { icon: any; value: string; label: string; detail: string; color: string }) {
  return (
    <motion.div
      className="card relative overflow-hidden"
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ y: -4 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10 flex items-center gap-4">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", `bg-${color}-500/10 text-${color}-600 dark:text-${color}-400`)}>
          <Icon className="w-7 h-7" aria-hidden="true" />
        </div>
        <div>
          <div className="text-3xl font-bold text-surface-900 dark:text-surface-50">{value}</div>
          <div className="font-medium text-surface-700 dark:text-surface-300">{label}</div>
          <div className="text-sm text-surface-500 dark:text-surface-500 mt-1">{detail}</div>
        </div>
      </div>
    </motion.div>
  );
}
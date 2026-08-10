"use client";

import { motion } from "framer-motion";
import { Github, Twitter, MessageCircle, FileText, Globe, Shield, Cpu, Heart, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const footerLinks = {
  product: [
    { label: "Editor", href: "/editor" },
    { label: "AI Features", href: "#ai" },
    { label: "Publishing", href: "#publish" },
    { label: "Collaboration", href: "#collab" },
    { label: "Search", href: "#search" },
  ],
  platform: [
    { label: "Zerops Edge", href: "https://zerops.io/edge" },
    { name: "Auto-scaling", href: "https://zerops.io/scaling" },
    { label: "Managed PostgreSQL", href: "https://zerops.io/postgresql" },
    { label: "Object Storage", href: "https://zerops.io/storage" },
    { label: "Private Network", href: "https://zerops.io/network" },
  ],
  developers: [
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/api-docs" },
    { label: "GitHub Repo", href: "https://github.com/yourusername/nexus" },
    { label: "Contributing", href: "/contributing" },
    { label: "Changelog", href: "/changelog" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy", href: "/privacy" },
  ],
};

const socialLinks = [
  { icon: Github, href: "https://github.com/yourusername/nexus", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com/nexus", label: "Twitter" },
  { icon: MessageCircle, href: "https://discord.gg/nexus", label: "Discord" },
];

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("relative border-t border-surface-200 dark:border-surface-800", className)}>
      <div className="absolute inset-0 bg-gradient-to-t from-surface-50 to-transparent dark:from-surface-950/50 dark:to-transparent" />
      
      <div className="container relative py-16 lg:py-24 px-4 md:px-6 lg:px-8">
        <motion.div
          className="grid lg:grid-cols-2 xl:grid-cols-6 gap-8 lg:gap-12 mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          <motion.div className="xl:col-span-2" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold text-surface-900 dark:text-surface-50">Nexus</span>
            </div>
            <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-xs text-balance">
              Collaborative knowledge base with AI superpowers. Real-time editing, semantic search, global edge publishing — built on Zerops.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg glass hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  aria-label={social.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ y: -2, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <social.icon className="w-5 h-5 text-surface-600 dark:text-surface-400" aria-hidden="true" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.nav variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-surface-600 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>

          <motion.nav variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">Platform (Zerops)</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-surface-600 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5"
                  >
                    {link.label}
                    <ExternalLink className="w-3 h-3 opacity-50" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>

          <motion.nav variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">Developers</h4>
            <ul className="space-y-3">
              {footerLinks.developers.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-surface-600 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>

          <motion.nav variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-surface-600 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>
        </motion.div>

        <motion.div
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-surface-200 dark:border-surface-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-surface-500 dark:text-surface-500">
            Built with <Heart className="w-4 h-4 inline text-red-500" aria-hidden="true" /> for the Zerops Hackathon
          </p>
          
          <div className="flex items-center gap-6 text-sm text-surface-500 dark:text-surface-500">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" aria-hidden="true" />
              Zero Trust
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-4 h-4" aria-hidden="true" />
              Global Edge
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4" aria-hidden="true" />
              Auto-scaling
            </span>
          </div>
          
          <p className="text-sm text-surface-500 dark:text-surface-500">
            © {new Date().getFullYear()} Nexus. Open source under MIT.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
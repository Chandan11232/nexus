"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Trash2,
  Brain,
  Sparkles,
  Search,
  BookOpen,
  Tag,
  Users,
  Circle,
  Copy,
  Check,
  Loader2,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Doc {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const EMPTY_DOC = `# Untitled

Start writing here...
`;

export function Editor() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Untitled");
  const [activeTab, setActiveTab] = useState<"ai" | "collab">("ai");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [docsPanelOpen, setDocsPanelOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  const activeDoc = docs.find((d) => d.id === activeDocId);

  // Load docs on mount
  useEffect(() => {
    fetchDocs();
  }, []);

  // Scroll AI messages
  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  async function fetchDocs() {
    try {
      const res = await fetch("/api/docs");
      const data = await res.json();
      setDocs(data);
      if (data.length > 0 && !activeDocId) {
        loadDoc(data[0]);
      }
    } catch (err) {
      console.error("Failed to load docs:", err);
    }
  }

  function loadDoc(doc: Doc) {
    setActiveDocId(doc.id);
    setContent(doc.content || "");
    setTitle(doc.title || "Untitled");
    setAiMessages([]);
  }

  async function createDoc() {
    try {
      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled", content: EMPTY_DOC }),
      });
      const doc = await res.json();
      setDocs((prev) => [doc, ...prev]);
      loadDoc(doc);
    } catch (err) {
      console.error("Failed to create doc:", err);
    }
  }

  async function deleteDoc(id: string) {
    try {
      await fetch(`/api/docs/${id}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d.id !== id));
      if (activeDocId === id) {
        const remaining = docs.filter((d) => d.id !== id);
        if (remaining.length > 0) {
          loadDoc(remaining[0]);
        } else {
          setActiveDocId(null);
          setContent("");
          setTitle("Untitled");
        }
      }
    } catch (err) {
      console.error("Failed to delete doc:", err);
    }
  }

  async function saveDoc(id: string, newTitle?: string, newContent?: string) {
    setSaving(true);
    try {
      await fetch(`/api/docs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle ?? title,
          content: newContent ?? content,
        }),
      });
      setLastSaved(new Date());
      setDocs((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, title: newTitle ?? title, content: newContent ?? content, updated_at: new Date().toISOString() }
            : d
        )
      );
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleContentChange(newContent: string) {
    setContent(newContent);
    if (!activeDocId) return;

    // Debounced save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveDoc(activeDocId, undefined, newContent);
    }, 1000);
  }

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    if (!activeDocId) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveDoc(activeDocId, newTitle);
    }, 500);
  }

  const handleAI = useCallback(
    async (action: string, customPrompt?: string) => {
      const prompt = customPrompt || aiPrompt;
      if (!prompt && action === "custom") return;

      setAiLoading(true);
      setAiMessages((prev) => [...prev, { role: "user", content: prompt || action }]);

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, content, prompt }),
        });
        const data = await res.json();
        setAiMessages((prev) => [...prev, { role: "assistant", content: data.result }]);
      } catch {
        setAiMessages((prev) => [
          ...prev,
          { role: "assistant", content: "AI service unavailable." },
        ]);
      } finally {
        setAiLoading(false);
        setAiPrompt("");
      }
    },
    [content, aiPrompt]
  );

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const wordCount = (content || "").trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="h-screen flex flex-col bg-surface-950">
      {/* Top Bar */}
      <header className="h-12 border-b border-surface-800 flex items-center px-3 gap-3 flex-shrink-0">
        <button
          onClick={() => setDocsPanelOpen(!docsPanelOpen)}
          className="p-1.5 text-surface-400 hover:text-white transition-colors"
        >
          {docsPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white hidden sm:block">Nexus</span>
        </div>

        <div className="h-5 w-px bg-surface-700" />

        {activeDocId ? (
          <>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="bg-transparent text-white text-sm font-medium outline-none max-w-xs"
            />
            <span className="text-surface-500 text-xs">
              {saving ? "Saving..." : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ""}
            </span>
          </>
        ) : (
          <span className="text-surface-500 text-sm">No document open</span>
        )}

        <div className="flex-1" />

        <span className="text-surface-500 text-xs hidden md:block">
          {wordCount} words · {readTime} min
        </span>

        <button onClick={handleCopy} className="p-1.5 text-surface-400 hover:text-white transition-colors" title="Copy markdown">
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>

        {activeDocId && (
          <button
            onClick={() => saveDoc(activeDocId)}
            className="p-1.5 text-surface-400 hover:text-white transition-colors"
            title="Save"
          >
            <Save className="w-4 h-4" />
          </button>
        )}
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Docs List Panel */}
        <AnimatePresence>
          {docsPanelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-shrink-0 border-r border-surface-800 flex flex-col overflow-hidden"
            >
              <div className="p-2 border-b border-surface-800">
                <button
                  onClick={createDoc}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-sm text-surface-300 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Document
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => loadDoc(doc)}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-surface-800/50 transition-colors",
                      activeDocId === doc.id
                        ? "bg-brand-500/10 border-l-2 border-l-brand-500"
                        : "hover:bg-surface-800/50 border-l-2 border-l-transparent"
                    )}
                  >
                    <FileText className="w-4 h-4 text-surface-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-surface-200 truncate">{doc.title}</div>
                      <div className="text-[10px] text-surface-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(doc.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDoc(doc.id);
                      }}
                      className="p-1 text-surface-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {docs.length === 0 && (
                  <div className="p-4 text-center text-surface-500 text-sm">
                    No documents yet
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Editor + Preview */}
        {activeDocId ? (
          <>
            {/* Editor */}
            <div className="flex-1 flex flex-col border-r border-surface-800 min-w-0">
              <div className="h-8 border-b border-surface-800 flex items-center px-3 text-[10px] text-surface-500 gap-2">
                <span className="px-1.5 py-0.5 rounded bg-surface-800 text-surface-400 font-mono">Markdown</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="flex-1 bg-surface-950 text-surface-200 font-mono text-sm p-4 resize-none outline-none leading-relaxed"
                spellCheck={false}
                placeholder="Start writing..."
              />
            </div>

            {/* Preview */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="h-8 border-b border-surface-800 flex items-center px-3 text-[10px] text-surface-500">
                <span className="px-1.5 py-0.5 rounded bg-surface-800 text-surface-400 font-mono">Preview</span>
              </div>
              <div
                className="flex-1 overflow-y-auto p-6"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-surface-700 mx-auto mb-4" />
              <p className="text-surface-500 text-sm mb-4">No document open</p>
              <button onClick={createDoc} className="btn-primary text-sm px-4 py-2">
                <Plus className="w-4 h-4" />
                Create Document
              </button>
            </div>
          </div>
        )}

        {/* AI/Collab Sidebar */}
        <AnimatePresence>
          {sidebarOpen && activeDocId && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-shrink-0 border-l border-surface-800 flex flex-col overflow-hidden"
            >
              {/* Tabs */}
              <div className="h-10 border-b border-surface-800 flex items-center px-2 gap-1">
                {(["ai", "collab"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                      activeTab === tab
                        ? "bg-brand-500/10 text-brand-400"
                        : "text-surface-400 hover:text-white hover:bg-surface-800"
                    )}
                  >
                    {tab === "ai" ? <Brain className="w-3.5 h-3.5 inline mr-1" /> : <Users className="w-3.5 h-3.5 inline mr-1" />}
                    {tab}
                  </button>
                ))}
                <div className="flex-1" />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 text-surface-500 hover:text-white transition-colors"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              {/* AI Tab */}
              {activeTab === "ai" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-surface-800">
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: "Summarize", action: "summarize", icon: BookOpen },
                        { label: "Suggest", action: "suggest", icon: Sparkles },
                        { label: "Tags", action: "tags", icon: Tag },
                        { label: "Explain", action: "search", icon: Search },
                      ].map(({ label, action, icon: Icon }) => (
                        <button
                          key={action}
                          onClick={() => handleAI(action)}
                          disabled={aiLoading}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white text-xs transition-colors disabled:opacity-50"
                        >
                          <Icon className="w-3 h-3" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {aiMessages.length === 0 && (
                      <div className="text-center py-10 text-surface-500">
                        <Brain className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">Ask anything about your document</p>
                      </div>
                    )}
                    {aiMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-lg p-2.5 text-sm",
                          msg.role === "user"
                            ? "bg-brand-500/10 text-brand-200 ml-4"
                            : "bg-surface-800 text-surface-200 mr-4"
                        )}
                      >
                        <div className="text-[10px] font-medium text-surface-500 mb-1 uppercase">
                          {msg.role === "user" ? "You" : "Nexus AI"}
                        </div>
                        <div className="whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="bg-surface-800 rounded-lg p-2.5 text-xs text-surface-400 mr-4">
                        <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                        Thinking...
                      </div>
                    )}
                    <div ref={aiMessagesEndRef} />
                  </div>

                  <div className="p-2 border-t border-surface-800">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAI("custom")}
                        placeholder="Ask AI..."
                        className="flex-1 bg-surface-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-surface-500 outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <button
                        onClick={() => handleAI("custom")}
                        disabled={aiLoading || !aiPrompt}
                        className="p-1.5 bg-brand-500 hover:bg-brand-600 rounded-lg text-white disabled:opacity-50 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Collab Tab */}
              {activeTab === "collab" && (
                <div className="flex-1 p-3 space-y-3">
                  <h3 className="text-xs font-medium text-surface-400 uppercase">Active Now</h3>
                  {[
                    { name: "You", color: "#0ea5e9", active: true },
                    { name: "Alice", color: "#d946ef", active: true },
                    { name: "Bob", color: "#f59e0b", active: false },
                  ].map((user) => (
                    <div key={user.name} className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-800/50">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white relative"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name[0]}
                        <div
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-surface-800",
                            user.active ? "bg-green-500" : "bg-surface-600"
                          )}
                        />
                      </div>
                      <div>
                        <div className="text-xs text-white">{user.name}</div>
                        <div className="text-[10px] text-surface-500">{user.active ? "Editing" : "Away"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Toggle AI sidebar */}
        {!sidebarOpen && activeDocId && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute right-2 top-14 p-2 bg-surface-800 hover:bg-surface-700 rounded-lg text-surface-400 hover:text-white transition-colors z-10"
          >
            <Brain className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function renderMarkdown(md: string): string {
  let html = md;
  const codeBlocks: string[] = [];

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const i = codeBlocks.length;
    codeBlocks.push(`<pre class="bg-surface-900 rounded-lg p-4 overflow-x-auto my-4"><code class="language-${lang} text-surface-200 text-sm">${escapeHtml(code.trim())}</code></pre>`);
    return `%%CB${i}%%`;
  });

  html = html.replace(/`([^`]+)`/g, '<code class="bg-surface-800 text-brand-300 px-1 py-0.5 rounded text-sm">$1</code>');
  html = html.replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold text-white mt-6 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold text-white mt-8 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold text-white mt-6 mb-4">$1</h1>');
  html = html.replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-surface-600 pl-4 text-surface-300 italic my-3">$1</blockquote>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="text-surface-300">$1</em>');
  html = html.replace(/^- (.*$)/gm, '<li class="text-surface-200 ml-4 mb-1">$1</li>');
  html = html.replace(/^\d+\. (.*$)/gm, '<li class="text-surface-200 ml-4 mb-1 list-decimal">$1</li>');
  html = html.replace(/((?:<li[^>]*>.*?<\/li>\n?)+)/g, '<ul class="list-disc mb-3">$1</ul>');
  html = html.replace(/^---$/gm, '<hr class="border-surface-700 my-6" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand-400 hover:underline">$1</a>');

  codeBlocks.forEach((block, i) => {
    html = html.replace(`%%CB${i}%%`, block);
  });

  html = html
    .split("\n\n")
    .map((block) => {
      const t = block.trim();
      if (!t) return "";
      if (t.startsWith("<")) return t;
      return `<p class="text-surface-200 mb-3 leading-relaxed">${t}</p>`;
    })
    .join("\n");

  return html;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

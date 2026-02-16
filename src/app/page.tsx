"use client";

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Markdown from "@/components/Markdown";

/* ─── Types ────────────────────────────────── */

type Attachment = {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
};

type Message = {
  role: "user" | "model";
  content: string;
  attachments?: Attachment[];
  createdAt?: string;
};

type ChatSummary = {
  _id: string;
  title: string;
  updatedAt?: string;
  createdAt?: string;
};

type Chat = ChatSummary & {
  model: string;
  messages: Message[];
};

type ModelInfo = {
  id: string;
  name: string;
  description: string;
};

type FeatureOptions = {
  webSearch: boolean;
  dateGrounding: boolean;
  codeMode: boolean;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

/* ─── Icons (inline SVG) ───────────────────── */

function IconPlus() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

function IconPaperclip() {
  return (
    <svg
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconBot() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="8.5" cy="16" r="1.5" fill="currentColor" />
      <circle cx="15.5" cy="16" r="1.5" fill="currentColor" />
      <path d="M12 2v4M8 7h8a2 2 0 012 2v2H6V9a2 2 0 012-2z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/* ─── Typing dots animation ────────────────── */

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot inline-block h-2 w-2 rounded-full bg-violet-400"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

/* ─── Component ────────────────────────────── */

export default function Home() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [openingChatId, setOpeningChatId] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [featureOptions, setFeatureOptions] = useState<FeatureOptions>({
    webSearch: true,
    dateGrounding: true,
    codeMode: false,
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleInitializedRef = useRef(false);

  const activeMessages = useMemo(
    () => activeChat?.messages ?? [],
    [activeChat],
  );

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter((c) => c.title.toLowerCase().includes(q));
  }, [chats, searchQuery]);

  /* ─── API helpers ─────────────────────────── */

  const fetchChats = useCallback(async () => {
    setLoadingChats(true);
    setError(null);
    try {
      const res = await fetch("/api/chats", { cache: "no-store" });
      const data = await res.json();
      if (res.status === 401) {
        setAuthUser(null);
        setChats([]);
        setActiveChat(null);
        return;
      }
      if (!res.ok || !data.success)
        throw new Error(data.error ?? "Failed to load chats");
      const items: ChatSummary[] = data.chats;
      setChats(items);
      if (items.length > 0) await openChat(items[0]._id);
      else setActiveChat(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load chats");
    } finally {
      setLoadingChats(false);
    }
  }, []);

  async function handleAuthSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setAuthLoading(true);

    try {
      const endpoint =
        authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload =
        authMode === "login"
          ? { email: authEmail, password: authPassword }
          : { name: authName, email: authEmail, password: authPassword };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Authentication failed");
      }

      setAuthUser(data.user);
      setAuthPassword("");
      await fetchChats();
      await fetchModels();
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Authentication failed",
      );
    } finally {
      setAuthLoading(false);
      setAuthReady(true);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthUser(null);
    setChats([]);
    setActiveChat(null);
    setSearchQuery("");
  }

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch("/api/models", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success) {
        setAvailableModels(data.models);
        if (!selectedModel) setSelectedModel(data.defaultModel);
      }
    } catch {
      // ignore, use fallback
    }
  }, []);

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setError(null);
      setGoogleLoading(true);

      try {
        const response = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error ?? "Google authentication failed");
        }

        setAuthUser(data.user);
        setAuthPassword("");
        await fetchChats();
        await fetchModels();
      } catch (authError) {
        setError(
          authError instanceof Error
            ? authError.message
            : "Google authentication failed",
        );
      } finally {
        setGoogleLoading(false);
      }
    },
    [fetchChats, fetchModels],
  );

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setAuthUser(null);
        setAuthReady(true);
        return;
      }

      setAuthUser(data.user);
      setAuthReady(true);
      await fetchChats();
      await fetchModels();
    } catch {
      setAuthUser(null);
      setAuthReady(true);
    }
  }, [fetchChats, fetchModels]);

  async function openChat(chatId: string) {
    setOpeningChatId(chatId);
    try {
      const res = await fetch(`/api/chats/${chatId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error ?? "Failed to open chat");
      setActiveChat(data.chat);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open chat");
    } finally {
      setOpeningChatId(null);
    }
  }

  async function createChat() {
    setError(null);
    setCreatingChat(true);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error ?? "Failed to create chat");
      const newChat: Chat = data.chat;
      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat);
      textareaRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create chat");
    } finally {
      setCreatingChat(false);
    }
  }

  async function deleteChat(chatId: string) {
    setDeletingChatId(chatId);
    setError(null);
    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error ?? "Failed to delete chat");
      const next = chats.filter((c) => c._id !== chatId);
      setChats(next);
      if (activeChat?._id === chatId) {
        setActiveChat(null);
        if (next.length > 0) await openChat(next[0]._id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete chat");
    } finally {
      setDeletingChatId(null);
    }
  }

  async function renameChat(chatId: string, newTitle: string) {
    if (!newTitle.trim()) {
      setRenamingChatId(null);
      return;
    }
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error ?? "Failed to rename chat");
      setChats((prev) =>
        prev.map((c) =>
          c._id === chatId ? { ...c, title: newTitle.trim() } : c,
        ),
      );
      if (activeChat?._id === chatId) {
        setActiveChat((prev) =>
          prev ? { ...prev, title: newTitle.trim() } : prev,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to rename chat");
    } finally {
      setRenamingChatId(null);
    }
  }

  async function switchModel(modelId: string) {
    setSelectedModel(modelId);
    setModelDropdownOpen(false);
    if (!activeChat) return;
    try {
      const res = await fetch(`/api/chats/${activeChat._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveChat((prev) => (prev ? { ...prev, model: modelId } : prev));
      }
    } catch {
      // ignore
    }
  }

  /* ─── Upload helpers ──────────────────────── */

  async function uploadSingleFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok || !data.success)
      throw new Error(data.error ?? "Upload failed");
    return data.file as Attachment;
  }

  async function handleFiles(files: FileList | File[]) {
    setUploading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(
        Array.from(files).map(uploadSingleFile),
      );
      setPendingAttachments((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onSelectFiles(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      void handleFiles(event.target.files);
    }
  }

  function removePendingAttachment(idx: number) {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  /* ─── Drag & drop ─────────────────────────── */

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function onDragLeave() {
    setDragOver(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!activeChat || sending) return;
    if (e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files);
    }
  }

  /* ─── Message send ────────────────────────── */

  async function submitMessage() {
    if (!activeChat || sending) return;
    const content = input.trim();
    if (!content && pendingAttachments.length === 0) return;

    const outgoing = [...pendingAttachments];
    setInput("");
    setPendingAttachments([]);
    setSending(true);
    setError(null);

    const optimistic = [
      ...activeMessages,
      { role: "user" as const, content, attachments: outgoing },
    ];
    setActiveChat({ ...activeChat, messages: optimistic });

    try {
      const res = await fetch(`/api/chats/${activeChat._id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          attachments: outgoing,
          features: featureOptions,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error ?? "Failed to send");

      const updated: Chat = data.chat;
      setActiveChat(updated);
      setChats((prev) =>
        prev
          .map((c) =>
            c._id === updated._id
              ? { ...c, title: updated.title, updatedAt: updated.updatedAt }
              : c,
          )
          .sort(
            (a, b) =>
              new Date(b.updatedAt ?? 0).getTime() -
              new Date(a.updatedAt ?? 0).getTime(),
          ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
      setActiveChat({ ...activeChat, messages: activeMessages });
      setInput(content);
      setPendingAttachments(outgoing);
    } finally {
      setSending(false);
    }
  }

  function onFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void submitMessage();
  }

  function onInputKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submitMessage();
    }
  }

  /* ─── Copy message ────────────────────────── */

  function copyMessage(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  /* ─── Utilities ───────────────────────────── */

  function fmtTime(v?: string) {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function fmtDate(v?: string) {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function fmtSize(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function isImg(mime: string) {
    return mime.startsWith("image/");
  }

  function toggleFeature(key: keyof FeatureOptions) {
    setFeatureOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  /* ─── Effects ─────────────────────────────── */

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (activeChat) setSelectedModel(activeChat.model);
  }, [activeChat?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, sending]);

  useEffect(() => {
    if (authUser) {
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) {
      return;
    }

    const initializeGoogle = () => {
      if (
        !window.google?.accounts?.id ||
        !googleButtonRef.current ||
        googleInitializedRef.current
      ) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (credential) {
            void handleGoogleCredential(credential);
          }
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        width: 320,
        text: "continue_with",
      });
      googleInitializedRef.current = true;
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", initializeGoogle, {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.head.appendChild(script);
  }, [authUser, handleGoogleCredential]);

  /* ─── Render ──────────────────────────────── */

  if (!authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f17] text-slate-200">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm">
          Loading...
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f17] px-4 text-slate-100">
        <form
          onSubmit={handleAuthSubmit}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-[#13131d] p-6 shadow-2xl"
        >
          <h1 className="text-xl font-semibold">
            {authMode === "login" ? "Login" : "Create Account"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {authMode === "login"
              ? "Login to access your chats"
              : "Signup to create your private chats"}
          </p>

          {authMode === "signup" && (
            <input
              className="mt-4 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none placeholder:text-slate-500"
              placeholder="Full name"
              value={authName}
              onChange={(e) => setAuthName(e.target.value)}
              required
            />
          )}

          <input
            className="mt-3 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none placeholder:text-slate-500"
            type="email"
            placeholder="Email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            required
          />

          <input
            className="mt-3 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none placeholder:text-slate-500"
            type="password"
            placeholder="Password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            minLength={6}
            required
          />

          <button
            type="submit"
            disabled={authLoading}
            className="mt-4 w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
          >
            {authLoading
              ? "Please wait..."
              : authMode === "login"
                ? "Login"
                : "Signup"}
          </button>

          <button
            type="button"
            className="mt-2 w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.03]"
            onClick={() =>
              setAuthMode((prev) => (prev === "login" ? "signup" : "login"))
            }
          >
            {authMode === "login"
              ? "Need an account? Signup"
              : "Already have an account? Login"}
          </button>

          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="mb-2 text-center text-xs text-slate-500">
              or continue with
            </p>
            <div className="flex justify-center">
              <div ref={googleButtonRef} />
            </div>
            {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
              <p className="mt-2 text-center text-xs text-amber-400">
                Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google sign in.
              </p>
            )}
            {googleLoading && (
              <p className="mt-2 text-center text-xs text-slate-400">
                Signing in with Google...
              </p>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#0f0f17] text-slate-100"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* ── Drag overlay ── */}
      {dragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-600/20 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-violet-400 bg-violet-950/80 px-12 py-8 text-lg font-semibold text-violet-200">
            Drop files here to attach
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col border-r border-white/[0.06] bg-[#13131d] transition-all duration-300 ${
          sidebarOpen ? "w-80" : "w-0 overflow-hidden"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex-shrink-0 p-4 pb-2">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 active:scale-[0.98] disabled:opacity-60"
            onClick={createChat}
            type="button"
            disabled={creatingChat}
          >
            <IconPlus />
            {creatingChat ? "Creating..." : "New Chat"}
          </button>

          {/* Search */}
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2">
            <IconSearch />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {loadingChats ? (
            <div className="mt-8 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl bg-white/[0.04]"
                />
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <p className="mt-8 text-center text-sm text-slate-500">
              {searchQuery ? "No matching chats" : "No chats yet"}
            </p>
          ) : (
            <div className="mt-1 space-y-1">
              {filteredChats.map((chat) => (
                <div
                  key={chat._id}
                  className={`group flex items-start rounded-xl px-3 py-2.5 transition-colors ${
                    activeChat?._id === chat._id
                      ? "bg-violet-600/15 text-white"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                  }`}
                >
                  {renamingChatId === chat._id ? (
                    <input
                      className="flex-1 rounded bg-white/10 px-2 py-1 text-sm outline-none"
                      autoFocus
                      value={renamingTitle}
                      onChange={(e) => setRenamingTitle(e.target.value)}
                      onBlur={() => void renameChat(chat._id, renamingTitle)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          void renameChat(chat._id, renamingTitle);
                        if (e.key === "Escape") setRenamingChatId(null);
                      }}
                    />
                  ) : (
                    <button
                      className="flex-1 text-left"
                      onClick={() => void openChat(chat._id)}
                      type="button"
                    >
                      <div className="truncate text-sm font-medium leading-tight">
                        {openingChatId === chat._id ? "Opening..." : chat.title}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {fmtDate(chat.updatedAt)} · {fmtTime(chat.updatedAt)}
                      </div>
                    </button>
                  )}

                  {/* Actions */}
                  <div className="ml-2 flex flex-shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      title="Rename"
                      className="rounded p-1 hover:bg-white/10"
                      onClick={() => {
                        setRenamingChatId(chat._id);
                        setRenamingTitle(chat.title);
                      }}
                    >
                      <IconEdit />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      className="rounded p-1 text-red-400 hover:bg-red-500/20"
                      onClick={() => void deleteChat(chat._id)}
                      disabled={deletingChatId === chat._id}
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-white/[0.06] bg-[#13131d]/60 px-5 py-3 backdrop-blur">
          <button
            type="button"
            className="rounded-lg p-1.5 hover:bg-white/10"
            onClick={() => setSidebarOpen((v) => !v)}
            title="Toggle sidebar"
          >
            <svg
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold leading-tight">
              {activeChat ? activeChat.title : "AI Chatbot"}
            </h1>
            <p className="text-[11px] text-slate-500">
              {activeChat
                ? `${activeChat.messages.length} messages`
                : `Logged in as ${authUser.name}`}
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.08]"
            onClick={() => void logout()}
          >
            Logout
          </button>

          {/* Model selector */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.08]"
              onClick={() => setModelDropdownOpen((v) => !v)}
            >
              <span className="max-w-36 truncate">
                {availableModels.find((m) => m.id === selectedModel)?.name ??
                  selectedModel ??
                  "Select Model"}
              </span>
              <IconChevronDown />
            </button>

            {modelDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setModelDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-white/[0.08] bg-[#1a1a28] py-1 shadow-2xl">
                  {availableModels.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-white/[0.06] ${
                        selectedModel === m.id
                          ? "text-violet-400"
                          : "text-slate-300"
                      }`}
                      onClick={() => void switchModel(m.id)}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">{m.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {m.description}
                        </div>
                      </div>
                      {selectedModel === m.id && <IconCheck />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Messages area */}
        <section className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-5 py-6">
            {!activeChat ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-4 rounded-2xl bg-violet-600/10 p-5">
                  <IconBot />
                </div>
                <h2 className="text-xl font-semibold">Welcome to AI Chatbot</h2>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Create a new chat to start a conversation. You can attach
                  images and the AI will understand them.
                </p>
                <button
                  className="mt-6 flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500"
                  onClick={createChat}
                  type="button"
                >
                  <IconPlus /> New Chat
                </button>
              </div>
            ) : activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 rounded-2xl bg-violet-600/10 p-5 text-violet-400">
                  <IconBot />
                </div>
                <p className="text-sm text-slate-500">
                  Send your first message or drop an image to begin.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {activeMessages.map((msg, idx) => (
                  <div
                    key={`${msg.role}-${idx}`}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-violet-600/20 text-violet-400"
                      }`}
                    >
                      {msg.role === "user" ? <IconUser /> : <IconBot />}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`group relative max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white/[0.05] text-slate-200"
                      }`}
                    >
                      {/* Content */}
                      {msg.role === "model" ? (
                        <div className="prose-invert">
                          <Markdown content={msg.content} />
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}

                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {msg.attachments.map((att) => (
                            <a
                              key={att.url}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block"
                            >
                              {isImg(att.mimeType) ? (
                                <img
                                  src={att.url}
                                  alt={att.originalName}
                                  className="max-h-48 rounded-lg border border-white/10 object-cover transition hover:border-violet-400"
                                />
                              ) : (
                                <div className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-xs hover:bg-black/30">
                                  <IconPaperclip />
                                  <span className="max-w-40 truncate">
                                    {att.originalName}
                                  </span>
                                  <span className="text-slate-500">
                                    {fmtSize(att.size)}
                                  </span>
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Timestamp + actions */}
                      <div className="mt-2 flex items-center gap-2 text-[11px] opacity-50">
                        {fmtTime(msg.createdAt)}
                        <button
                          type="button"
                          title="Copy"
                          className="rounded p-0.5 opacity-0 transition hover:bg-white/10 group-hover:opacity-100"
                          onClick={() => copyMessage(msg.content, idx)}
                        >
                          {copiedIdx === idx ? (
                            <span className="text-green-400">Copied!</span>
                          ) : (
                            <IconCopy />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {sending && (
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-violet-400">
                      <IconBot />
                    </div>
                    <div className="rounded-2xl bg-white/[0.05] px-4 py-2">
                      <TypingDots />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </section>

        {/* Input area */}
        {activeChat && (
          <form
            className="border-t border-white/[0.06] bg-[#13131d]/60 p-4 backdrop-blur"
            onSubmit={onFormSubmit}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept="image/*,.pdf,.txt,.doc,.docx"
              onChange={onSelectFiles}
              disabled={sending || uploading}
            />

            {/* Pending attachments */}
            {pendingAttachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {pendingAttachments.map((att, i) => (
                  <div
                    key={`${att.url}-${i}`}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs"
                  >
                    {isImg(att.mimeType) ? (
                      <img
                        src={att.url}
                        alt=""
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <IconPaperclip />
                    )}
                    <span className="max-w-32 truncate">
                      {att.originalName}
                    </span>
                    <button
                      type="button"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => removePendingAttachment(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Composer */}
            <div className="mx-auto mb-2 flex max-w-3xl flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => toggleFeature("webSearch")}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                  featureOptions.webSearch
                    ? "border-violet-500/40 bg-violet-500/20 text-violet-200"
                    : "border-white/10 bg-white/[0.03] text-slate-400"
                }`}
              >
                Web Search {featureOptions.webSearch ? "ON" : "OFF"}
              </button>
              <button
                type="button"
                onClick={() => toggleFeature("dateGrounding")}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                  featureOptions.dateGrounding
                    ? "border-violet-500/40 bg-violet-500/20 text-violet-200"
                    : "border-white/10 bg-white/[0.03] text-slate-400"
                }`}
              >
                Smart Date {featureOptions.dateGrounding ? "ON" : "OFF"}
              </button>
              <button
                type="button"
                onClick={() => toggleFeature("codeMode")}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                  featureOptions.codeMode
                    ? "border-violet-500/40 bg-violet-500/20 text-violet-200"
                    : "border-white/10 bg-white/[0.03] text-slate-400"
                }`}
              >
                Code Mode {featureOptions.codeMode ? "ON" : "OFF"}
              </button>
            </div>

            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-white/[0.08] bg-[#1a1a28] p-2">
              <button
                type="button"
                className="flex-shrink-0 rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || uploading}
                title="Attach files"
              >
                {uploading ? (
                  <span className="inline-block h-[18px] w-[18px] animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                ) : (
                  <IconPaperclip />
                )}
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-slate-500"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onInputKeyDown}
                disabled={sending}
              />

              <button
                type="submit"
                className="flex-shrink-0 rounded-xl bg-violet-600 p-2.5 text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 active:scale-95 disabled:opacity-50"
                disabled={
                  sending || (!input.trim() && pendingAttachments.length === 0)
                }
              >
                <IconSend />
              </button>
            </div>

            <p className="mt-2 text-center text-[11px] text-slate-600">
              Enter to send · Shift+Enter for new line · Drop files to attach
            </p>
            {error && (
              <p className="mt-2 text-center text-sm text-red-400">{error}</p>
            )}
          </form>
        )}
      </main>
    </div>
  );
}

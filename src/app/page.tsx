"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { AuthUser, Chat, ChatSummary, ModelInfo, FeatureOptions } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MessageInput from "@/components/MessageInput";
import ChatArea from "@/components/ChatArea";
import AuthForm from "@/components/AuthForm";

export default function Home() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loadingChats, setLoadingChats] = useState(true);
  const [openingChatId, setOpeningChatId] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]); // Use 'any' temporarily to match state, but ideally explicit type
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState("");

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
  }, [selectedModel]);

  const onAuthSuccess = useCallback(async (user: AuthUser) => {
    setAuthUser(user);
    await fetchChats();
    await fetchModels();
  }, [fetchChats, fetchModels]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthUser(null);
    setChats([]);
    setActiveChat(null);
  }

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

  async function deleteAllChats() {
    setError(null);
    try {
      const res = await fetch("/api/chats", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error ?? "Failed to delete all chats");
      setChats([]);
      setActiveChat(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete all chats");
    }
  }

  async function renameChat(chatId: string, newTitle: string) {
    if (!newTitle.trim()) return;
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
    }
  }

  async function switchModel(modelId: string) {
    setSelectedModel(modelId);
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
    return data.file;
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

  async function submitMessage(content: string, features: FeatureOptions) {
    if (!activeChat || sending) return;

    const outgoing = [...pendingAttachments];
    setPendingAttachments([]);
    setSending(true);
    setError(null);

    const optimisticMsgs = [
      ...(activeChat.messages || []),
      { role: "user" as const, content, attachments: outgoing },
    ];
    setActiveChat({ ...activeChat, messages: optimisticMsgs });

    try {
      const res = await fetch(`/api/chats/${activeChat._id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          attachments: outgoing,
          features,
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
      // Revert optimistic update if needed, or just let the error show
      setPendingAttachments(outgoing); // put attachments back
    } finally {
      setSending(false);
    }
  }

  /* ─── Effects ─────────────────────────────── */

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (activeChat) setSelectedModel(activeChat.model);
  }, [activeChat?._id]);

  /* ─── Render ──────────────────────────────── */

  if (!authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f17] text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
          <div className="text-sm font-medium animate-pulse">Loading Shivagpt...</div>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <AuthForm onAuthSuccess={onAuthSuccess} />;
  }

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#0f0f17] text-slate-100 font-sans"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* ── Drag overlay ── */}
      {dragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-600/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="rounded-2xl border-2 border-dashed border-violet-400 bg-violet-950/80 px-12 py-8 text-lg font-semibold text-violet-200 shadow-2xl">
            Drop files here to attach
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <Sidebar
        isOpen={sidebarOpen}
        chats={chats}
        activeChatId={activeChat?._id ?? null}
        loading={loadingChats}
        onNewChat={createChat}
        onSelectChat={openChat}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
        creating={creatingChat}
        openingChatId={openingChatId}
        deletingChatId={deletingChatId}
        authUser={authUser}
        onLogout={logout}
        onDeleteAllChats={deleteAllChats}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
      />

      {/* ── Main ── */}
      <main className="flex flex-1 flex-col relative transition-all duration-300">

        <Header
          activeChat={activeChat}
          authUser={authUser}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onLogout={logout}
          availableModels={availableModels}
          selectedModel={selectedModel}
          onSwitchModel={switchModel}
        />

        <section className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {error && (
            <div className="mx-auto mt-4 max-w-md rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center text-sm text-red-200 animate-in slide-in-from-top-2">
              {error}
            </div>
          )}
          <ChatArea
            activeChat={activeChat}
            authUser={authUser}
            onNewChat={createChat}
            sending={sending}
          />
        </section>

        {activeChat && (
          <MessageInput
            onSend={submitMessage}
            onUpload={handleFiles}
            uploading={uploading}
            sending={sending}
            pendingAttachments={pendingAttachments}
            onRemoveAttachment={removePendingAttachment}
          />
        )}
      </main>
    </div>
  );
}

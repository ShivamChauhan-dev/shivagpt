"use client";

import { useState, useMemo } from "react";
import { AuthUser } from "@/lib/types";
import SettingsModal from "@/components/SettingsModal";
import {
    IconPlus,
    IconSearch,
    IconEdit,
    IconTrash,
    IconSettings,
} from "@/components/Icons";

export type ChatSummary = {
    _id: string;
    title: string;
    updatedAt?: string;
    createdAt?: string;
};

interface SidebarProps {
    isOpen: boolean;
    chats: ChatSummary[];
    activeChatId: string | null;
    loading: boolean;
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onRenameChat: (id: string, newTitle: string) => void;
    creating: boolean;
    openingChatId: string | null;
    deletingChatId: string | null;
    authUser: AuthUser | null;
    onLogout: () => void;
    onDeleteAllChats: () => void;
    onToggleSidebar?: () => void;
}

export default function Sidebar({
    isOpen,
    chats,
    activeChatId,
    loading,
    onNewChat,
    onSelectChat,
    onDeleteChat,
    onRenameChat,
    creating,
    openingChatId,
    deletingChatId,
    authUser,
    onLogout,
    onDeleteAllChats,
    onToggleSidebar,
}: SidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
    const [renamingTitle, setRenamingTitle] = useState("");
    const [showSettings, setShowSettings] = useState(false);

    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return chats;
        const q = searchQuery.toLowerCase();
        return chats.filter((c) => c.title.toLowerCase().includes(q));
    }, [chats, searchQuery]);

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

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={onToggleSidebar}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed lg:relative z-40 flex flex-col border-r border-white/[0.06] bg-[#13131d] transition-all duration-300 h-full ${
                    isOpen ? "translate-x-0 w-80" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden"
                }`}
            >
                {/* Sidebar header */}
                <div className="flex-shrink-0 p-4 pb-2">
                    <button
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 active:scale-[0.98] disabled:opacity-60 min-h-[44px]"
                        onClick={onNewChat}
                        type="button"
                        disabled={creating}
                    >
                        <IconPlus />
                        {creating ? "Creating..." : "New Chat"}
                    </button>

                    {/* Search */}
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 border border-transparent focus-within:border-white/10 transition-colors">
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
                <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {loading ? (
                        <div className="mt-8 space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-14 animate-pulse rounded-xl bg-white/[0.04]"
                                />
                            ))}
                        </div>
                    ) : filteredChats.length === 0 ? (
                        <div className="mt-12 text-center">
                            <p className="text-sm text-slate-500">
                                {searchQuery ? "No matching chats" : "No chats yet"}
                            </p>
                            {!searchQuery && (
                                <p className="text-xs text-slate-600 mt-1">Start a new conversation!</p>
                            )}
                        </div>
                    ) : (
                        <div className="mt-1 space-y-1">
                            {filteredChats.map((chat) => (
                                <div
                                    key={chat._id}
                                    className={`group flex items-start rounded-xl px-3 py-2.5 transition-colors cursor-pointer ${activeChatId === chat._id
                                        ? "bg-violet-600/15 text-white"
                                        : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                                        }`}
                                    onClick={() => {
                                        if (renamingChatId !== chat._id) {
                                            onSelectChat(chat._id);
                                        }
                                    }}
                                >
                                    {renamingChatId === chat._id ? (
                                        <input
                                            className="flex-1 rounded bg-white/10 px-2 py-1 text-sm outline-none"
                                            autoFocus
                                            value={renamingTitle}
                                            onChange={(e) => setRenamingTitle(e.target.value)}
                                            onBlur={() => {
                                                onRenameChat(chat._id, renamingTitle);
                                                setRenamingChatId(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    onRenameChat(chat._id, renamingTitle);
                                                    setRenamingChatId(null);
                                                }
                                                if (e.key === "Escape") setRenamingChatId(null);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <div className="flex-1 overflow-hidden">
                                            <div className="truncate text-sm font-medium leading-tight">
                                                {openingChatId === chat._id ? "Opening..." : chat.title}
                                            </div>
                                            <div className="mt-0.5 text-[11px] text-slate-500">
                                                {fmtDate(chat.updatedAt)} · {fmtTime(chat.updatedAt)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="ml-2 flex flex-shrink-0 gap-1 opacity-0 transition group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
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
                                            className="rounded p-1 text-red-500/70 hover:bg-red-500/20 hover:text-red-400"
                                            onClick={() => onDeleteChat(chat._id)}
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

                {/* User Profile Footer */}
                {authUser && (
                    <div className="border-t border-white/[0.06] p-4">
                        <button
                            onClick={() => setShowSettings(true)}
                            className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2 transition-colors hover:bg-white/[0.04] hover:border-white/10 group"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xs font-semibold text-white shadow-sm">
                                {authUser.name?.[0]?.toUpperCase() ?? "U"}
                            </div>
                            <div className="flex-1 overflow-hidden text-left">
                                <div className="truncate text-sm font-medium text-slate-200 group-hover:text-white">
                                    {authUser.name}
                                </div>
                                <div className="truncate text-[10px] text-slate-500">
                                    {authUser.email}
                                </div>
                            </div>
                            <div className="text-slate-500 group-hover:text-slate-300">
                                <IconSettings />
                            </div>
                        </button>
                    </div>
                )}
            </aside>

            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                authUser={authUser}
                onLogout={onLogout}
                onDeleteAllChats={() => {
                    onDeleteAllChats();
                    setShowSettings(false);
                }}
            />
        </>
    );
}

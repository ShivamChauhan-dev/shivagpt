"use client";

import { useState } from "react";
import { AuthUser } from "@/lib/types";
import { IconUser, IconSettings, IconTrash, IconCheck } from "@/components/Icons";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    authUser: AuthUser | null;
    onLogout: () => void;
    onDeleteAllChats: () => void;
}

export default function SettingsModal({
    isOpen,
    onClose,
    authUser,
    onLogout,
    onDeleteAllChats,
}: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<"profile" | "settings">("profile");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#13131d] shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white">Settings</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex min-h-[400px]">
                    {/* Sidebar */}
                    <div className="w-1/3 border-r border-white/10 bg-white/[0.02] p-2">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeTab === "profile"
                                    ? "bg-violet-600/20 text-violet-300"
                                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                }`}
                        >
                            <IconUser /> Profile
                        </button>
                        <button
                            onClick={() => setActiveTab("settings")}
                            className={`mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeTab === "settings"
                                    ? "bg-violet-600/20 text-violet-300"
                                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                }`}
                        >
                            <IconSettings /> General
                        </button>
                    </div>

                    {/* Panel */}
                    <div className="flex-1 p-6">
                        {activeTab === "profile" && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex flex-col items-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-3xl font-bold text-white shadow-lg">
                                        {authUser?.name?.[0]?.toUpperCase() ?? "U"}
                                    </div>
                                    <h3 className="mt-4 text-xl font-bold text-white">{authUser?.name}</h3>
                                    <p className="text-sm text-slate-400">{authUser?.email}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">User ID</label>
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs text-slate-300 bg-black/30 px-2 py-1 rounded flex-1 truncate">
                                                {authUser?.id}
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={onLogout}
                                    className="w-full rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
                                >
                                    Log Out
                                </button>
                            </div>
                        )}

                        {activeTab === "settings" && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className="mb-4 text-sm font-semibold text-slate-400 uppercase tracking-widest">Interface</h3>
                                    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                        <div>
                                            <div className="font-medium text-slate-200">Dark Mode</div>
                                            <div className="text-xs text-slate-500">Always active</div>
                                        </div>
                                        <div className="flex h-6 w-11 items-center rounded-full bg-violet-600 px-1">
                                            <div className="h-4 w-4 rounded-full bg-white shadow-sm ml-auto"></div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-4 text-sm font-semibold text-slate-400 uppercase tracking-widest">Data</h3>
                                    <button
                                        onClick={onDeleteAllChats}
                                        className="flex w-full items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 p-4 transition hover:bg-red-500/10 hover:border-red-500/30 group"
                                    >
                                        <div className="text-left">
                                            <div className="font-medium text-red-400 group-hover:text-red-300">Clear all chats</div>
                                            <div className="text-xs text-red-400/60 group-hover:text-red-300/60">Permanently delete all conversation history</div>
                                        </div>
                                        <IconTrash />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

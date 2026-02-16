"use client";

import { useState } from "react";
import { AuthUser, Chat, ModelInfo } from "@/lib/types";
import { IconChevronDown, IconCheck, IconMenu } from "@/components/Icons";

interface HeaderProps {
    activeChat: Chat | null;
    authUser: AuthUser | null;
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
    onLogout: () => void;
    availableModels: ModelInfo[];
    selectedModel: string;
    onSwitchModel: (id: string) => void;
}

export default function Header({
    activeChat,
    authUser,
    sidebarOpen,
    onToggleSidebar,
    onLogout,
    availableModels,
    selectedModel,
    onSwitchModel,
}: HeaderProps) {
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

    return (
        <header className="flex items-center gap-3 border-b border-white/[0.06] bg-[#13131d]/60 px-5 py-3 backdrop-blur z-20">
            <button
                type="button"
                className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                onClick={onToggleSidebar}
                title="Toggle sidebar"
            >
                <IconMenu />
            </button>

            <div className="flex-1 overflow-hidden">
                <h1 className="text-base font-semibold leading-tight truncate">
                    {activeChat ? activeChat.title : "New Chat"}
                </h1>
                <p className="text-[11px] text-slate-500 truncate">
                    {activeChat && activeChat.messages
                        ? `${activeChat.messages.length} messages`
                        : authUser
                            ? `Logged in as ${authUser.name}`
                            : "AI Chatbot"}
                </p>
            </div>

            <div className="flex items-center gap-2">
                {/* Model selector */}
                <div className="relative">
                    <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                        onClick={() => setModelDropdownOpen((v) => !v)}
                    >
                        <span className="max-w-32 truncate hidden sm:inline-block">
                            {availableModels.find((m) => m.id === selectedModel)?.name ??
                                selectedModel ??
                                "Select Model"}
                        </span>
                        <span className="sm:hidden">
                            Model
                        </span>
                        <IconChevronDown />
                    </button>

                    {modelDropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setModelDropdownOpen(false)}
                            />
                            <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-white/[0.08] bg-[#1a1a28] py-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                {availableModels.map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-white/[0.06] ${selectedModel === m.id
                                                ? "text-violet-400 bg-violet-600/5"
                                                : "text-slate-300"
                                            }`}
                                        onClick={() => {
                                            onSwitchModel(m.id);
                                            setModelDropdownOpen(false);
                                        }}
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

                <button
                    type="button"
                    className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                    onClick={onLogout}
                >
                    Logout
                </button>
            </div>
        </header>
    );
}

"use client";

import { useRef, useEffect, useState } from "react";
import Markdown from "@/components/Markdown";
import { AuthUser, Chat, Attachment } from "@/lib/types";
import {
    IconBot,
    IconUser,
    IconCopy,
    IconPaperclip,
    IconPlus,
} from "@/components/Icons";

interface ChatAreaProps {
    activeChat: Chat | null;
    authUser: AuthUser | null;
    onNewChat: () => void;
    sending: boolean;
}

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

export default function ChatArea({
    activeChat,
    authUser,
    onNewChat,
    sending,
}: ChatAreaProps) {
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    const activeMessages = activeChat?.messages ?? [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeMessages.length, sending, activeChat?._id]);

    function copyMessage(text: string, idx: number) {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 1500);
    }

    function fmtTime(v?: string) {
        if (!v) return "";
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    function fmtSize(size: number) {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    function isImg(mime: string) {
        return mime.startsWith("image/");
    }

    if (!activeChat) {
        return (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center h-full animate-in fade-in duration-500 px-4">
                <div className="mb-4 sm:mb-6 rounded-3xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 p-4 sm:p-6 shadow-[0_0_40px_-10px_rgba(124,58,237,0.3)]">
                    <IconBot />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
                    Welcome to Shivagpt
                </h2>
                <p className="mt-2 sm:mt-3 max-w-sm text-xs sm:text-sm text-slate-400 leading-relaxed px-4">
                    Create a new chat to start a conversation. You can attach
                    images and documents, and the AI will understand them.
                </p>
                <button
                    className="mt-6 sm:mt-8 flex items-center gap-2 rounded-xl bg-violet-600 px-5 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 hover:scale-105 active:scale-95 min-h-[44px]"
                    onClick={onNewChat}
                    type="button"
                >
                    <IconPlus /> Start New Chat
                </button>
            </div>
        );
    }

    if (activeMessages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center h-full animate-in fade-in duration-500 px-4">
                <div className="mb-3 sm:mb-4 rounded-2xl bg-violet-600/10 p-4 sm:p-5 text-violet-400">
                    <IconBot />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 px-4">
                    Send your first message or drop an image to begin.
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl px-3 sm:px-5 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {activeMessages.map((msg, idx) => (
                <div
                    key={`${msg.role}-${idx}`}
                    className={`flex gap-2 sm:gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""} animate-in slide-in-from-bottom-2 duration-300`}
                >
                    {/* Avatar */}
                    <div
                        className={`mt-1 flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-lg shadow-sm ${msg.role === "user"
                                ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white"
                                : "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white"
                            }`}
                    >
                        {msg.role === "user" ? <IconUser /> : <IconBot />}
                    </div>

                    {/* Bubble */}
                    <div
                        className={`group relative max-w-[85%] sm:max-w-[85%] rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${msg.role === "user"
                                ? "bg-[#2b2d31] text-slate-100"
                                : "bg-transparent text-slate-200"
                            }`}
                    >
                        {/* Content */}
                        {msg.role === "model" ? (
                            <div className="prose-invert prose-p:leading-relaxed prose-pre:bg-[#1e1e2e] prose-pre:border prose-pre:border-white/5">
                                <Markdown content={msg.content} />
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                                {msg.attachments.map((att) => (
                                    <a
                                        key={att.url}
                                        href={att.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block group/att"
                                    >
                                        {isImg(att.mimeType) ? (
                                            <div className="relative overflow-hidden rounded-lg border border-white/10 transition group-hover:border-violet-400/50">
                                                <img
                                                    src={att.url}
                                                    alt={att.originalName}
                                                    className="max-h-32 sm:max-h-48 max-w-full object-cover transition duration-300 group-hover/att:scale-105"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 rounded-lg bg-black/20 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs hover:bg-black/30 border border-transparent hover:border-white/10 transition-colors">
                                                <IconPaperclip />
                                                <span className="max-w-32 sm:max-w-40 truncate">
                                                    {att.originalName}
                                                </span>
                                                <span className="text-slate-500 hidden sm:inline">
                                                    {fmtSize(att.size)}
                                                </span>
                                            </div>
                                        )}
                                    </a>
                                ))}
                            </div>
                        )}

                        {/* Timestamp + actions */}
                        <div className={`mt-1 flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-slate-500 opacity-0 transition-opacity group-hover:opacity-100 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {fmtTime(msg.createdAt)}
                            <button
                                type="button"
                                title="Copy"
                                className="rounded p-1 hover:bg-white/10 hover:text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                onClick={() => copyMessage(msg.content, idx)}
                            >
                                {copiedIdx === idx ? (
                                    <span className="text-green-400 font-medium text-[9px] sm:text-[10px]">Copied</span>
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
                <div className="flex gap-2 sm:gap-4 animate-in fade-in duration-300">
                    <div className="mt-1 flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm">
                        <IconBot />
                    </div>
                    <div className="rounded-2xl bg-white/[0.05] px-3 sm:px-4 py-1.5 sm:py-2">
                        <TypingDots />
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} className="h-1" />
        </div>
    );
}

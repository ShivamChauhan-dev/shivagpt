"use client";

import { useState, useRef, KeyboardEvent, ChangeEvent } from "react";
import { Attachment, FeatureOptions } from "@/lib/types";
import { IconPaperclip, IconSend } from "@/components/Icons";

interface MessageInputProps {
    onSend: (content: string, features: FeatureOptions) => void;
    onUpload: (files: FileList | File[]) => void;
    uploading: boolean;
    sending: boolean;
    pendingAttachments: Attachment[];
    onRemoveAttachment: (index: number) => void;
}

export default function MessageInput({
    onSend,
    onUpload,
    uploading,
    sending,
    pendingAttachments,
    onRemoveAttachment,
}: MessageInputProps) {
    const [input, setInput] = useState("");
    const [featureOptions, setFeatureOptions] = useState<FeatureOptions>({
        webSearch: true,
        dateGrounding: true,
        codeMode: false,
    });

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    function toggleFeature(key: keyof FeatureOptions) {
        setFeatureOptions((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    }

    function handleSend() {
        if (sending) return;
        const content = input.trim();
        if (!content && pendingAttachments.length === 0) return;

        onSend(content, featureOptions);
        setInput("");
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }

    function onInputKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    function onSelectFiles(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files.length > 0) {
            onUpload(event.target.files);
        }
        // Reset input value to allow selecting same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    function isImg(mime: string) {
        return mime.startsWith("image/");
    }

    return (
        <div className="border-t border-white/[0.06] bg-[#13131d]/60 p-4 backdrop-blur z-20">
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
                <div className="mb-3 flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 duration-300">
                    {pendingAttachments.map((att, i) => (
                        <div
                            key={`${att.url}-${i}`}
                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs group relative hover:border-violet-500/50 transition-colors"
                        >
                            {isImg(att.mimeType) ? (
                                <img
                                    src={att.url}
                                    alt=""
                                    className="h-8 w-8 rounded object-cover border border-white/10"
                                />
                            ) : (
                                <IconPaperclip />
                            )}
                            <span className="max-w-32 truncate">{att.originalName}</span>
                            <button
                                type="button"
                                className="ml-1 text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors"
                                onClick={() => onRemoveAttachment(i)}
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
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-all duration-200 ${featureOptions.webSearch
                            ? "border-violet-500/40 bg-violet-500/20 text-violet-200 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                            : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                        }`}
                >
                    Web Search {featureOptions.webSearch ? "ON" : "OFF"}
                </button>
                <button
                    type="button"
                    onClick={() => toggleFeature("dateGrounding")}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-all duration-200 ${featureOptions.dateGrounding
                            ? "border-violet-500/40 bg-violet-500/20 text-violet-200 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                            : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                        }`}
                >
                    Smart Date {featureOptions.dateGrounding ? "ON" : "OFF"}
                </button>
                <button
                    type="button"
                    onClick={() => toggleFeature("codeMode")}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-all duration-200 ${featureOptions.codeMode
                            ? "border-violet-500/40 bg-violet-500/20 text-violet-200 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                            : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                        }`}
                >
                    Code Mode {featureOptions.codeMode ? "ON" : "OFF"}
                </button>
            </div>

            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-white/[0.08] bg-[#1a1a28] p-2 shadow-lg focus-within:border-violet-500/30 focus-within:ring-1 focus-within:ring-violet-500/30 transition-all">
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
                    className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-slate-500 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto'; // Reset height
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`; // Set new height
                    }}
                    onKeyDown={onInputKeyDown}
                    disabled={sending}
                />

                <button
                    type="button"
                    className={`flex-shrink-0 rounded-xl p-2.5 text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${input.trim() || pendingAttachments.length > 0
                            ? "bg-violet-600 hover:bg-violet-500 shadow-violet-600/20"
                            : "bg-white/10 text-slate-400 hover:bg-white/20"
                        }`}
                    onClick={handleSend}
                    disabled={
                        sending || (!input.trim() && pendingAttachments.length === 0)
                    }
                >
                    <IconSend />
                </button>
            </div>

            <p className="mt-2 text-center text-[10px] text-slate-600 select-none">
                Enter to send · Shift+Enter for new line · Drop files to attach
            </p>
        </div>
    );
}

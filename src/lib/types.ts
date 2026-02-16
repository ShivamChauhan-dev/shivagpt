export type Attachment = {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
};

export type Message = {
    role: "user" | "model";
    content: string;
    attachments?: Attachment[];
    createdAt?: string;
};

export type ChatSummary = {
    _id: string;
    title: string;
    updatedAt?: string;
    createdAt?: string;
};

export type Chat = ChatSummary & {
    model: string;
    messages: Message[];
};

export type ModelInfo = {
    id: string;
    name: string;
    description: string;
};

export type FeatureOptions = {
    webSearch: boolean;
    dateGrounding: boolean;
    codeMode: boolean;
};

export type AuthUser = {
    id: string;
    name: string;
    email: string;
};

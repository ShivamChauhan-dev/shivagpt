import mongoose, { InferSchemaType, Model } from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },
    content: {
      type: String,
      default: "",
      trim: true,
    },
    attachments: {
      type: [
        new mongoose.Schema(
          {
            filename: { type: String, required: true },
            originalName: { type: String, required: true },
            mimeType: { type: String, required: true },
            size: { type: Number, required: true },
            url: { type: String, required: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const ChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "User",
    },
    title: {
      type: String,
      default: "New Chat",
      trim: true,
    },
    model: {
      type: String,
      default: "gemini-2.5-flash",
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export type ChatDocument = InferSchemaType<typeof ChatSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Chat: Model<ChatDocument> =
  (mongoose.models.Chat as Model<ChatDocument>) ||
  mongoose.model<ChatDocument>("Chat", ChatSchema);

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  pinned: boolean;
  messages: ChatMessage[];
  updatedAt: string;
};

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export type UploadedAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
};

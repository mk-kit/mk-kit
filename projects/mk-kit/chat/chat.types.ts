/** Who a message comes from. `system` renders as a centred note. */
export type MkChatRole = 'user' | 'assistant' | 'system';

/** Display identity of a message author. */
export interface MkChatAuthor {
  /** Shown beside the message and used for avatar initials. */
  name: string;
  /** Avatar image URL; initials from `name` when omitted. */
  avatar?: string;
}

/** A file shown with a message (an image when `type` is `image/*` and `url` is set). */
export interface MkChatAttachment {
  name: string;
  /** MIME type, e.g. `image/png`. */
  type?: string;
  /** Size in bytes, shown formatted. */
  size?: number;
  /** Link / image source. */
  url?: string;
}

/** Lifecycle of a tool / function call an assistant made while answering. */
export type MkChatToolStatus = 'running' | 'done' | 'error';

/** A tool call card rendered above the message text. */
export interface MkChatToolCall {
  id?: string;
  /** Tool name, e.g. `search_orders`. */
  name: string;
  status: MkChatToolStatus;
  /** One-line human summary, e.g. `3 orders found`. */
  summary?: string;
  /** Raw input, shown under the disclosure. */
  input?: string;
  /** Raw output, shown under the disclosure. */
  output?: string;
}

/** One message in the conversation. Replace the object (new reference) to update it. */
export interface MkChatMessage {
  id: string;
  role: MkChatRole;
  /** Message body — Markdown for assistants (when `markdown` is on), plain text otherwise. */
  text: string;
  author?: MkChatAuthor;
  /** When it was sent; a `Date`, ISO string or epoch ms. */
  timestamp?: Date | string | number;
  /** Still receiving text: shows a cursor and keeps the log pinned to the bottom. */
  streaming?: boolean;
  /** Delivery / generation failed; shown under the bubble with a retry button. */
  error?: string;
  attachments?: MkChatAttachment[];
  tools?: MkChatToolCall[];
}

/** Payload of the `send` output. */
export interface MkChatSend {
  text: string;
  files: File[];
}

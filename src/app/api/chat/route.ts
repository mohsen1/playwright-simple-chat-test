import { NextRequest } from "next/server";
import { EventEmitter } from "stream";

export interface Message {
  timestamp: number;
  senderId: string;
  content: string;
}

export interface User {
  id: string;
  typing: boolean;
}

interface DB {
  messages: Message[];
  users: User[];
}

const db: DB = {
  messages: [],
  users: [
    {
      id: "1",
      typing: false,
    },
    {
      id: "2",
      typing: false,
    },
  ],
};

export interface MessageEvent {
  event: "message";
  data: Message[];
}

export interface UserEvent {
  event: "user";
  data: User;
}

export type SSE = MessageEvent | UserEvent;

export async function PUT(request: NextRequest) {
  const formData = await request.formData();
  const userId = formData.get("userId") as string;
  const typing = formData.get("typing") === "true";

  const user = db.users.find((user) => user.id === userId);
  if (user) {
    user.typing = typing;
    eventEmitter.emit("user", user);
  }

  return new Response("OK");
}

const eventEmitter = new EventEmitter();

export async function POST(request: NextRequest) {
  // get the form data
  const formData = await request.formData();

  const message = {
    timestamp: Date.now(),
    senderId: formData.get("senderId") as string,
    content: formData.get("content") as string,
  };
  db.messages.push(message);

  eventEmitter.emit("messages", [message]);

  return new Response("OK");
}

export async function GET(request: NextRequest) {
  let responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  eventEmitter.on("messages", (message) => {
    const data: MessageEvent = {
      event: "message",
      data: message,
    };
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  });

  eventEmitter.on("user", (user) => {
    const data: UserEvent = {
      event: "user",
      data: user,
    };
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  });

  writer.write(encoder.encode("data: " + JSON.stringify(db.messages) + "\n\n"));

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

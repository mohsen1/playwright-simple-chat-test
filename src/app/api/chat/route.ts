import { NextRequest } from "next/server";
import { EventEmitter } from "stream";

export interface Message {
  timestamp: number;
  senderId: string;
  content: string;
}

interface DB {
  messages: Message[];
}

const db: DB = {
  messages: [],
};

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

  eventEmitter.emit("message", message);

  return new Response("OK", {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function GET(request: NextRequest) {
  let responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  eventEmitter.on("message", (message) => {
    writer.write(encoder.encode(`data: ${JSON.stringify([message])}\n\n`));
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

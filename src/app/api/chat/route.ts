import { MessageEvent, UserEvent } from "@/app/types";
import { NextRequest } from "next/server";
import { EventEmitter } from "stream";
import { DB } from "./db";

export async function PUT(request: NextRequest) {
  const formData = await request.formData();
  const userId = formData.get("userId") as string;
  const typing = formData.get("typing") === "true";

  eventEmitter.emit("user", {
    id: userId,
    typing: typing,
  });

  return new Response("OK");
}

const eventEmitter = new EventEmitter();

export async function POST(request: NextRequest) {
  const db = new DB();
  const formData = await request.formData();

  const message = {
    timestamp: Date.now(),
    senderId: formData.get("senderId") as string,
    content: formData.get("content") as string,
  };
  db.appendMessage(message);

  eventEmitter.emit("messages", [message]);

  return new Response("OK");
}

export async function GET(request: NextRequest) {
  const db = new DB();
  const responseStream = new TransformStream();
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

  const data: MessageEvent = {
    event: "message",
    data: db.messages,
  };
  writer.write(encoder.encode("data: " + JSON.stringify(data) + "\n\n"));

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

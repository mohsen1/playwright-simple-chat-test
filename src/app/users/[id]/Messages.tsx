"use client";
import { Message } from "@/app/api/chat/route";
import { useEffect, useState } from "react";

export function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const eventSource = new EventSource("/api/chat");
    eventSource.addEventListener("message", (event) => {
      const newMessages = JSON.parse(event.data);
      setMessages((messages) => [...messages, ...newMessages]);
    });

    eventSource.addEventListener("error", (event) => {
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex-1">
      {messages.map((message, i) => (
        <div key={i} className="flex flex-col my-10">
          <span className="text-sm">
            <span>User {message.senderId} </span>
            <span className="opacity-30">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </span>
          <span className="text-lg font-bold">{message.content}</span>
        </div>
      ))}
    </div>
  );
}

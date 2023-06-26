"use client";

import { Message, SSE } from "@/app/types";
import { useEffect, useRef, useState } from "react";

export function Messages({ id }: { id: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/chat");
    eventSource.addEventListener("message", (event) => {
      const sse = JSON.parse(event.data) as SSE;

      if (sse.event === "user" && sse.data.id !== id) {
        setTyping(sse.data.typing);
      } else if (sse.event === "message") {
        const newMessages = sse.data;

        setMessages((messages) => [...messages, ...newMessages]);
        setTimeout(() => {
          containerRef.current?.scrollTo({
            behavior: "smooth",
            top: containerRef.current.scrollHeight,
          });
        }, 5);
      }
    });

    eventSource.addEventListener("error", (event) => {
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [id]);

  return (
    <div
      ref={containerRef}
      className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex-1 overflow-y-scroll"
    >
      {messages.map((message, i) => {
        const isSelf = message.senderId === id;
        return (
          <div key={i} className="flex my-10 flex-col">
            <div
              className={`flex justify-end ${
                isSelf ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div className="opacity-30 ">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
              <div className="px-2">
                {isSelf ? "You" : `User ${message.senderId}`}
              </div>
            </div>

            <div
              className={`relative text-white p-5 rounded-lg shadow-md mt-4 ${
                isSelf ? "bg-blue-500" : "bg-gray-500"
              }`}
            >
              <div
                className={`absolute -top-2 inline-block h-4 w-4 transform rotate-45 ${
                  isSelf ? "left-4 bg-blue-500 " : "right-4 bg-gray-500"
                }`}
              ></div>
              <p>{message.content}</p>
            </div>
          </div>
        );
      })}
      {typing && <TypingIndicator />}
    </div>
  );
}

const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-2 py-4 px-6 animate-pulse justify-end align-end">
      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
    </div>
  );
};

"use client";

import { useState } from "react";

export function Input({ id }: { id: string }) {
  const [, setTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  function updatingStatus(typing: boolean) {
    setTyping((previousStatus) => {
      if (previousStatus !== typing) {
        const formData = new FormData();
        formData.append("userId", id);
        formData.append("typing", typing.toString());
        fetch("/api/chat", {
          method: "PUT",
          body: formData,
        });
      }
      return typing;
    });
  }

  return (
    <div className="w-full">
      <form
        action="/api/chat"
        method="POST"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.target as HTMLFormElement;
          const content = form.content.value;
          const formData = new FormData(form);
          if (content) {
            form.content.value = "";
            form.content.focus();
            updatingStatus(false);
            fetch(form.action, {
              method: form.method,
              body: formData,
            });
          }
        }}
      >
        <input type="hidden" name="senderId" value={id} />
        <input
          name="content"
          autoComplete="off"
          className="w-full h-4 block px-4 py-8 text-xl border text-black"
          type="text"
          placeholder="Type a message"
          onKeyDown={() => {
            updatingStatus(true);
          }}
          onKeyUp={() => {
            if (typingTimeout) {
              clearTimeout(typingTimeout);
            }
            setTypingTimeout(
              setTimeout(() => {
                updatingStatus(false);
              }, 500)
            );
          }}
        />
      </form>
    </div>
  );
}

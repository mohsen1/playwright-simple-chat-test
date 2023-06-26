import { Message, User } from "@/app/types";
import fs from "node:fs";

/**
 * A terrible FS based database
 */
export class DB {
  #messages!: Message[];
  #persistencePath = "./db.json";

  serialize() {
    return JSON.stringify({
      messages: this.#messages,
    });
  }

  #persist = () => {
    fs.writeFileSync(this.#persistencePath, this.serialize(), "utf-8");
  };

  #load = () => {
    if (!fs.existsSync(this.#persistencePath)) {
      this.#messages = [];
      this.#persist();
    } else {
      const db = JSON.parse(fs.readFileSync(this.#persistencePath, "utf-8"));
      this.#messages = db.messages;
    }
  };

  constructor() {
    this.#load();
  }

  get messages() {
    this.#load();
    return this.#messages;
  }

  set messages(messages: Message[]) {
    this.#messages = messages;
    this.#persist();
  }

  public appendMessage(message: Message) {
    this.#messages = [...this.#messages, message];
    this.#persist();
  }
}

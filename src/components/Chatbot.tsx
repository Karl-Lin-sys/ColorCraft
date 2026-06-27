import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";

type Message = {
  role: "user" | "model";
  text: string;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hi there! I'm here to help you brainstorm fun themes for your custom coloring book. Any ideas so far, or would you like some suggestions?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", text: userMessage }],
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      setMessages((prev) => [...prev, { role: "model", text: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\\n\\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              if (dataStr === "[DONE]") {
                break;
              }
              try {
                const data = JSON.parse(dataStr);
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].text += data.text;
                  return newMessages;
                });
              } catch (err) {
                // Ignore parse errors on incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Oops, something went wrong. Try again!" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
        <h2 className="font-semibold text-neutral-800 flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-500" />
          Idea Brainstormer
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Chat with Gemini for theme ideas
        </p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-sm"
                  : "bg-neutral-100 text-neutral-800 rounded-tl-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 flex-row">
            <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-neutral-100 text-neutral-500 rounded-tl-sm flex items-center">
              <Loader2 size={16} className="animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 bg-white border-t border-neutral-100"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your ideas here..."
            disabled={isLoading}
            className="w-full bg-neutral-100 border-transparent rounded-full px-5 py-3 pr-12 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-full disabled:opacity-50 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

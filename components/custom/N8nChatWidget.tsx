"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = { role: "user" | "assistant"; text: string };

export default function N8nChatWidget() {
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hola cuéntame que buscas" },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(crypto.randomUUID());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVisible(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || sending || !sessionId) return;

    setInput("");
    setMessages((current) => [...current, { role: "user", text: message }]);
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al enviar el mensaje");
      setMessages((current) => [...current, { role: "assistant", text: data.output }]);
    } catch (error) {
      setMessages((current) => [...current, {
        role: "assistant",
        text: error instanceof Error ? error.message : "No se pudo enviar el mensaje",
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Cerrar chat de asistencia" : "Abrir chat de asistencia"}
        aria-expanded={visible}
        className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2 rounded-full border-2 border-[#34efc2] bg-black px-5 py-3 font-bold text-[#34efc2] shadow-lg transition-all duration-300 hover:scale-105 hover:bg-neutral-900"
      >
        <span className="text-2xl" aria-hidden="true">{visible ? "✕" : "💬"}</span>
        <span className="text-sm uppercase tracking-wider">{visible ? "Cerrar" : "Asistente"}</span>
      </button>

      {visible && (
        <div role="dialog" aria-label="Chat de asistencia" className="fixed bottom-20 right-5 z-[9998] flex h-[500px] max-h-[calc(100vh-7rem)] w-[350px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-[#34efc2]/30 bg-black shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="font-bold text-[#34efc2]">MegaBot</p>
              <p className="text-xs text-white/60">Asistente de MegaHerramientas</p>
            </div>
            <button onClick={() => setVisible(false)} aria-label="Cerrar chat" className="text-xl text-[#34efc2]">✕</button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-neutral-950 p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${message.role === "user" ? "whitespace-pre-wrap bg-[#34efc2] text-black" : "bg-neutral-800 text-white"}`}>
                  {message.role === "assistant" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        img: ({ src, alt }) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={typeof src === "string" ? src : ""} alt={alt || "Producto"} className="mt-2 mb-2 max-h-40 w-full rounded-lg object-contain" />
                        ),
                        a: ({ href, children }) => {
                          let localHref = href || "#";
                          try {
                            const url = new URL(localHref, window.location.origin);
                            if (["megaherramientas.com.co", "www.megaherramientas.com.co"].includes(url.hostname)) {
                              localHref = `${url.pathname}${url.search}${url.hash}`;
                            }
                          } catch {
                            localHref = href || "#";
                          }

                          return (
                            <a href={localHref} className="font-bold text-[#34efc2] underline">
                              {children}
                            </a>
                          );
                        },
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  ) : message.text}
                </div>
              </div>
            ))}
            {sending && <div className="w-fit rounded-xl bg-neutral-800 px-3 py-2 text-sm text-white">Escribiendo…</div>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-white/10 bg-black p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe tu pregunta…"
              aria-label="Mensaje"
              disabled={sending}
              className="min-w-0 flex-1 rounded-full border border-white/20 bg-neutral-900 px-4 py-2 text-sm text-white outline-none focus:border-[#34efc2]"
            />
            <button disabled={sending || !input.trim()} className="rounded-full bg-[#34efc2] px-4 font-bold text-black disabled:opacity-50" aria-label="Enviar">➤</button>
          </form>
        </div>
      )}
    </>
  );
}
"use client";

import Link from "next/link";
import { FormEvent, startTransition, useEffect, useRef, useState } from "react";
import { AvatarRenderer } from "@/components/AvatarRenderer";
import { defaultAvatarPreference, loadAvatarPreference, suggestedQuestions, type AvatarPreference, type AvatarState } from "@/lib/avatar";
import type { ChatMessage } from "@/lib/chat";

export default function ChatPage() {
  const [avatar, setAvatar] = useState<AvatarPreference>(defaultAvatarPreference);
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Halo, Petualang! Ada hal tentang makanan, minuman, atau gerak yang membuatmu penasaran?" },
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const resetTimerRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvatar(loadAvatarPreference());
    return () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading, error]);

  async function submitQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);
    setAvatarState("thinking");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-10) }),
      });
      const data = (await response.json()) as { message?: string; error?: { message?: string } };
      if (!response.ok || !data.message) throw new Error(data.error?.message || "Si Cehat belum bisa menjawab sekarang.");

      startTransition(() => {
        setMessages([...nextMessages, { role: "assistant", content: data.message as string }]);
        setAvatarState("talking");
      });
      resetTimerRef.current = window.setTimeout(() => {
        setAvatarState("happy");
        resetTimerRef.current = null;
      }, 1400);
    } catch {
      setError("Pondok Cerita sedang istirahat sebentar. Coba lagi nanti, ya.");
      setAvatarState("confused");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion(input);
  }

  const companionCopy = avatarState === "thinking"
    ? "Hmm, aku sedang mencari jawaban yang mudah dimengerti..."
    : avatarState === "talking"
      ? "Aku punya cerita untukmu!"
      : avatarState === "confused"
        ? "Waduh, jalur jawabannya sedang tertutup."
        : "Tanyakan apa saja tentang kebiasaan sehat.";

  return (
    <main className="map-grid min-h-screen bg-[#f8e6ad] px-3 py-4 sm:px-6 sm:py-5">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border-3 border-[#173d31] bg-[#fff9e9] px-4 py-3 shadow-[4px_5px_0_#173d31]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#247a4d]">Lokasi Petualangan</p>
            <h1 className="display-font text-2xl font-black text-[#173d31] sm:text-3xl">Pondok Cerita</h1>
          </div>
          <nav className="flex gap-2" aria-label="Navigasi chat">
            <Link className="game-button rounded-full bg-[#6eb461] px-5 py-3 text-sm font-black text-[#173d31]" href="/child">Kembali ke Peta</Link>
            <Link aria-label="Ganti avatar" className="rounded-full border-2 border-[#173d31] bg-white px-4 py-3 text-sm font-black text-[#173d31]" href="/avatar">Ganti Teman</Link>
          </nav>
        </header>

        <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
          <section className="adventure-paper relative overflow-hidden rounded-[2rem] bg-[#83c876] p-5 lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
            <div className="absolute inset-0 map-grid opacity-25" aria-hidden="true" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <span className="inline-flex rounded-full border-2 border-[#173d31] bg-[#f4b942] px-3 py-2 text-xs font-black uppercase tracking-wider text-[#173d31]">Teman siap mendengar</span>
                <h2 className="display-font mt-3 text-4xl font-black leading-none text-[#173d31]">Cerita saja. Tidak ada pertanyaan aneh.</h2>
              </div>
              <div className="my-4">
                <AvatarRenderer {...avatar} state={avatarState} className="h-60 w-60 sm:h-72 sm:w-72" />
              </div>
              <p className="relative rounded-3xl border-3 border-[#173d31] bg-white p-4 text-center text-sm font-black leading-6 text-[#173d31] shadow-[4px_5px_0_#173d31]" aria-live="polite">
                {companionCopy}
              </p>
            </div>
          </section>

          <section className="adventure-paper flex min-h-[70vh] flex-col rounded-[2rem] bg-[#fff9e9] p-4 sm:p-5 lg:h-[calc(100vh-2.5rem)]">
            <div className="mb-4 flex items-center justify-between border-b-2 border-dashed border-[#173d31]/25 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#e95345]">Buku Percakapan</p>
                <h2 className="display-font text-2xl font-black text-[#173d31]">Kamu dan Si Cehat</h2>
              </div>
              <span className="rounded-full bg-[#bde5db] px-3 py-2 text-xs font-black text-[#173d31]">Aman untuk bertanya</span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1" aria-live="polite">
              {messages.map((message, index) => (
                <div className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`} key={`${message.role}-${index}`}>
                  {message.role === "assistant" ? <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#173d31] bg-[#6eb461] text-xs font-black text-[#173d31]">SC</span> : null}
                  <p className={`max-w-[82%] border-2 border-[#173d31] px-4 py-3 text-base font-bold leading-7 shadow-[3px_4px_0_#173d31] ${message.role === "user" ? "rounded-[1.5rem_1.5rem_0.4rem_1.5rem] bg-[#ef6a55] text-[#173d31]" : "rounded-[1.5rem_1.5rem_1.5rem_0.4rem] bg-white text-[#173d31]"}`}>
                    {message.content}
                  </p>
                </div>
              ))}
              {loading ? <p className="w-fit rounded-2xl border-2 border-[#173d31] bg-[#f4b942] px-4 py-3 text-sm font-black text-[#173d31]">Mencari jawaban...</p> : null}
              {error ? <p className="rounded-2xl border-2 border-[#9d3434] bg-[#f8d6d1] px-4 py-3 text-sm font-black text-[#7f2828]">{error}</p> : null}
              <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 border-t-2 border-dashed border-[#173d31]/25 pt-4">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-[#247a4d]">Kartu penasaran</p>
              <div className="flex gap-2 overflow-x-auto pb-3">
                {suggestedQuestions.map((question) => (
                  <button className="shrink-0 rounded-2xl border-2 border-[#173d31] bg-[#bde5db] px-4 py-3 text-left text-sm font-black text-[#173d31] transition hover:-translate-y-1 hover:bg-[#d9f0ea]" disabled={loading} key={question} onClick={() => void submitQuestion(question)} type="button">
                    {question}
                  </button>
                ))}
              </div>
              <form className="flex gap-2" onSubmit={handleSubmit}>
                <input
                  aria-label="Tulis pertanyaan"
                  className="min-h-14 min-w-0 flex-1 rounded-2xl border-3 border-[#173d31] bg-white px-4 text-base font-bold text-[#173d31] placeholder:text-[#285648]/55"
                  disabled={loading}
                  onBlur={() => !loading && setAvatarState("happy")}
                  onChange={(event) => {
                    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
                    setInput(event.target.value);
                    if (!loading) setAvatarState(event.target.value ? "listening" : "happy");
                  }}
                  maxLength={1000}
                  placeholder="Aku penasaran tentang..."
                  value={input}
                />
                <button className="game-button min-h-14 rounded-2xl bg-[#f4b942] px-5 text-base font-black text-[#173d31] disabled:cursor-not-allowed disabled:opacity-45" disabled={loading || !input.trim()} type="submit">Kirim</button>
              </form>
              <p className="mt-2 text-xs font-bold text-[#285648]/70">Si Cehat membantu belajar dan tidak memberikan diagnosis atau obat.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

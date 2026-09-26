"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarRenderer } from "@/components/AvatarRenderer";
import {
  accessories,
  characters,
  defaultAvatarPreference,
  loadAvatarPreference,
  saveAvatarPreference,
  type AvatarPreference,
} from "@/lib/avatar";

const orbColors = ["#49a873", "#4b93d1", "#ef745a", "#8b6acb"];

export default function AvatarPage() {
  const [preference, setPreference] = useState<AvatarPreference>(defaultAvatarPreference);

  useEffect(() => {
    setPreference(loadAvatarPreference());
    const storedChildId = typeof window !== "undefined" ? localStorage.getItem("si-cehat-active-child-id") : null;
    const url = storedChildId ? `/api/avatar?childId=${encodeURIComponent(storedChildId)}` : "/api/avatar";
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.character) {
          setPreference(data);
          saveAvatarPreference(data, storedChildId || undefined);
        }
      })
      .catch(() => {});
  }, []);

  function updatePreference(next: AvatarPreference) {
    setPreference(next);
    const storedChildId = typeof window !== "undefined" ? localStorage.getItem("si-cehat-active-child-id") || undefined : undefined;
    saveAvatarPreference(next, storedChildId);
  }

  return (
    <main className="map-grid min-h-screen bg-[#f8e6ad] px-4 py-5 sm:px-7">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-5 flex items-center justify-between gap-3" aria-label="Navigasi avatar">
          <Link className="display-font text-xl font-black text-[#173d31]" href="/">Si Cehat</Link>
          <span className="rounded-full border-2 border-[#173d31] bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#247a4d]">Pos Teman</span>
        </nav>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="adventure-paper relative overflow-hidden rounded-[2rem] bg-[#bde5db] p-5 lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
            <div className="relative z-10">
              <p className="text-sm font-black uppercase tracking-[0.15em] text-[#247a4d]">Langkah 1</p>
              <h1 className="display-font mt-1 text-4xl font-black leading-none text-[#173d31] sm:text-5xl">Pilih teman seperjalananmu.</h1>
            </div>
            <div className="relative mt-3 flex min-h-[320px] items-end justify-center">
              <div className="absolute bottom-0 h-28 w-full rounded-[50%] border-3 border-[#173d31] bg-[#6eb461]" aria-hidden="true" />
              <div className="relative z-10 pb-7">
                <AvatarRenderer {...preference} state="happy" className="h-56 w-56 sm:h-80 sm:w-80" />
              </div>
            </div>
            <div className="relative z-10 -mt-3 rounded-2xl border-2 border-[#173d31] bg-white/85 p-4 text-center">
              <p className="font-black text-[#173d31]">{characters.find((item) => item.id === preference.character)?.name} siap berangkat!</p>
              <p className="mt-1 text-sm font-bold text-[#285648]">Pilihanmu tersimpan otomatis di perangkat ini.</p>
            </div>
          </section>

          <section className="space-y-4 pb-5">
            <div className="adventure-paper rounded-[2rem] bg-[#fff9e9] p-5 sm:p-6">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-[#e95345]">Tim Si Cehat</p>
                  <h2 className="display-font text-3xl font-black text-[#173d31]">Siapa favoritmu?</h2>
                </div>
                <span className="rounded-full bg-[#f4b942] px-3 py-2 text-xs font-black text-[#173d31]">1 dari 4</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {characters.map((character) => {
                  const selected = preference.character === character.id;
                  return (
                    <button
                      aria-pressed={selected}
                      className={`relative min-h-48 overflow-hidden rounded-3xl border-3 p-3 text-left transition ${selected ? "border-[#173d31] bg-[#f4b942] shadow-[4px_5px_0_#173d31]" : "border-[#173d31]/25 bg-white hover:-translate-y-1 hover:border-[#173d31]"}`}
                      key={character.id}
                      onClick={() => updatePreference({ ...preference, character: character.id })}
                      type="button"
                    >
                      <AvatarRenderer accessory="none" character={character.id} orbColor={preference.orbColor} state={selected ? "happy" : "idle"} className="h-20 w-20 sm:h-28 sm:w-28" />
                      <span className="display-font block text-xl font-black text-[#173d31]">{character.name}</span>
                      <span className="mt-1 block text-xs font-bold leading-5 text-[#285648]">{character.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border-3 border-[#173d31] bg-[#ef6a55] p-5 text-[#173d31]">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#173d31]/75">Tambah gaya</p>
                <h2 className="display-font text-2xl font-black">Aksesori</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {accessories.map((accessory) => (
                    <button
                      aria-pressed={preference.accessory === accessory.id}
                      className={`rounded-full border-2 border-[#173d31] px-3 py-2 text-sm font-black transition ${preference.accessory === accessory.id ? "bg-[#173d31] text-white" : "bg-white text-[#173d31] hover:bg-[#fff9e9]"}`}
                      key={accessory.id}
                      onClick={() => updatePreference({ ...preference, accessory: accessory.id })}
                      type="button"
                    >
                      {accessory.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`rounded-[2rem] border-3 border-[#173d31] bg-[#75c8e8] p-5 ${preference.character === "default" ? "" : "opacity-50"}`}>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#173d31]/65">Khusus Bimbi</p>
                <h2 className="display-font text-2xl font-black text-[#173d31]">Warna tubuh</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {orbColors.map((color) => (
                    <button
                      aria-label={`Pilih warna ${color}`}
                      aria-pressed={preference.orbColor === color}
                      className={`h-11 w-11 rounded-full border-3 border-[#173d31] transition ${preference.orbColor === color ? "scale-110 shadow-[3px_3px_0_#173d31]" : ""}`}
                      disabled={preference.character !== "default"}
                      key={color}
                      onClick={() => updatePreference({ ...preference, orbColor: color })}
                      style={{ backgroundColor: color }}
                      type="button"
                    />
                  ))}
                </div>
              </div>
            </div>

            <Link className="game-button inline-flex min-h-16 w-full items-center justify-center rounded-full bg-[#6eb461] px-8 text-lg font-black text-[#173d31]" href="/child">
              Buka Peta Petualangan
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}

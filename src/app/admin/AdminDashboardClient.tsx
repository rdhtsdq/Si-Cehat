"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

interface MetricsData {
  metrics: {
    totalGuardians: number;
    totalChildren: number;
    totalWaterGlasses: number;
    totalActivityMinutes: number;
    totalXpEarned: number;
    averageWaterGlasses: number;
    averageActivityMinutes: number;
    averageStreak: number;
    totalChatSessions: number;
    totalChatMessages: number;
    foodToneDistribution: {
      balanced: number;
      sweet: number;
      fried: number;
      unknown: number;
    };
  };
  recentActivity: Array<{
    id: string;
    childName: string;
    date: string;
    waterGlasses: number;
    activityMinutes: number;
    xp: number;
    streak: number;
  }>;
  system: {
    aiModel: string;
    databaseStatus: string;
    timestamp: string;
  };
}

interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  xp: number;
  isActive: boolean;
}

interface QuizItem {
  id: string;
  question: string;
  options: string[];
  answer: string;
  xp: number;
  isActive: boolean;
}

interface MenuItem {
  id: string;
  title: string;
  note: string;
  orderIndex: number;
}

const DEFAULT_SYSTEM_PROMPT = `Kamu adalah Si Cehat, asisten edukasi kesehatan untuk anak usia 8 sampai 12 tahun.

Tujuanmu adalah membantu anak memahami makanan, minuman, aktivitas fisik, dan kebiasaan hidup sehat, terutama untuk membantu edukasi pencegahan diabetes.

ATURAN:
1. Gunakan Bahasa Indonesia sederhana.
2. Gunakan kalimat pendek.
3. Jawaban normal maksimal 5 kalimat pendek.
4. Berikan contoh konkret yang mudah dipahami anak.
5. Hindari istilah medis yang rumit.
6. Jika istilah medis diperlukan, jelaskan dengan bahasa sederhana.
7. Jangan memberikan diagnosis.
8. Jangan menentukan pengguna menderita penyakit tertentu.
9. Jangan memberikan dosis atau rekomendasi obat.
10. Jangan menyarankan diet ekstrem.
11. Jangan membuat anak takut terhadap makanan.
12. Jangan mengatakan satu makanan selalu "jahat" atau "dilarang".
13. Tekankan keseimbangan dan kebiasaan sehat.
14. Jika pertanyaan menyangkut gejala atau kondisi kesehatan pribadi, sarankan berbicara dengan orang tua/wali dan tenaga kesehatan.
15. Jika pertanyaan berada jauh di luar topik, arahkan secara singkat kembali ke makanan dan kebiasaan sehat.

Kamu bukan dokter dan tidak menggantikan tenaga kesehatan.

Nada bicara: ramah, sederhana, positif, tidak menghakimi, dan sesuai untuk anak SD.`;

export default function AdminDashboardClient({ userEmail }: { userEmail?: string | null }) {
  const [activeTab, setActiveTab] = useState<"metrics" | "cms" | "bot" | "export">("metrics");
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  // CMS States
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [cmsLoading, setCmsLoading] = useState(false);

  // Bot Config States
  const [botConfig, setBotConfig] = useState({
    provider: "openai",
    model: "gpt-4o-mini",
    baseUrl: "",
    maskedApiKey: "",
    apiKeyInput: "",
    isApiKeySet: false,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    temperature: 0.5,
    maxTokens: 300,
    isDbOverride: false,
  });
  const [botLoading, setBotLoading] = useState(false);
  const [botSaving, setBotSaving] = useState(false);
  const [botSaveStatus, setBotSaveStatus] = useState<string | null>(null);

  // Playground / Test States
  const [testPrompt, setTestPrompt] = useState("Halo Si Cehat! Kenapa kita harus makan sayur setiap hari?");
  const [testResult, setTestResult] = useState<{
    reply?: string;
    latencyMs?: number;
    isMock?: boolean;
    model?: string;
    error?: string;
  } | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  // Form toggles
  const [showAddChallenge, setShowAddChallenge] = useState(false);
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Form states
  const [newChallenge, setNewChallenge] = useState({ title: "", description: "", xp: 30 });
  const [newQuiz, setNewQuiz] = useState({ question: "", options: "Air putih, Soda, Boba", answer: "Air putih", xp: 20 });
  const [newMenu, setNewMenu] = useState({ title: "", note: "" });

  useEffect(() => {
    fetchMetrics();
    fetchCmsContent();
    fetchBotConfig();
  }, []);

  function fetchBotConfig() {
    setBotLoading(true);
    fetch("/api/admin/bot-config")
      .then((res) => res.json())
      .then((json) => {
        if (json.config) {
          setBotConfig({
            provider: json.config.provider || "openai",
            model: json.config.model || "gpt-4o-mini",
            baseUrl: json.config.baseUrl || "",
            maskedApiKey: json.config.maskedApiKey || "",
            apiKeyInput: "",
            isApiKeySet: json.config.isApiKeySet ?? false,
            systemPrompt: json.config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
            temperature: json.config.temperature ?? 0.5,
            maxTokens: json.config.maxTokens ?? 300,
            isDbOverride: json.config.isDbOverride ?? false,
          });
        }
      })
      .catch((err) => {
        console.error("Gagal memuat konfigurasi bot", err);
      })
      .finally(() => {
        setBotLoading(false);
      });
  }

  async function handleSaveBotConfig(e: React.FormEvent) {
    e.preventDefault();
    setBotSaving(true);
    setBotSaveStatus(null);
    try {
      const res = await fetch("/api/admin/bot-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: botConfig.provider,
          model: botConfig.model,
          baseUrl: botConfig.baseUrl || undefined,
          apiKey: botConfig.apiKeyInput || undefined,
          systemPrompt: botConfig.systemPrompt,
          temperature: botConfig.temperature,
          maxTokens: botConfig.maxTokens,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Gagal menyimpan konfigurasi bot.");

      setBotSaveStatus("Konfigurasi chatbot berhasil diperbarui dan aktif di database.");
      if (json.config) {
        setBotConfig((prev) => ({
          ...prev,
          maskedApiKey: json.config.maskedApiKey,
          apiKeyInput: "",
          isApiKeySet: json.config.isApiKeySet,
          isDbOverride: json.config.isDbOverride,
        }));
      }
      setTimeout(() => setBotSaveStatus(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setBotSaveStatus("Error: " + msg);
    } finally {
      setBotSaving(false);
    }
  }

  async function handleTestBot() {
    setTestRunning(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/bot-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: botConfig.provider,
          model: botConfig.model,
          baseUrl: botConfig.baseUrl || undefined,
          apiKey: botConfig.apiKeyInput || undefined,
          systemPrompt: botConfig.systemPrompt,
          temperature: botConfig.temperature,
          maxTokens: botConfig.maxTokens,
          testPrompt,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setTestResult({ error: json.error?.message || "Uji respon gagal." });
      } else {
        setTestResult({
          reply: json.reply,
          latencyMs: json.latencyMs,
          isMock: json.isMock,
          model: json.model,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal terhubung ke endpoint model.";
      setTestResult({ error: msg });
    } finally {
      setTestRunning(false);
    }
  }

  function fetchMetrics() {
    setLoading(true);
    fetch("/api/admin/metrics")
      .then((res) => res.json())
      .then((json) => {
        if (json.metrics) setData(json);
      })
      .catch((err) => {
        console.error("Gagal memuat metrik riset", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function fetchCmsContent() {
    setCmsLoading(true);
    fetch("/api/admin/content")
      .then((res) => res.json())
      .then((json) => {
        if (json.challenges) setChallenges(json.challenges);
        if (json.quizzes) setQuizzes(json.quizzes);
        if (json.menus) setMenus(json.menus);
      })
      .catch((err) => {
        console.error("Gagal memuat konten CMS", err);
      })
      .finally(() => {
        setCmsLoading(false);
      });
  }

  async function handleToggle(entity: "challenge" | "quiz", id: string, isActive: boolean) {
    await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "toggle", entity, id, isActive }),
    });
    fetchCmsContent();
  }

  async function handleDelete(type: "challenge" | "quiz" | "menu", id: string) {
    if (!confirm("Hapus item ini dari sistem?")) return;
    await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    fetchCmsContent();
  }

  async function handleAddChallenge(e: React.FormEvent) {
    e.preventDefault();
    if (!newChallenge.title || !newChallenge.description) return;
    await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "challenge",
        title: newChallenge.title,
        description: newChallenge.description,
        xp: Number(newChallenge.xp),
        isActive: false,
      }),
    });
    setNewChallenge({ title: "", description: "", xp: 30 });
    setShowAddChallenge(false);
    fetchCmsContent();
  }

  async function handleAddQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuiz.question || !newQuiz.answer) return;
    const optionsArray = newQuiz.options.split(",").map((s) => s.trim()).filter(Boolean);
    await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "quiz",
        question: newQuiz.question,
        options: optionsArray,
        answer: newQuiz.answer,
        xp: Number(newQuiz.xp),
        isActive: false,
      }),
    });
    setNewQuiz({ question: "", options: "Air putih, Soda, Boba", answer: "Air putih", xp: 20 });
    setShowAddQuiz(false);
    fetchCmsContent();
  }

  async function handleAddMenu(e: React.FormEvent) {
    e.preventDefault();
    if (!newMenu.title || !newMenu.note) return;
    await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "menu",
        title: newMenu.title,
        note: newMenu.note,
        orderIndex: menus.length + 1,
      }),
    });
    setNewMenu({ title: "", note: "" });
    setShowAddMenu(false);
    fetchCmsContent();
  }

  const foodTotal = data
    ? (data.metrics.foodToneDistribution.balanced +
        data.metrics.foodToneDistribution.sweet +
        data.metrics.foodToneDistribution.fried +
        data.metrics.foodToneDistribution.unknown) || 1
    : 1;

  const balancedCount = data?.metrics.foodToneDistribution.balanced || 0;
  const sweetCount = data?.metrics.foodToneDistribution.sweet || 0;
  const friedCount = data?.metrics.foodToneDistribution.fried || 0;

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#1c2c26]">
      {/* Top Application Bar */}
      <header className="border-b border-[#e2dec9] bg-white sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            {/* Brand & Context */}
            <div className="flex items-center gap-3">
              <Link href="/" className="font-black text-lg tracking-tight text-[#173d31]">
                Si Cehat
              </Link>
              <span className="h-4 w-px bg-[#d5ceb6]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5a6d64]">
                Konsol Riset & CMS
              </span>
              <span className="rounded bg-[#e8f3ed] px-2 py-0.5 text-[11px] font-bold text-[#1e6f47]">
                v1.0 Produksi
              </span>
            </div>

            {/* Utility status and actions */}
            <div className="flex items-center gap-3 text-xs">
              <div className="hidden sm:flex items-center gap-2 text-[#5a6d64]">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>DB PostgreSQL 18</span>
              </div>
              <span className="hidden sm:inline text-[#d5ceb6]">•</span>
              <div className="hidden sm:flex items-center gap-1.5 text-[#5a6d64]">
                <span>Model AI:</span>
                <span className="font-mono font-medium text-[#1c2c26]">{botConfig.model || data?.system.aiModel || "gpt-4o-mini"}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (activeTab === "metrics") fetchMetrics();
                  else if (activeTab === "cms") fetchCmsContent();
                  else if (activeTab === "bot") fetchBotConfig();
                }}
                disabled={activeTab === "metrics" ? loading : activeTab === "cms" ? cmsLoading : botLoading}
                className="rounded-md border border-[#d5ceb6] bg-white px-2.5 py-1 text-xs font-semibold text-[#1c2c26] hover:bg-[#f7f6f2] disabled:opacity-50"
              >
                {(activeTab === "metrics" ? loading : activeTab === "cms" ? cmsLoading : botLoading) ? "Menyegarkan..." : "Segarkan"}
              </button>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                className="rounded-md border border-[#e8c4c4] bg-[#fdf5f5] px-2.5 py-1 text-xs font-bold text-[#b93838] hover:bg-[#fae6e6]"
              >
                Keluar ({userEmail?.split("@")[0] || "Admin"})
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <nav className="flex space-x-6 border-t border-[#f0ece1] text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("metrics")}
              className={`py-3 border-b-2 transition ${
                activeTab === "metrics"
                  ? "border-[#173d31] text-[#173d31]"
                  : "border-transparent text-[#6e7e76] hover:text-[#173d31]"
              }`}
            >
              1. Ikhtisar & Metrik Partisipan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cms")}
              className={`py-3 border-b-2 transition ${
                activeTab === "cms"
                  ? "border-[#173d31] text-[#173d31]"
                  : "border-transparent text-[#6e7e76] hover:text-[#173d31]"
              }`}
            >
              2. Kelola Materi Edukasi (CMS)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bot")}
              className={`py-3 border-b-2 transition ${
                activeTab === "bot"
                  ? "border-[#173d31] text-[#173d31]"
                  : "border-transparent text-[#6e7e76] hover:text-[#173d31]"
              }`}
            >
              3. Konfigurasi AI & Chatbot
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("export")}
              className={`py-3 border-b-2 transition ${
                activeTab === "export"
                  ? "border-[#173d31] text-[#173d31]"
                  : "border-transparent text-[#6e7e76] hover:text-[#173d31]"
              }`}
            >
              4. Ekspor Dataset Riset
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === "metrics" && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-lg border border-[#e2dec9] bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6e7e76]">
                  Partisipan Terdaftar
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#173d31]">{data?.metrics.totalChildren ?? 0}</span>
                  <span className="text-xs text-[#6e7e76]">anak</span>
                </div>
                <p className="mt-1.5 text-[11px] text-[#6e7e76]">
                  Terhubung ke {data?.metrics.totalGuardians ?? 0} akun wali
                </p>
              </div>

              <div className="rounded-lg border border-[#e2dec9] bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6e7e76]">
                  Konsumsi Air Putih
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#173d31]">{data?.metrics.totalWaterGlasses ?? 0}</span>
                  <span className="text-xs text-[#6e7e76]">gelas</span>
                </div>
                <p className="mt-1.5 text-[11px] text-[#6e7e76]">
                  Rerata: {data?.metrics.averageWaterGlasses ?? 0} gelas/hari
                </p>
              </div>

              <div className="rounded-lg border border-[#e2dec9] bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6e7e76]">
                  Menit Aktivitas Fisik
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#173d31]">{data?.metrics.totalActivityMinutes ?? 0}</span>
                  <span className="text-xs text-[#6e7e76]">menit</span>
                </div>
                <p className="mt-1.5 text-[11px] text-[#6e7e76]">
                  Rerata: {data?.metrics.averageActivityMinutes ?? 0} mnt/hari
                </p>
              </div>

              <div className="rounded-lg border border-[#e2dec9] bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6e7e76]">
                  Dialog Edukasi AI
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#173d31]">{data?.metrics.totalChatMessages ?? 0}</span>
                  <span className="text-xs text-[#6e7e76]">pesan</span>
                </div>
                <p className="mt-1.5 text-[11px] text-[#6e7e76]">
                  Total {data?.metrics.totalChatSessions ?? 0} sesi interaktif
                </p>
              </div>
            </div>

            {/* Split Section: Diet Distribution and Recent Activity Table */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Diet Breakdown Card */}
              <div className="rounded-lg border border-[#e2dec9] bg-white p-5 lg:col-span-1">
                <div className="flex items-center justify-between border-b border-[#f0ece1] pb-3">
                  <h2 className="text-sm font-black text-[#173d31]">Distribusi Pilihan Makanan</h2>
                  <span className="text-xs font-semibold text-[#6e7e76]">{foodTotal} entri</span>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#1e6f47]">Sayur / Buah (Seimbang)</span>
                      <span>{balancedCount} ({Math.round((balancedCount / foodTotal) * 100)}%)</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-[#f0ece1] overflow-hidden">
                      <div className="h-full bg-[#247a4d]" style={{ width: `${Math.round((balancedCount / foodTotal) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#a46e16]">Makanan / Minuman Manis</span>
                      <span>{sweetCount} ({Math.round((sweetCount / foodTotal) * 100)}%)</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-[#f0ece1] overflow-hidden">
                      <div className="h-full bg-[#f4b942]" style={{ width: `${Math.round((sweetCount / foodTotal) * 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#a8442b]">Makanan Gorengan / Olahan</span>
                      <span>{friedCount} ({Math.round((friedCount / foodTotal) * 100)}%)</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-[#f0ece1] overflow-hidden">
                      <div className="h-full bg-[#ef6a55]" style={{ width: `${Math.round((friedCount / foodTotal) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                <p className="mt-6 border-t border-[#f0ece1] pt-3 text-[11px] text-[#6e7e76] leading-relaxed">
                  Data dikumpulkan melalui jurnal harian mandiri anak pada petualangan Dapur Warna di aplikasi.
                </p>
              </div>

              {/* Recent Activity Table */}
              <div className="rounded-lg border border-[#e2dec9] bg-white p-5 lg:col-span-2">
                <div className="flex items-center justify-between border-b border-[#f0ece1] pb-3">
                  <h2 className="text-sm font-black text-[#173d31]">Log Catatan Harian Terbaru</h2>
                  <span className="text-xs font-semibold text-[#6e7e76]">10 aktivitas terakhir</span>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#e2dec9] text-[#6e7e76] font-bold">
                        <th className="py-2.5">Tanggal</th>
                        <th className="py-2.5">Nama Panggilan</th>
                        <th className="py-2.5 text-center">Air Putih</th>
                        <th className="py-2.5 text-center">Aktivitas</th>
                        <th className="py-2.5 text-center">XP</th>
                        <th className="py-2.5 text-center">Streak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0ece1]">
                      {data && data.recentActivity.length > 0 ? (
                        data.recentActivity.map((row) => (
                          <tr key={row.id} className="hover:bg-[#faf9f5]">
                            <td className="py-2.5 font-mono text-[#5a6d64]">{row.date}</td>
                            <td className="py-2.5 font-bold text-[#173d31]">{row.childName}</td>
                            <td className="py-2.5 text-center text-[#236886]">{row.waterGlasses} gelas</td>
                            <td className="py-2.5 text-center text-[#9b581c]">{row.activityMinutes} mnt</td>
                            <td className="py-2.5 text-center font-bold text-[#1e6f47]">+{row.xp}</td>
                            <td className="py-2.5 text-center text-[#6e7e76]">{row.streak} hari</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-[#6e7e76]">
                            Belum ada entri aktivitas yang disinkronkan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "cms" && (
          <div className="space-y-8">
            {/* Section 1: Challenges */}
            <div className="rounded-lg border border-[#e2dec9] bg-white p-5">
              <div className="flex items-center justify-between border-b border-[#f0ece1] pb-3">
                <div>
                  <h2 className="text-sm font-black text-[#173d31]">Tantangan Harian (Misi Utama)</h2>
                  <p className="text-xs text-[#6e7e76]">Misi yang aktif ditampilkan di Bukit Tantangan pada aplikasi anak.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddChallenge(!showAddChallenge)}
                  className="rounded-md bg-[#173d31] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#255243]"
                >
                  {showAddChallenge ? "Batal" : "+ Tambah Tantangan"}
                </button>
              </div>

              {showAddChallenge && (
                <form onSubmit={handleAddChallenge} className="mt-4 rounded-md border border-[#d5ceb6] bg-[#f9f8f4] p-3 text-xs">
                  <div className="grid gap-2 sm:grid-cols-[1.5fr_2fr_80px_auto]">
                    <input
                      type="text"
                      required
                      placeholder="Judul (mis: Misi Warna Piring)"
                      value={newChallenge.title}
                      onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                      className="rounded border border-[#d5ceb6] bg-white px-2.5 py-1.5 outline-none font-medium"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Deskripsi misi untuk anak"
                      value={newChallenge.description}
                      onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                      className="rounded border border-[#d5ceb6] bg-white px-2.5 py-1.5 outline-none font-medium"
                    />
                    <input
                      type="number"
                      required
                      placeholder="XP"
                      value={newChallenge.xp}
                      onChange={(e) => setNewChallenge({ ...newChallenge, xp: Number(e.target.value) })}
                      className="rounded border border-[#d5ceb6] bg-white px-2.5 py-1.5 outline-none font-medium"
                    />
                    <button type="submit" className="rounded bg-[#173d31] px-3 py-1.5 font-bold text-white hover:bg-[#255243]">
                      Simpan
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e2dec9] text-[#6e7e76] font-bold">
                      <th className="py-2">Status</th>
                      <th className="py-2">Judul Misi</th>
                      <th className="py-2">Deskripsi</th>
                      <th className="py-2 text-center">Reward</th>
                      <th className="py-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0ece1]">
                    {challenges.map((c) => (
                      <tr key={c.id} className="hover:bg-[#faf9f5]">
                        <td className="py-2.5">
                          {c.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded bg-[#e8f3ed] px-2 py-0.5 font-bold text-[#1e6f47]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#1e6f47]" /> Aktif
                            </span>
                          ) : (
                            <span className="rounded bg-[#f0ece1] px-2 py-0.5 text-[#6e7e76]">Non-aktif</span>
                          )}
                        </td>
                        <td className="py-2.5 font-bold text-[#173d31]">{c.title}</td>
                        <td className="py-2.5 text-[#5a6d64]">{c.description}</td>
                        <td className="py-2.5 text-center font-bold text-[#a46e16]">+{c.xp} XP</td>
                        <td className="py-2.5 text-right space-x-2">
                          {!c.isActive && (
                            <button
                              type="button"
                              onClick={() => handleToggle("challenge", c.id, true)}
                              className="rounded border border-[#d5ceb6] px-2 py-0.5 font-semibold text-[#173d31] hover:bg-[#f0ece1]"
                            >
                              Jadikan Aktif
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete("challenge", c.id)}
                            className="text-[#b93838] hover:underline"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Quizzes */}
            <div className="rounded-lg border border-[#e2dec9] bg-white p-5">
              <div className="flex items-center justify-between border-b border-[#f0ece1] pb-3">
                <div>
                  <h2 className="text-sm font-black text-[#173d31]">Kuis Pengetahuan Gizi & Kesehatan</h2>
                  <p className="text-xs text-[#6e7e76]">Kuis aktif yang muncul di aplikasi anak.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddQuiz(!showAddQuiz)}
                  className="rounded-md bg-[#173d31] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#255243]"
                >
                  {showAddQuiz ? "Batal" : "+ Tambah Kuis"}
                </button>
              </div>

              {showAddQuiz && (
                <form onSubmit={handleAddQuiz} className="mt-4 rounded-md border border-[#d5ceb6] bg-[#f9f8f4] p-3 text-xs">
                  <div className="grid gap-2 sm:grid-cols-[2fr_1.5fr_1fr_70px_auto]">
                    <input
                      type="text"
                      required
                      placeholder="Pertanyaan kuis"
                      value={newQuiz.question}
                      onChange={(e) => setNewQuiz({ ...newQuiz, question: e.target.value })}
                      className="rounded border border-[#d5ceb6] bg-white px-2.5 py-1.5 outline-none font-medium"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Opsi (pisahkan koma)"
                      value={newQuiz.options}
                      onChange={(e) => setNewQuiz({ ...newQuiz, options: e.target.value })}
                      className="rounded border border-[#d5ceb6] bg-white px-2.5 py-1.5 outline-none font-medium"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Kunci jawaban"
                      value={newQuiz.answer}
                      onChange={(e) => setNewQuiz({ ...newQuiz, answer: e.target.value })}
                      className="rounded border border-[#d5ceb6] bg-white px-2.5 py-1.5 outline-none font-medium"
                    />
                    <input
                      type="number"
                      required
                      placeholder="XP"
                      value={newQuiz.xp}
                      onChange={(e) => setNewQuiz({ ...newQuiz, xp: Number(e.target.value) })}
                      className="rounded border border-[#d5ceb6] bg-white px-2.5 py-1.5 outline-none font-medium"
                    />
                    <button type="submit" className="rounded bg-[#173d31] px-3 py-1.5 font-bold text-white hover:bg-[#255243]">
                      Simpan
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e2dec9] text-[#6e7e76] font-bold">
                      <th className="py-2">Status</th>
                      <th className="py-2">Pertanyaan</th>
                      <th className="py-2">Pilihan Opsi</th>
                      <th className="py-2">Kunci Jawaban</th>
                      <th className="py-2 text-center">XP</th>
                      <th className="py-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0ece1]">
                    {quizzes.map((q) => (
                      <tr key={q.id} className="hover:bg-[#faf9f5]">
                        <td className="py-2.5">
                          {q.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded bg-[#e8f3ed] px-2 py-0.5 font-bold text-[#1e6f47]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#1e6f47]" /> Aktif
                            </span>
                          ) : (
                            <span className="rounded bg-[#f0ece1] px-2 py-0.5 text-[#6e7e76]">Non-aktif</span>
                          )}
                        </td>
                        <td className="py-2.5 font-bold text-[#173d31]">{q.question}</td>
                        <td className="py-2.5 text-[#5a6d64]">{q.options.join(" • ")}</td>
                        <td className="py-2.5 font-semibold text-[#1e6f47]">{q.answer}</td>
                        <td className="py-2.5 text-center font-bold text-[#a46e16]">+{q.xp}</td>
                        <td className="py-2.5 text-right space-x-2">
                          {!q.isActive && (
                            <button
                              type="button"
                              onClick={() => handleToggle("quiz", q.id, true)}
                              className="rounded border border-[#d5ceb6] px-2 py-0.5 font-semibold text-[#173d31] hover:bg-[#f0ece1]"
                            >
                              Jadikan Aktif
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete("quiz", q.id)}
                            className="text-[#b93838] hover:underline"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Menus */}
            <div className="rounded-lg border border-[#e2dec9] bg-white p-5">
              <div className="flex items-center justify-between border-b border-[#f0ece1] pb-3">
                <div>
                  <h2 className="text-sm font-black text-[#173d31]">Inspirasi Menu Makan Sehat Keluarga</h2>
                  <p className="text-xs text-[#6e7e76]">Daftar menu rekomendasi yang tampil di Ringkasan Orang Tua.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="rounded-md bg-[#173d31] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#255243]"
                >
                  {showAddMenu ? "Batal" : "+ Tambah Menu"}
                </button>
              </div>

              {showAddMenu && (
                <form onSubmit={handleAddMenu} className="mt-4 rounded-md border border-[#d5ceb6] bg-[#f9f8f4] p-3 text-xs">
                  <div className="grid gap-2 sm:grid-cols-[1.5fr_2fr_auto]">
                    <input
                      type="text"
                      required
                      placeholder="Nama menu (mis: Sayur Bening Bayam & Tempe)"
                      value={newMenu.title}
                      onChange={(e) => setNewMenu({ ...newMenu, title: e.target.value })}
                      className="rounded border border-[#d5ceb6] bg-white px-2.5 py-1.5 outline-none font-medium"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Catatan gizi & porsi seimbang"
                      value={newMenu.note}
                      onChange={(e) => setNewMenu({ ...newMenu, note: e.target.value })}
                      className="rounded border border-[#d5ceb6] bg-white px-2.5 py-1.5 outline-none font-medium"
                    />
                    <button type="submit" className="rounded bg-[#173d31] px-3 py-1.5 font-bold text-white hover:bg-[#255243]">
                      Simpan
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e2dec9] text-[#6e7e76] font-bold">
                      <th className="py-2">No</th>
                      <th className="py-2">Menu Masakan</th>
                      <th className="py-2">Catatan Edukasi Gizi</th>
                      <th className="py-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0ece1]">
                    {menus.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-[#faf9f5]">
                        <td className="py-2.5 font-mono text-[#6e7e76]">{idx + 1}</td>
                        <td className="py-2.5 font-bold text-[#173d31]">{m.title}</td>
                        <td className="py-2.5 text-[#5a6d64]">{m.note}</td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete("menu", m.id)}
                            className="text-[#b93838] hover:underline"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "bot" && (
          <div className="space-y-6 max-w-5xl">
            {/* Header / Overview card */}
            <div className="rounded-lg border border-[#e2dec9] bg-white p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2">
                    <span className="font-bold text-sm text-[#173d31]">Mesin Kecerdasan Buatan (LLM Engine)</span>
                    {botConfig.isDbOverride ? (
                      <span className="rounded bg-[#e8f3ed] px-2 py-0.5 text-[11px] font-bold text-[#1e6f47]">
                        ● Database Override Aktif
                      </span>
                    ) : (
                      <span className="rounded bg-[#f9f2e3] px-2 py-0.5 text-[11px] font-bold text-[#9d6e18]">
                        ● Fallback Lingkungan (.env)
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#5a6d64] leading-relaxed">
                    Kalibrasi provider, kredensial model, dan konteks (*scope persona*) chatbot edukasi anak secara langsung tanpa perlu redeploy.
                  </p>
                </div>
                <div className="rounded border border-[#e2dec9] bg-[#faf9f5] px-3 py-1.5 text-[11px] font-medium text-[#5a6d64] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Guardrail Keamanan Medis: <strong>Terkunci (Hard Filter)</strong></span>
                </div>
              </div>
            </div>

            {botSaveStatus && (
              <div className={`rounded-md p-3 text-xs font-bold border ${botSaveStatus.startsWith("Error") ? "bg-[#fdf2f2] border-[#f4b8b8] text-[#9b2c2c]" : "bg-[#edf7ed] border-[#c2e4c2] text-[#1e6f47]"}`}>
                {botSaveStatus}
              </div>
            )}

            <form onSubmit={handleSaveBotConfig} className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
                {/* Left Card: Provider, Model, & Credentials */}
                <div className="rounded-lg border border-[#e2dec9] bg-white p-5 space-y-4 text-xs">
                  <h3 className="font-bold text-sm text-[#173d31] border-b border-[#f0ece1] pb-2">
                    1. Model & Kredensial Akses
                  </h3>

                  <div>
                    <label className="block font-bold text-[#173d31] mb-1">
                      Pilihan Model LLM
                    </label>
                    <select
                      value={["gpt-4o-mini", "gpt-4o", "gemini-1.5-flash", "deepseek-chat"].includes(botConfig.model) ? botConfig.model : "custom"}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== "custom") {
                          setBotConfig({ ...botConfig, model: val });
                        }
                      }}
                      className="w-full rounded border border-[#d5ceb6] bg-white px-2.5 py-2 font-mono text-xs text-[#1c2c26] outline-none"
                    >
                      <option value="gpt-4o-mini">gpt-4o-mini (OpenAI / Rekomendasi Cepat & Murah)</option>
                      <option value="gpt-4o">gpt-4o (OpenAI / Penalaran Tertinggi)</option>
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Google Gemini / OpenAI Proxy)</option>
                      <option value="deepseek-chat">deepseek-chat (DeepSeek V3 / Efisiensi Tinggi)</option>
                      <option value="custom">Model Kustom (Tentukan Nama Sendiri)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#173d31] mb-1">
                      Nama Model Spesifik
                    </label>
                    <input
                      type="text"
                      required
                      value={botConfig.model}
                      onChange={(e) => setBotConfig({ ...botConfig, model: e.target.value })}
                      placeholder="misal: gpt-4o-mini atau meta-llama/llama-3.3-70b-instruct"
                      className="w-full rounded border border-[#d5ceb6] bg-white px-2.5 py-1.5 font-mono text-xs text-[#1c2c26] outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#173d31]">
                        API Base URL (Endpoint OpenAI-Compatible)
                      </label>
                      <button
                        type="button"
                        onClick={() => setBotConfig({ ...botConfig, baseUrl: "https://api.openai.com/v1" })}
                        className="text-[10px] text-[#247a4d] hover:underline"
                      >
                        Set Default OpenAI
                      </button>
                    </div>
                    <input
                      type="text"
                      value={botConfig.baseUrl}
                      onChange={(e) => setBotConfig({ ...botConfig, baseUrl: e.target.value })}
                      placeholder="https://api.openai.com/v1 (atau proxy kustom)"
                      className="w-full rounded border border-[#d5ceb6] bg-white px-2.5 py-1.5 font-mono text-xs text-[#1c2c26] outline-none"
                    />
                    <p className="mt-1 text-[11px] text-[#6e7e76]">
                      Bisa diisi endpoint OpenAI resmi, OpenRouter, Groq, atau server Ollama/vLLM lokal.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-[#173d31]">
                        API Secret Key
                      </label>
                      {botConfig.isApiKeySet && (
                        <span className="rounded bg-[#e8f3ed] px-1.5 py-0.5 text-[10px] font-bold text-[#1e6f47]">
                          Tersimpan: {botConfig.maskedApiKey}
                        </span>
                      )}
                    </div>
                    <input
                      type="password"
                      value={botConfig.apiKeyInput}
                      onChange={(e) => setBotConfig({ ...botConfig, apiKeyInput: e.target.value })}
                      placeholder={botConfig.isApiKeySet ? "Ketik untuk mengganti API key yang tersimpan..." : "sk-proj-..."}
                      className="w-full rounded border border-[#d5ceb6] bg-white px-2.5 py-1.5 font-mono text-xs text-[#1c2c26] outline-none"
                    />
                    <p className="mt-1 text-[11px] text-[#6e7e76]">
                      Kosongkan bila ingin mempertahankan kunci yang sudah tersimpan atau memakai <code>AI_API_KEY</code> dari <code>.env</code>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#f0ece1]">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-[#173d31]">Temperature</label>
                        <span className="font-mono text-[11px] font-bold text-[#173d31]">{botConfig.temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={botConfig.temperature}
                        onChange={(e) => setBotConfig({ ...botConfig, temperature: parseFloat(e.target.value) })}
                        className="w-full accent-[#173d31]"
                      />
                      <span className="text-[10px] text-[#6e7e76]">
                        {botConfig.temperature <= 0.3 ? "Konsisten / Ketat" : botConfig.temperature <= 0.7 ? "Seimbang Edukatif" : "Sangat Kreatif"}
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold text-[#173d31] mb-1">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="2000"
                        value={botConfig.maxTokens}
                        onChange={(e) => setBotConfig({ ...botConfig, maxTokens: parseInt(e.target.value) || 300 })}
                        className="w-full rounded border border-[#d5ceb6] bg-white px-2.5 py-1 font-mono text-xs text-[#1c2c26] outline-none"
                      />
                      <span className="text-[10px] text-[#6e7e76]">Panjang respon maksimal</span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Context / Scope (System Prompt) */}
                <div className="rounded-lg border border-[#e2dec9] bg-white p-5 space-y-3 text-xs flex flex-col">
                  <div className="flex items-center justify-between border-b border-[#f0ece1] pb-2">
                    <h3 className="font-bold text-sm text-[#173d31]">
                      2. Konteks & Batasan Persona (System Prompt)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setBotConfig({ ...botConfig, systemPrompt: DEFAULT_SYSTEM_PROMPT })}
                      className="text-[11px] text-[#247a4d] hover:underline font-bold"
                    >
                      Reset ke Template Standar
                    </button>
                  </div>

                  <p className="text-[11px] text-[#5a6d64]">
                    Panduan instruksi utama yang diterima model sebelum memproses pesan anak. Pastikan tetap menjaga batasan bahasa sederhana, ramah, dan bebas diagnosa penyakit.
                  </p>

                  <textarea
                    rows={17}
                    value={botConfig.systemPrompt}
                    onChange={(e) => setBotConfig({ ...botConfig, systemPrompt: e.target.value })}
                    className="w-full flex-1 rounded border border-[#d5ceb6] bg-[#faf9f5] p-3 font-mono text-xs text-[#1c2c26] leading-relaxed outline-none"
                    placeholder="Instruksi sistem..."
                  />

                  <div className="flex items-center justify-between text-[11px] text-[#6e7e76] pt-1">
                    <span>Panjang karakter: {botConfig.systemPrompt.length} karakter</span>
                    <span>Estimasi token: ~{Math.round(botConfig.systemPrompt.length / 4)} token</span>
                  </div>
                </div>
              </div>

              {/* Action Save Button */}
              <div className="flex items-center justify-between border-t border-[#e2dec9] pt-4">
                <p className="text-xs text-[#5a6d64]">
                  Perubahan akan langsung berlaku pada seluruh percakapan anak di halaman <code>/chat</code>.
                </p>
                <button
                  type="submit"
                  disabled={botSaving}
                  className="rounded-md bg-[#173d31] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#255243] disabled:opacity-50 transition"
                >
                  {botSaving ? "Menyimpan Konfigurasi..." : "Simpan Konfigurasi Chatbot"}
                </button>
              </div>
            </form>

            {/* Test Sandbox / Playground Card */}
            <div className="rounded-lg border border-[#e2dec9] bg-white p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-[#f0ece1] pb-2">
                <div>
                  <h3 className="font-bold text-sm text-[#173d31]">
                    3. Laboratorium Uji Model (Playground Sandbox)
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[#5a6d64]">
                    Uji validitas koneksi, kecepatan latensi, dan kesesuaian gaya bahasa model sebelum atau sesudah disimpan.
                  </p>
                </div>
                {testResult?.latencyMs !== undefined && (
                  <span className="rounded bg-[#e8f3ed] px-2 py-0.5 text-xs font-mono font-bold text-[#1e6f47]">
                    Latensi: {testResult.latencyMs} ms
                  </span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="text"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="Ketik pertanyaan uji anak..."
                  className="rounded border border-[#d5ceb6] bg-white px-3 py-2 text-xs font-medium text-[#1c2c26] outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestBot}
                  disabled={testRunning || !testPrompt.trim()}
                  className="rounded bg-[#f4b942] px-4 py-2 text-xs font-bold text-[#173d31] hover:bg-[#e8ac33] disabled:opacity-50 transition"
                >
                  {testRunning ? "Menguji Respon..." : "Uji Respon Model"}
                </button>
              </div>

              {testResult && (
                <div className={`mt-3 rounded-md border p-3 ${testResult.error ? "bg-[#fdf2f2] border-[#f4b8b8]" : "bg-[#faf9f5] border-[#d5ceb6]"}`}>
                  {testResult.error ? (
                    <div className="text-[#9b2c2c]">
                      <span className="font-bold">Gagal terhubung ke model:</span>
                      <p className="mt-1 font-mono text-[11px]">{testResult.error}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[#6e7e76] border-b border-[#e2dec9] pb-1.5 mb-2">
                        <span>Model yang Merespon: <strong className="font-mono text-[#173d31]">{testResult.model}</strong></span>
                        <span>{testResult.isMock ? "Mode Offline Mock" : "Koneksi Live API"}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-[#173d31] font-medium whitespace-pre-wrap">
                        {testResult.reply}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "export" && (
          <div className="rounded-lg border border-[#e2dec9] bg-white p-6 max-w-4xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded bg-[#e8f3ed] px-2.5 py-1 text-xs font-bold text-[#1e6f47]">
                <span className="h-2 w-2 rounded-full bg-[#1e6f47]" />
                Protokol De-Identifikasi Riset Aktif
              </div>
              <h2 className="mt-3 text-base font-black text-[#173d31]">
                Ekspor Dataset Penelitian Teranonim
              </h2>
              <p className="mt-1.5 text-xs text-[#5a6d64] leading-relaxed">
                Seluruh identitas anak dan orang tua (nama, email, nomor kontak) secara otomatis dienkripsi dan digantikan dengan token acak unik (misal: <code>P-001-A7B2</code>). Data siap digunakan untuk evaluasi intervensi edukasi gaya hidup sehat dan analisis statistik pada software riset.
              </p>
            </div>

            <div className="rounded-md border border-[#e2dec9] bg-[#faf9f5] p-4 text-xs">
              <span className="font-bold text-[#173d31]">Variabel yang Tersedia di Dataset:</span>
              <ul className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-[#5a6d64]">
                <li>• participant_id</li>
                <li>• record_date</li>
                <li>• water_glasses</li>
                <li>• activity_minutes</li>
                <li>• xp_earned</li>
                <li>• active_streak</li>
                <li>• balanced_food_count</li>
                <li>• sweet_food_count</li>
                <li>• fried_food_count</li>
                <li>• lifetime_chat_messages</li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="/api/admin/export?format=csv"
                download="si_cehat_research_dataset.csv"
                className="inline-flex items-center gap-2 rounded-md bg-[#173d31] px-4 py-2 text-xs font-bold text-white hover:bg-[#255243]"
              >
                Unduh Dataset CSV (Excel, SPSS, Stata)
              </a>
              <a
                href="/api/admin/export?format=json"
                download="si_cehat_research_dataset.json"
                className="inline-flex items-center gap-2 rounded-md border border-[#d5ceb6] bg-white px-4 py-2 text-xs font-bold text-[#173d31] hover:bg-[#f7f6f2]"
              >
                Unduh Dataset JSON (Python, R)
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

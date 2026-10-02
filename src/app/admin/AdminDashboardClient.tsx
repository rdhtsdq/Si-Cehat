"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
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
    screening: {
      total: number;
      highRiskCount: number;
      mediumRiskCount: number;
      lowRiskCount: number;
      highRiskPercentage: number;
    };
    growth: {
      total: number;
      distribution: Record<string, number>;
    };
    nutrition: {
      totalLogs: number;
      averageCalories: number;
      averageCarbsGram: number;
    };
    consultations: {
      pending: number;
      active: number;
      completed: number;
      total: number;
    };
    content: {
      totalRecipes: number;
      totalArticles: number;
    };
  };
  highRiskAlerts: Array<{
    id: string;
    childName: string;
    childAge: number;
    childGender: string;
    guardianName: string;
    guardianPhone: string;
    riskScore: number;
    riskCategory: string;
    bmi: number;
    familyHistory: boolean;
    sweetDrinkFrequency: string;
    date: string;
  }>;
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

interface RecipeItem {
  id: string;
  title: string;
  category: "makanan" | "minuman" | "camilan";
  description: string;
  caloriesKkal: number;
  carbsGram: number;
  proteinGram: number;
  fatGram: number;
  fiberGram: number;
  sugarGram: number;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string | null;
  createdAt?: string;
}

interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  category: "artikel" | "makanan" | "video";
  readTimeMinutes: number;
  summary: string;
  content: string;
  videoUrl?: string | null;
  imageUrl?: string | null;
  publishedAt?: string;
}

interface ConsultationItem {
  id: string;
  guardianId: string;
  specialistType: "BIDAN" | "AHLI_GIZI" | "DOKTER";
  specialistName: string;
  status: "PENDING" | "ACTIVE" | "COMPLETED";
  topic: string;
  notes?: string | null;
  createdAt: string;
  guardian: {
    id: string;
    name?: string | null;
    email: string;
    phone?: string | null;
    education?: string | null;
    occupation?: string | null;
    address?: string | null;
    children: Array<{
      id: string;
      name: string;
      gender?: string | null;
      birthDate?: string | null;
    }>;
  };
}

interface FamilyItem {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  education?: string | null;
  occupation?: string | null;
  address?: string | null;
  createdAt: string;
  children: Array<{
    id: string;
    name: string;
    gender?: string | null;
    birthDate?: string | null;
    healthHistory?: string | null;
    screenings?: Array<{
      riskScore: number;
      riskCategory: string;
      createdAt: string;
    }>;
    growthMeasurements?: Array<{
      weightKg: number;
      heightCm: number;
      nutritionalStatus?: string | null;
      date: string;
    }>;
  }>;
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
  const [activeTab, setActiveTab] = useState<
    "metrics" | "recipes" | "education" | "consultations" | "families" | "cms" | "bot" | "export"
  >("metrics");

  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Recipes State
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState<string>("semua");
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [recipeForm, setRecipeForm] = useState({
    title: "",
    category: "makanan" as "makanan" | "minuman" | "camilan",
    description: "",
    caloriesKkal: 120,
    carbsGram: 18,
    proteinGram: 6,
    fatGram: 3,
    fiberGram: 4,
    sugarGram: 2,
    ingredientsText: "1 buah labu siam, potong dadu\n4 batang kacang panjang\n1 genggam daun melinjo",
    instructionsText: "Rebus air bersama bumbu rempah.\nMasukkan sayuran bertahap hingga empuk.\nSajikan hangat.",
    imageUrl: "",
  });

  // Education Articles State
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articleCategoryFilter, setArticleCategoryFilter] = useState<string>("semua");
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleForm, setArticleForm] = useState({
    title: "",
    slug: "",
    category: "artikel" as "artikel" | "makanan" | "video",
    readTimeMinutes: 3,
    summary: "",
    content: "",
    videoUrl: "",
    imageUrl: "",
  });

  // Consultations State
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [consultationsLoading, setConsultationsLoading] = useState(false);
  const [consultationStatusFilter, setConsultationStatusFilter] = useState<string>("ALL");
  const [activeConsultationModal, setActiveConsultationModal] = useState<ConsultationItem | null>(null);
  const [consultationNotes, setConsultationNotes] = useState("");
  const [consultationStatusUpdate, setConsultationStatusUpdate] = useState<"PENDING" | "ACTIVE" | "COMPLETED">("ACTIVE");

  // Families Registry State
  const [families, setFamilies] = useState<FamilyItem[]>([]);
  const [familiesLoading, setFamiliesLoading] = useState(false);
  const [familySearchQuery, setFamilySearchQuery] = useState("");

  // Gamification CMS States
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [showAddChallenge, setShowAddChallenge] = useState(false);
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newChallenge, setNewChallenge] = useState({ title: "", description: "", xp: 30 });
  const [newQuiz, setNewQuiz] = useState({ question: "", options: "Air putih, Soda, Boba", answer: "Air putih", xp: 20 });
  const [newMenu, setNewMenu] = useState({ title: "", note: "" });

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
  const [botSaving, setBotSaving] = useState(false);
  const [botSaveStatus, setBotSaveStatus] = useState<string | null>(null);

  // Playground States
  const [testPrompt, setTestPrompt] = useState("Halo Si Cehat! Kenapa kita harus makan sayur setiap hari?");
  const [testResult, setTestResult] = useState<{
    reply?: string;
    latencyMs?: number;
    isMock?: boolean;
    model?: string;
    error?: string;
  } | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  useEffect(() => {
    fetchMetrics();
    fetchCmsContent();
    fetchBotConfig();
    fetchRecipes();
    fetchArticles();
    fetchConsultations();
    fetchFamilies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fetchMetrics() {
    setLoading(true);
    fetch("/api/admin/metrics")
      .then((res) => res.json())
      .then((json) => {
        if (json.metrics) setData(json);
      })
      .catch((err) => console.error("Gagal memuat metrik", err))
      .finally(() => setLoading(false));
  }

  function fetchRecipes() {
    setRecipesLoading(true);
    fetch("/api/admin/recipes")
      .then((res) => res.json())
      .then((json) => {
        if (json.recipes) setRecipes(json.recipes);
      })
      .catch((err) => console.error("Gagal memuat resep", err))
      .finally(() => setRecipesLoading(false));
  }

  function fetchArticles() {
    setArticlesLoading(true);
    fetch("/api/admin/education")
      .then((res) => res.json())
      .then((json) => {
        if (json.articles) setArticles(json.articles);
      })
      .catch((err) => console.error("Gagal memuat artikel", err))
      .finally(() => setArticlesLoading(false));
  }

  function fetchConsultations() {
    setConsultationsLoading(true);
    fetch("/api/admin/consultations?status=ALL")
      .then((res) => res.json())
      .then((json) => {
        if (json.consultations) setConsultations(json.consultations);
      })
      .catch((err) => console.error("Gagal memuat konsultasi", err))
      .finally(() => setConsultationsLoading(false));
  }

  function fetchFamilies() {
    setFamiliesLoading(true);
    fetch(`/api/admin/families?search=${encodeURIComponent(familySearchQuery)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.families) setFamilies(json.families);
      })
      .catch((err) => console.error("Gagal memuat direktori keluarga", err))
      .finally(() => setFamiliesLoading(false));
  }

  function fetchCmsContent() {
    fetch("/api/admin/content")
      .then((res) => res.json())
      .then((json) => {
        if (json.challenges) setChallenges(json.challenges);
        if (json.quizzes) setQuizzes(json.quizzes);
        if (json.menus) setMenus(json.menus);
      })
      .catch((err) => console.error("Gagal memuat konten CMS", err));
  }

  function fetchBotConfig() {
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
      .catch((err) => console.error("Gagal memuat konfigurasi bot", err));
  }

  // Recipe Handlers
  async function handleSaveRecipe(e: React.FormEvent) {
    e.preventDefault();
    if (!recipeForm.title.trim()) return;

    const ingredients = recipeForm.ingredientsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const instructions = recipeForm.instructionsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: recipeForm.title,
      category: recipeForm.category,
      description: recipeForm.description,
      caloriesKkal: Number(recipeForm.caloriesKkal),
      carbsGram: Number(recipeForm.carbsGram),
      proteinGram: Number(recipeForm.proteinGram),
      fatGram: Number(recipeForm.fatGram),
      fiberGram: Number(recipeForm.fiberGram),
      sugarGram: Number(recipeForm.sugarGram),
      ingredients,
      instructions,
      imageUrl: recipeForm.imageUrl.trim() || undefined,
    };

    const url = editingRecipeId ? `/api/admin/recipes/${editingRecipeId}` : "/api/admin/recipes";
    const method = editingRecipeId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowRecipeModal(false);
      setEditingRecipeId(null);
      fetchRecipes();
      fetchMetrics();
    } else {
      const err = await res.json();
      alert("Error: " + (err.error?.message || "Gagal menyimpan resep"));
    }
  }

  async function handleDeleteRecipe(id: string) {
    if (!confirm("Hapus resep sehat ini dari katalog?")) return;
    const res = await fetch(`/api/admin/recipes/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchRecipes();
      fetchMetrics();
    }
  }

  function openEditRecipe(r: RecipeItem) {
    setEditingRecipeId(r.id);
    setRecipeForm({
      title: r.title,
      category: r.category,
      description: r.description,
      caloriesKkal: r.caloriesKkal,
      carbsGram: r.carbsGram,
      proteinGram: r.proteinGram,
      fatGram: r.fatGram,
      fiberGram: r.fiberGram,
      sugarGram: r.sugarGram,
      ingredientsText: r.ingredients.join("\n"),
      instructionsText: r.instructions.join("\n"),
      imageUrl: r.imageUrl || "",
    });
    setShowRecipeModal(true);
  }

  // Article Handlers
  async function handleSaveArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!articleForm.title.trim()) return;

    const autoSlug = articleForm.slug.trim()
      ? articleForm.slug.trim().toLowerCase().replace(/\s+/g, "-")
      : articleForm.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const payload = {
      title: articleForm.title,
      slug: autoSlug,
      category: articleForm.category,
      readTimeMinutes: Number(articleForm.readTimeMinutes),
      summary: articleForm.summary,
      content: articleForm.content,
      videoUrl: articleForm.videoUrl.trim() || undefined,
      imageUrl: articleForm.imageUrl.trim() || undefined,
    };

    const url = editingArticleId ? `/api/admin/education/${editingArticleId}` : "/api/admin/education";
    const method = editingArticleId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowArticleModal(false);
      setEditingArticleId(null);
      fetchArticles();
      fetchMetrics();
    } else {
      const err = await res.json();
      alert("Error: " + (err.error?.message || "Gagal menyimpan materi edukasi"));
    }
  }

  async function handleDeleteArticle(id: string) {
    if (!confirm("Hapus materi edukasi ini?")) return;
    const res = await fetch(`/api/admin/education/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchArticles();
      fetchMetrics();
    }
  }

  function openEditArticle(a: ArticleItem) {
    setEditingArticleId(a.id);
    setArticleForm({
      title: a.title,
      slug: a.slug,
      category: a.category,
      readTimeMinutes: a.readTimeMinutes,
      summary: a.summary,
      content: a.content,
      videoUrl: a.videoUrl || "",
      imageUrl: a.imageUrl || "",
    });
    setShowArticleModal(true);
  }

  // Consultation Handlers
  async function handleUpdateConsultation(e: React.FormEvent) {
    e.preventDefault();
    if (!activeConsultationModal) return;

    const targetId = activeConsultationModal.id;
    const targetStatus = consultationStatusUpdate;
    const targetNotes = consultationNotes;

    const res = await fetch(`/api/admin/consultations/${targetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: targetStatus,
        notes: targetNotes,
      }),
    });

    if (res.ok) {
      setConsultations((prev) =>
        prev.map((c) =>
          c.id === targetId ? { ...c, status: targetStatus, notes: targetNotes } : c
        )
      );
      setActiveConsultationModal(null);
      fetchConsultations();
      fetchMetrics();
    } else {
      alert("Gagal memperbarui status konsultasi.");
    }
  }

  // Bot Config & Test Handlers
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
      if (!res.ok) throw new Error(json.error?.message || "Gagal menyimpan konfigurasi.");

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

  // Gamification Handlers
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
    const optionsArray = newQuiz.options.split(",").map((o) => o.trim()).filter(Boolean);
    await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "quiz",
        question: newQuiz.question,
        options: optionsArray,
        answer: newQuiz.answer.trim(),
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
    if (!newMenu.title) return;
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

  // Filtered Lists
  const filteredRecipes = useMemo(() => {
    if (recipeCategoryFilter === "semua") return recipes;
    return recipes.filter((r) => r.category.toLowerCase() === recipeCategoryFilter.toLowerCase());
  }, [recipes, recipeCategoryFilter]);

  const filteredArticles = useMemo(() => {
    if (articleCategoryFilter === "semua") return articles;
    return articles.filter((a) => a.category.toLowerCase() === articleCategoryFilter.toLowerCase());
  }, [articles, articleCategoryFilter]);

  const filteredConsultations = useMemo(() => {
    if (consultationStatusFilter === "ALL") return consultations;
    return consultations.filter((c) => c.status.toUpperCase() === consultationStatusFilter.toUpperCase());
  }, [consultations, consultationStatusFilter]);

  const foodTotal = useMemo(() => {
    if (!data) return 0;
    const dist = data.metrics.foodToneDistribution;
    return dist.balanced + dist.sweet + dist.fried + dist.unknown || 1;
  }, [data]);

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 antialiased overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif' }}
    >
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs overflow-x-clip [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand Logo & Title */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F5132] to-[#146C43] text-white shadow-xs group-hover:scale-102 transition-transform">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M2 12h20" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                      Si-Cehat
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      Surveilans
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Konsol Klinis & Posyandu Terpadu
                  </span>
                </div>
              </Link>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2">
              <Link
                href="/api-docs"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition"
              >
                <span>Dokumentasi API</span>
                <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </Link>

              <button
                type="button"
                onClick={() => {
                  fetchMetrics();
                  if (activeTab === "recipes") fetchRecipes();
                  if (activeTab === "education") fetchArticles();
                  if (activeTab === "consultations") fetchConsultations();
                  if (activeTab === "families") fetchFamilies();
                  if (activeTab === "cms") fetchCmsContent();
                  if (activeTab === "bot") fetchBotConfig();
                }}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition disabled:opacity-50"
              >
                <svg className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span className="hidden xs:inline">{loading ? "Menyegarkan..." : "Segarkan"}</span>
              </button>

              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs">
                  <div className="h-6 w-6 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-bold text-[10px]">
                    {(userEmail?.[0] || "A").toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-700 hidden md:inline">
                    {userEmail || "admin@sicehat.id"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/admin/login" })}
                  title="Keluar dari sesi"
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 shadow-xs transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <nav className="flex items-center flex-wrap gap-1.5 py-2 border-t border-slate-100 text-xs font-medium overflow-x-clip [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveTab("metrics")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "metrics"
                  ? "bg-[#0F5132] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              <span>Surveilans</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("recipes")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "recipes"
                  ? "bg-[#0F5132] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
              </svg>
              <span>Resep Sehat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("education")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "education"
                  ? "bg-[#0F5132] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
              </svg>
              <span>Pustaka Edukasi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("consultations")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "consultations"
                  ? "bg-[#0F5132] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Telekonsultasi</span>
              {(data?.metrics.consultations.pending || 0) > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === "consultations" ? "bg-rose-400 text-white" : "bg-rose-600 text-white"
                  }`}
                >
                  {data?.metrics.consultations.pending}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("families")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "families"
                  ? "bg-[#0F5132] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Direktori Keluarga</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("cms")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "cms"
                  ? "bg-[#0F5132] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
              <span>Misi & Kuis</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("bot")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "bot"
                  ? "bg-[#0F5132] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4M8 16h.01M16 16h.01" />
              </svg>
              <span>Bot AI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("export")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "export"
                  ? "bg-[#0F5132] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span>Ekspor Data</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* ========================================================= */}
        {/* TAB 1: SURVEILANS KLINIS & EARLY WARNING                  */}
        {/* ========================================================= */}
        {activeTab === "metrics" && (
          <div className="space-y-6">
            {/* Top Stat Cards Grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {/* Card 1: Partisipan */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-slate-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total Partisipan</span>
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">{data?.metrics.totalChildren ?? 0}</span>
                  <span className="text-xs font-medium text-slate-500">anak</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {data?.metrics.totalGuardians ?? 0} akun ibu / keluarga
                </p>
              </div>

              {/* Card 2: Skrining Risiko Tinggi */}
              <div className="rounded-xl border border-rose-200/90 bg-rose-50/20 p-4 shadow-xs hover:border-rose-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-800">Skrining Risiko Tinggi</span>
                  <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-rose-700">
                    {data?.metrics.screening?.highRiskCount ?? 0}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                    {data?.metrics.screening?.highRiskPercentage ?? 0}%
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-rose-700/80">
                  Dari {data?.metrics.screening?.total ?? 0} total skrining anak
                </p>
              </div>

              {/* Card 3: Kurva Gizi Normal */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-slate-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Status Gizi Normal (WHO)</span>
                  <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">
                    {data?.metrics.growth?.distribution["Gizi Baik (Normal)"] ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-500">anak</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Obesitas terdeteksi: {data?.metrics.growth?.distribution["Obesitas"] ?? 0} anak
                </p>
              </div>

              {/* Card 4: Rerata Kalori */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-slate-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Rerata Kalori Makanan</span>
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">
                    {data?.metrics.nutrition?.averageCalories ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-500">kkal/porsi</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {data?.metrics.nutrition?.totalLogs ?? 0} entri buku diary makan
                </p>
              </div>

              {/* Card 5: Konsultasi Medis */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-slate-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Konsultasi Medis Masuk</span>
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">
                    {data?.metrics.consultations?.total ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-500">tiket</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Antrean pending: {data?.metrics.consultations?.pending ?? 0} kasus
                </p>
              </div>
            </div>

            {/* Early Warning Alert Table */}
            <div className="rounded-xl border border-rose-200 bg-white overflow-hidden shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-rose-100 bg-rose-50/40 p-5 gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">
                        Papan Peringatan Dini: Skrining Anak Berisiko Tinggi Diabetes
                      </h2>
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200/60">
                        Prioritas Intervensi
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Daftar skrining klinis terbaru dengan skor risiko di atas ambang batas kritis yang memerlukan tindak lanjut rujukan medis atau Posyandu.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("families")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 shrink-0 self-start sm:self-auto"
                >
                  <span>Direktori Lengkap</span>
                  <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="overflow-x-auto">
                {data?.highRiskAlerts && data.highRiskAlerts.length > 0 ? (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Tanggal</th>
                        <th className="py-3 px-4 font-semibold">Nama Anak</th>
                        <th className="py-3 px-4 font-semibold">Usia / Gender</th>
                        <th className="py-3 px-4 font-semibold">Skor Risiko</th>
                        <th className="py-3 px-4 font-semibold">IMT (BMI)</th>
                        <th className="py-3 px-4 font-semibold">Faktor Kritis</th>
                        <th className="py-3 px-4 font-semibold">Ibu / Wali</th>
                        <th className="py-3 px-4 font-semibold text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.highRiskAlerts.map((alert) => (
                        <tr key={alert.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{alert.date}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{alert.childName}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {alert.childAge} thn ({alert.childGender === "L" || alert.childGender === "MALE" ? "Laki-laki" : "Perempuan"})
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                              {alert.riskScore}% TINGGI
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">{alert.bmi}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {alert.familyHistory && <span className="block">• Riwayat Diabetes Keluarga</span>}
                            {alert.sweetDrinkFrequency === "sering" && <span className="block">• Minuman Manis: Sering</span>}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">{alert.guardianName}</td>
                          <td className="py-3 px-4 text-right">
                            {alert.guardianPhone && alert.guardianPhone !== "-" ? (
                              <a
                                href={`https://wa.me/${alert.guardianPhone.replace(/[^0-9]/g, "")}?text=Halo%20Ibu%20${encodeURIComponent(alert.guardianName)},%20kami%20dari%20tim%20kesehatan%20Si-Cehat...`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zM12 20.35c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.3 8.3 0 0 1-1.27-4.49c0-4.6 3.74-8.34 8.34-8.34 2.23 0 4.32.87 5.9 2.44a8.27 8.27 0 0 1 2.45 5.9c0 4.6-3.74 8.35-8.35 8.35zm4.57-6.24c-.25-.13-1.48-.73-1.71-.81-.23-.09-.4-.13-.57.13-.17.25-.66.81-.81.98-.15.17-.3.19-.55.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.3.38-.44.12-.15.17-.25.25-.42.08-.17.04-.32-.02-.45s-.57-1.37-.78-1.88c-.2-.49-.41-.43-.57-.44h-.49c-.17 0-.45.06-.69.32-.23.25-.9.88-.9 2.15 0 1.26.92 2.49 1.05 2.66.13.17 1.81 2.77 4.39 3.88.61.27 1.09.43 1.46.55.62.2 1.18.17 1.63.1.5-.07 1.48-.61 1.69-1.2.21-.58.21-1.08.15-1.2-.06-.11-.23-.17-.48-.3z" />
                                </svg>
                                <span>Hubungi Ibu</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center py-8 text-xs text-slate-500">
                    Tidak ada kasus risiko tinggi baru yang terdeteksi saat ini.
                  </p>
                )}
              </div>
            </div>

            {/* Split Section: WHO Growth Distribution and Food Choices */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* WHO Growth Curve Distribution */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900">Status Gizi Populasi Anak (WHO)</h2>
                  <span className="text-xs font-medium text-slate-500">
                    {data?.metrics.growth?.total ?? 0} pengukuran
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  {Object.entries(data?.metrics.growth?.distribution || {}).map(([status, count]) => {
                    const totalGrowth = data?.metrics.growth?.total || 1;
                    const pct = Math.round((count / totalGrowth) * 100);
                    const colorClass =
                      status === "Gizi Baik (Normal)"
                        ? "bg-emerald-500"
                        : status === "Obesitas"
                        ? "bg-rose-500"
                        : status === "Berisiko Gizi Lebih"
                        ? "bg-amber-500"
                        : "bg-blue-500";
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <span>{status}</span>
                          <span className="font-semibold text-slate-900">{count} anak ({pct}%)</span>
                        </div>
                        <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${colorClass}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Diet Breakdown Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-900">Distribusi Pilihan Makanan Anak</h2>
                  <span className="text-xs font-medium text-slate-500">{foodTotal} entri</span>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span className="text-emerald-700 font-semibold">Sayur / Buah (Seimbang)</span>
                      <span className="font-semibold text-slate-900">
                        {data?.metrics.foodToneDistribution.balanced ?? 0} (
                        {Math.round(((data?.metrics.foodToneDistribution.balanced ?? 0) / foodTotal) * 100)}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600"
                        style={{
                          width: `${Math.round(((data?.metrics.foodToneDistribution.balanced ?? 0) / foodTotal) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span className="text-rose-700 font-semibold">Manis / Tinggi Gula</span>
                      <span className="font-semibold text-slate-900">
                        {data?.metrics.foodToneDistribution.sweet ?? 0} (
                        {Math.round(((data?.metrics.foodToneDistribution.sweet ?? 0) / foodTotal) * 100)}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-rose-500"
                        style={{
                          width: `${Math.round(((data?.metrics.foodToneDistribution.sweet ?? 0) / foodTotal) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span className="text-amber-700 font-semibold">Gorengan / Minyak</span>
                      <span className="font-semibold text-slate-900">
                        {data?.metrics.foodToneDistribution.fried ?? 0} (
                        {Math.round(((data?.metrics.foodToneDistribution.fried ?? 0) / foodTotal) * 100)}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{
                          width: `${Math.round(((data?.metrics.foodToneDistribution.fried ?? 0) / foodTotal) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Progress Log Table */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Riwayat Aktivitas & Konsumsi Air Terkini
              </h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Tanggal</th>
                      <th className="py-2.5 px-3 font-semibold">Nama Partisipan</th>
                      <th className="py-2.5 px-3 font-semibold">Konsumsi Air</th>
                      <th className="py-2.5 px-3 font-semibold">Aktivitas Fisik</th>
                      <th className="py-2.5 px-3 font-semibold">Poin XP</th>
                      <th className="py-2.5 px-3 font-semibold">Konsistensi (Streak)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.recentActivity && data.recentActivity.length > 0 ? (
                      data.recentActivity.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-mono text-slate-500">{r.date}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{r.childName}</td>
                          <td className="py-2.5 px-3 text-slate-700">{r.waterGlasses} gelas</td>
                          <td className="py-2.5 px-3 text-slate-700">{r.activityMinutes} menit</td>
                          <td className="py-2.5 px-3 font-bold text-amber-600">+{r.xp} XP</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                              {r.streak} hari berturut-turut
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          Belum ada aktivitas tercatat hari ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CMS RESEP TRADISIONAL SEHAT                        */}
        {/* ========================================================= */}
        {activeTab === "recipes" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
              <div>
                <h1 className="text-xl font-black text-[#0F5132]">Katalog Resep Tradisional Sehat Nusantara</h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Kurasi resep kuliner nusantara rendah gula, tinggi serat, dan ramah pencegahan diabetes untuk keluarga.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-md border border-[#CBD5E1] bg-white p-0.5 text-xs font-semibold">
                  {["semua", "makanan", "minuman", "camilan"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setRecipeCategoryFilter(cat)}
                      className={`px-3 py-1 rounded text-xs capitalize transition ${
                        recipeCategoryFilter === cat ? "bg-[#0F5132] text-white" : "text-[#64748B] hover:text-black"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setEditingRecipeId(null);
                    setRecipeForm({
                      title: "",
                      category: "makanan",
                      description: "",
                      caloriesKkal: 150,
                      carbsGram: 20,
                      proteinGram: 8,
                      fatGram: 4,
                      fiberGram: 4,
                      sugarGram: 2,
                      ingredientsText: "",
                      instructionsText: "",
                      imageUrl: "",
                    });
                    setShowRecipeModal(true);
                  }}
                  className="rounded-md bg-[#0F5132] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#146C43] shadow-xs flex items-center gap-1.5"
                >
                  <span>+ Tambah Resep</span>
                </button>
              </div>
            </div>

            {/* Recipes Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRecipes.map((r) => (
                <div key={r.id} className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                        {r.category}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#0F5132]">
                        {r.caloriesKkal} kkal
                      </span>
                    </div>

                    <h3 className="mt-2 text-base font-bold text-[#0F172A]">{r.title}</h3>
                    <p className="mt-1 text-xs text-[#64748B] line-clamp-2">{r.description}</p>

                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono">
                      <span className="rounded bg-rose-50 px-2 py-0.5 text-rose-700 border border-rose-200">
                        Gula: {r.sugarGram}g
                      </span>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-700 border border-blue-200">
                        Karbo: {r.carbsGram}g
                      </span>
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-700 border border-amber-200">
                        Protein: {r.proteinGram}g
                      </span>
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-200">
                        Serat: {r.fiberGram}g
                      </span>
                    </div>

                    <div className="mt-3 text-[11px] text-[#64748B] border-t border-[#F1F5F9] pt-2">
                      <p className="font-semibold text-[#0F172A]">Bahan ({r.ingredients.length}):</p>
                      <p className="truncate">{r.ingredients.join(", ")}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#F1F5F9] pt-3">
                    <button
                      onClick={() => openEditRecipe(r)}
                      className="rounded border border-[#CBD5E1] px-2.5 py-1 text-xs font-bold text-[#0F5132] hover:bg-[#F8FAFC]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRecipe(r.id)}
                      className="rounded border border-[#E8C4C4] px-2.5 py-1 text-xs font-bold text-[#B93838] hover:bg-[#FDF5F5]"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredRecipes.length === 0 && !recipesLoading && (
              <p className="text-center py-12 text-sm text-[#64748B]">
                Tidak ada resep ditemukan dalam kategori ini.
              </p>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CMS PUSTAKA EDUKASI (ARTIKEL / MAKANAN / VIDEO)     */}
        {/* ========================================================= */}
        {activeTab === "education" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
              <div>
                <h1 className="text-xl font-black text-[#0F5132]">Pustaka Materi Edukasi Kesehatan</h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Kelola konten edukasi komprehensif: Artikel Ilmiah Populer, Panduan Pangan Alami Sehat, dan Video Tutorial.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-md border border-[#CBD5E1] bg-white p-0.5 text-xs font-semibold">
                  {["semua", "artikel", "makanan", "video"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setArticleCategoryFilter(cat)}
                      className={`px-3 py-1 rounded text-xs capitalize transition ${
                        articleCategoryFilter === cat ? "bg-[#0F5132] text-white" : "text-[#64748B] hover:text-black"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setEditingArticleId(null);
                    setArticleForm({
                      title: "",
                      slug: "",
                      category: "artikel",
                      readTimeMinutes: 3,
                      summary: "",
                      content: "",
                      videoUrl: "",
                      imageUrl: "",
                    });
                    setShowArticleModal(true);
                  }}
                  className="rounded-md bg-[#0F5132] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#146C43] shadow-xs flex items-center gap-1.5"
                >
                  <span>+ Tambah Materi</span>
                </button>
              </div>
            </div>

            {/* Articles List Table */}
            <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8F9FA] text-[#495057] font-bold border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-3 px-4">Judul & Slug</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Estimasi Baca</th>
                    <th className="py-3 px-4">Ringkasan</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredArticles.map((a) => (
                    <tr key={a.id} className="hover:bg-[#F8F9FA]">
                      <td className="py-3 px-4">
                        <p className="font-bold text-sm text-[#0F172A]">{a.title}</p>
                        <p className="font-mono text-[11px] text-[#64748B]">/{a.slug}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            a.category === "artikel"
                              ? "bg-blue-100 text-blue-800"
                              : a.category === "video"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {a.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#64748B] font-mono">{a.readTimeMinutes} menit</td>
                      <td className="py-3 px-4 text-[#64748B] max-w-md line-clamp-2">{a.summary}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => openEditArticle(a)}
                          className="rounded border border-[#CBD5E1] px-2.5 py-1 font-bold text-[#0F5132] hover:bg-[#F8FAFC]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(a.id)}
                          className="rounded border border-[#E8C4C4] px-2.5 py-1 font-bold text-[#B93838] hover:bg-[#FDF5F5]"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredArticles.length === 0 && !articlesLoading && (
                <p className="text-center py-10 text-xs text-[#64748B]">
                  Belum ada artikel edukasi dalam kategori ini.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: TELEKONSULTASI MEDIS (TRIAGE DESK)                 */}
        {/* ========================================================= */}
        {activeTab === "consultations" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
              <div>
                <h1 className="text-xl font-black text-[#0F5132]">Manajemen Telekonsultasi Tenaga Medis</h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Triage pengajuan konsultasi daring ibu ke Bidan Komunitas, Ahli Gizi / Dietisien, dan Dokter Spesialis Anak.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#64748B]">Status:</span>
                <select
                  value={consultationStatusFilter}
                  onChange={(e) => setConsultationStatusFilter(e.target.value)}
                  className="rounded-md border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-bold text-[#0F5132] focus:outline-hidden"
                >
                  <option value="ALL">Semua ({consultations.length})</option>
                  <option value="PENDING">PENDING ({consultations.filter((c) => c.status.toUpperCase() === "PENDING").length})</option>
                  <option value="ACTIVE">ACTIVE ({consultations.filter((c) => c.status.toUpperCase() === "ACTIVE").length})</option>
                  <option value="COMPLETED">COMPLETED ({consultations.filter((c) => c.status.toUpperCase() === "COMPLETED").length})</option>
                </select>

                <div className="hidden sm:flex rounded-md border border-[#CBD5E1] bg-white p-0.5 text-xs font-semibold">
                  {["ALL", "PENDING", "ACTIVE", "COMPLETED"].map((st) => {
                    const count =
                      st === "ALL"
                        ? consultations.length
                        : consultations.filter((c) => c.status.toUpperCase() === st).length;
                    const isSelected = consultationStatusFilter.toUpperCase() === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setConsultationStatusFilter(st)}
                        className={`px-3 py-1 rounded text-xs transition flex items-center gap-1.5 ${
                          isSelected ? "bg-[#0F5132] text-white font-bold shadow-xs" : "text-[#64748B] hover:text-black"
                        }`}
                      >
                        <span>{st === "ALL" ? "Semua" : st}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                            isSelected ? "bg-white/20 text-white" : "bg-[#F1F5F9] text-[#0F5132]"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Consultations List */}
            <div className="grid gap-4">
              {filteredConsultations.map((c) => (
                <div key={c.id} className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F1F5F9] pb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          c.status === "PENDING"
                            ? "bg-rose-100 text-rose-800"
                            : c.status === "ACTIVE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="text-xs font-bold text-[#144E83]">
                        {c.specialistType} - {c.specialistName}
                      </span>
                    </div>

                    <span className="font-mono text-[11px] text-[#64748B]">
                      {new Date(c.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#0F172A]">{c.topic}</h4>
                      <p className="mt-1 text-xs text-[#64748B]">{c.notes || "Tidak ada catatan pengantar."}</p>
                    </div>

                    <div className="rounded bg-[#F8F9FA] p-3 text-xs border border-[#E9ECEF]">
                      <p className="font-bold text-[#0F5132]">Pemohon Konsultasi:</p>
                      <p className="mt-0.5 text-[#0F172A]">
                        {c.guardian.name || "Ibu"} ({c.guardian.email})
                      </p>
                      <p className="text-[#64748B]">Telp/WA: {c.guardian.phone || "-"}</p>
                      {c.guardian.children.length > 0 && (
                        <p className="mt-1 text-[#0F5132]">
                          Anak: {c.guardian.children.map((ch) => ch.name).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#F1F5F9] pt-3">
                    {c.guardian.phone && (
                      <a
                        href={`https://wa.me/${c.guardian.phone.replace(/[^0-9]/g, "")}?text=Halo%20Ibu%20${encodeURIComponent(c.guardian.name || "")},%20terkait%20sesi%20konsultasi%20Si-Cehat...`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        Hubungi WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setActiveConsultationModal(c);
                        setConsultationNotes(c.notes || "");
                        setConsultationStatusUpdate(c.status);
                      }}
                      className="rounded bg-[#0F5132] px-3.5 py-1 text-xs font-bold text-white hover:bg-[#146C43]"
                    >
                      Update Status / Rekomendasi
                    </button>
                  </div>
                </div>
              ))}

              {filteredConsultations.length === 0 && !consultationsLoading && (
                <div className="rounded-lg border border-dashed border-[#CBD5E1] p-8 text-center bg-white">
                  <p className="text-xs font-bold text-[#64748B]">
                    Tidak ada tiket konsultasi dengan status &ldquo;{consultationStatusFilter}&rdquo;.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: DIREKTORI KELUARGA & DEMOGRAFI                     */}
        {/* ========================================================= */}
        {activeTab === "families" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
              <div>
                <h1 className="text-xl font-black text-[#0F5132]">Direktori Keluarga & Profil Demografis</h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Data master orang tua, riwayat medis anak, status skrining risiko, dan kurva gizi WHO untuk tindak lanjut Posyandu.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari nama ibu, email, telp..."
                  value={familySearchQuery}
                  onChange={(e) => setFamilySearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchFamilies();
                  }}
                  className="rounded-md border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs text-[#0F172A] placeholder-[#64748B] focus:border-[#0F5132] focus:outline-hidden"
                />
                <button
                  onClick={() => fetchFamilies()}
                  className="rounded-md bg-[#0F5132] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#146C43]"
                >
                  Cari
                </button>
              </div>
            </div>

            {/* Families Table */}
            <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8F9FA] text-[#495057] font-bold border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-3 px-4">Profil Ibu / Wali</th>
                    <th className="py-3 px-4">Demografi & Alamat</th>
                    <th className="py-3 px-4">Profil Anak</th>
                    <th className="py-3 px-4">Skrining Terakhir</th>
                    <th className="py-3 px-4">Status Gizi (WHO)</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {families.map((f) => (
                    <tr key={f.id} className="hover:bg-[#F8F9FA]">
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#0F172A]">{f.name || "Ibu"}</p>
                        <p className="font-mono text-[11px] text-[#64748B]">{f.email}</p>
                        <p className="text-[11px] text-emerald-700 font-semibold">{f.phone || "-"}</p>
                      </td>
                      <td className="py-3 px-4 text-[#64748B] max-w-xs">
                        <p>{f.occupation || "-"} • {f.education || "-"}</p>
                        <p className="truncate text-[11px]">{f.address || "-"}</p>
                      </td>
                      <td className="py-3 px-4">
                        {f.children.length > 0 ? (
                          f.children.map((ch) => (
                            <div key={ch.id} className="mb-1">
                              <p className="font-bold text-[#0F172A]">{ch.name}</p>
                              {ch.healthHistory && (
                                <p className="text-[10px] text-amber-700 truncate max-w-xs">
                                  Riwayat: {ch.healthHistory}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-[#64748B]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {f.children[0]?.screenings && f.children[0].screenings.length > 0 ? (
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              f.children[0].screenings[0].riskCategory === "TINGGI"
                                ? "bg-rose-100 text-rose-800"
                                : f.children[0].screenings[0].riskCategory === "SEDANG"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {f.children[0].screenings[0].riskScore}% {f.children[0].screenings[0].riskCategory}
                          </span>
                        ) : (
                          <span className="text-[#64748B] text-[11px]">Belum Skrining</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {f.children[0]?.growthMeasurements && f.children[0].growthMeasurements.length > 0 ? (
                          <span className="text-xs font-semibold text-[#0F172A]">
                            {f.children[0].growthMeasurements[0].nutritionalStatus || "Normal"}
                          </span>
                        ) : (
                          <span className="text-[#64748B] text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {f.phone && (
                          <a
                            href={`https://wa.me/${f.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-xs"
                          >
                            Hubungi
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {families.length === 0 && !familiesLoading && (
                <p className="text-center py-10 text-xs text-[#64748B]">
                  Tidak ada data keluarga yang sesuai dengan pencarian.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: MISI & KUIS GAMIFIKASI (CMS ASLI)                   */}
        {/* ========================================================= */}
        {activeTab === "cms" && (
          <div className="space-y-6">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h1 className="text-xl font-black text-[#0F5132]">Kelola Misi & Kuis Gamifikasi Anak</h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Kelola tantangan harian, butir kuis interaktif, dan menu rekomendasi yang tampil di antarmuka anak.
              </p>
            </div>

            {/* Challenges Section */}
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <h3 className="text-sm font-black text-[#0F5132]">Tantangan Harian Anak</h3>
                <button
                  type="button"
                  onClick={() => setShowAddChallenge(!showAddChallenge)}
                  className="rounded-md bg-[#0F5132] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#146C43]"
                >
                  {showAddChallenge ? "Tutup Form" : "+ Tambah Tantangan"}
                </button>
              </div>

              {showAddChallenge && (
                <form onSubmit={handleAddChallenge} className="mt-3 space-y-3 rounded-md bg-[#F8F9FA] p-3 border border-[#E2E8F0]">
                  <input
                    type="text"
                    placeholder="Judul Tantangan"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                    className="w-full rounded border border-[#CBD5E1] bg-white p-2 text-xs"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Deskripsi Tantangan"
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                    className="w-full rounded border border-[#CBD5E1] bg-white p-2 text-xs"
                    required
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Poin XP"
                      value={newChallenge.xp}
                      onChange={(e) => setNewChallenge({ ...newChallenge, xp: Number(e.target.value) })}
                      className="w-24 rounded border border-[#CBD5E1] bg-white p-2 text-xs"
                      required
                    />
                    <button type="submit" className="rounded bg-[#0F5132] px-4 py-2 text-xs font-bold text-white">
                      Simpan
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-3 space-y-2">
                {challenges.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded border border-[#F1F5F9] p-3 hover:bg-[#F8F9FA]">
                    <div>
                      <p className="font-bold text-xs text-[#0F172A]">{c.title} (+{c.xp} XP)</p>
                      <p className="text-[11px] text-[#64748B]">{c.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle("challenge", c.id, !c.isActive)}
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {c.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                      <button
                        onClick={() => handleDelete("challenge", c.id)}
                        className="text-xs font-bold text-rose-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quizzes Section */}
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <h3 className="text-sm font-black text-[#0F5132]">Butir Soal Kuis Interaktif</h3>
                <button
                  type="button"
                  onClick={() => setShowAddQuiz(!showAddQuiz)}
                  className="rounded-md bg-[#0F5132] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#146C43]"
                >
                  {showAddQuiz ? "Tutup Form" : "+ Tambah Kuis"}
                </button>
              </div>

              {showAddQuiz && (
                <form onSubmit={handleAddQuiz} className="mt-3 space-y-3 rounded-md bg-[#F8F9FA] p-3 border border-[#E2E8F0]">
                  <input
                    type="text"
                    placeholder="Pertanyaan Kuis"
                    value={newQuiz.question}
                    onChange={(e) => setNewQuiz({ ...newQuiz, question: e.target.value })}
                    className="w-full rounded border border-[#CBD5E1] bg-white p-2 text-xs"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Pilihan Jawaban (pisahkan dengan koma)"
                    value={newQuiz.options}
                    onChange={(e) => setNewQuiz({ ...newQuiz, options: e.target.value })}
                    className="w-full rounded border border-[#CBD5E1] bg-white p-2 text-xs"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Jawaban Benar"
                    value={newQuiz.answer}
                    onChange={(e) => setNewQuiz({ ...newQuiz, answer: e.target.value })}
                    className="w-full rounded border border-[#CBD5E1] bg-white p-2 text-xs"
                    required
                  />
                  <button type="submit" className="rounded bg-[#0F5132] px-4 py-2 text-xs font-bold text-white">
                    Simpan Kuis
                  </button>
                </form>
              )}

              <div className="mt-3 space-y-2">
                {quizzes.map((q) => (
                  <div key={q.id} className="flex items-center justify-between rounded border border-[#F1F5F9] p-3 hover:bg-[#F8F9FA]">
                    <div>
                      <p className="font-bold text-xs text-[#0F172A]">{q.question}</p>
                      <p className="text-[11px] text-[#64748B]">Kunci: {q.answer} (+{q.xp} XP)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle("quiz", q.id, !q.isActive)}
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          q.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {q.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                      <button
                        onClick={() => handleDelete("quiz", q.id)}
                        className="text-xs font-bold text-rose-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations Menu Section */}
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <h3 className="text-sm font-black text-[#0F5132]">Rekomendasi Menu Harian Anak</h3>
                <button
                  type="button"
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="rounded-md bg-[#0F5132] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#146C43]"
                >
                  {showAddMenu ? "Tutup Form" : "+ Tambah Menu Harian"}
                </button>
              </div>

              {showAddMenu && (
                <form onSubmit={handleAddMenu} className="mt-3 space-y-3 rounded-md bg-[#F8F9FA] p-3 border border-[#E2E8F0]">
                  <input
                    type="text"
                    placeholder="Judul Menu (cth: Sayur Bayam Jagung Manis)"
                    value={newMenu.title}
                    onChange={(e) => setNewMenu({ ...newMenu, title: e.target.value })}
                    className="w-full rounded border border-[#CBD5E1] bg-white p-2 text-xs"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Catatan Gizi (cth: Kaya serat, rendah indeks glikemik)"
                    value={newMenu.note}
                    onChange={(e) => setNewMenu({ ...newMenu, note: e.target.value })}
                    className="w-full rounded border border-[#CBD5E1] bg-white p-2 text-xs"
                    required
                  />
                  <button type="submit" className="rounded bg-[#0F5132] px-4 py-2 text-xs font-bold text-white">
                    Simpan Menu
                  </button>
                </form>
              )}

              <div className="mt-3 space-y-2">
                {menus.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded border border-[#F1F5F9] p-3 hover:bg-[#F8F9FA]">
                    <div>
                      <p className="font-bold text-xs text-[#0F172A]">{m.title}</p>
                      <p className="text-[11px] text-[#64748B]">{m.note}</p>
                    </div>
                    <button
                      onClick={() => handleDelete("menu", m.id)}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: KONFIGURASI AI & CHATBOT                            */}
        {/* ========================================================= */}
        {activeTab === "bot" && (
          <div className="space-y-6">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h1 className="text-xl font-black text-[#0F5132]">Konfigurasi AI & System Prompt</h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Pengaturan parameter LLM OpenAI-compatible, instruksi etika medis ramah anak, dan playground pengujian latensi.
              </p>
            </div>

            <form onSubmit={handleSaveBotConfig} className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A]">Provider AI</label>
                  <input
                    type="text"
                    value={botConfig.provider}
                    onChange={(e) => setBotConfig({ ...botConfig, provider: e.target.value })}
                    className="mt-1 w-full rounded border border-[#CBD5E1] bg-white p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A]">Nama Model (cth: gpt-4o-mini)</label>
                  <input
                    type="text"
                    value={botConfig.model}
                    onChange={(e) => setBotConfig({ ...botConfig, model: e.target.value })}
                    className="mt-1 w-full rounded border border-[#CBD5E1] bg-white p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A]">System Prompt (Instruksi Asisten Si Cehat)</label>
                <textarea
                  rows={8}
                  value={botConfig.systemPrompt}
                  onChange={(e) => setBotConfig({ ...botConfig, systemPrompt: e.target.value })}
                  className="mt-1 w-full rounded border border-[#CBD5E1] bg-white p-2 text-xs font-mono leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-3">
                {botSaveStatus && <span className="text-xs font-bold text-emerald-700">{botSaveStatus}</span>}
                <button
                  type="submit"
                  disabled={botSaving}
                  className="ml-auto rounded bg-[#0F5132] px-5 py-2 text-xs font-bold text-white hover:bg-[#146C43]"
                >
                  {botSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
                </button>
              </div>
            </form>

            {/* Test Playground */}
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-[#0F5132]">Playground Uji Coba Chatbot</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  className="flex-1 rounded border border-[#CBD5E1] bg-white p-2 text-xs"
                />
                <button
                  type="button"
                  onClick={handleTestBot}
                  disabled={testRunning}
                  className="rounded bg-[#144E83] px-4 py-2 text-xs font-bold text-white hover:bg-[#00335E]"
                >
                  {testRunning ? "Menguji..." : "Kirim Uji"}
                </button>
              </div>

              {testResult && (
                <div className="rounded bg-[#F8F9FA] p-3 text-xs border border-[#E9ECEF]">
                  {testResult.reply && <p className="font-medium text-[#0F172A]">{testResult.reply}</p>}
                  {testResult.latencyMs && (
                    <p className="mt-1 text-[10px] text-[#64748B] font-mono">
                      Latensi: {testResult.latencyMs}ms ({testResult.isMock ? "Mocked" : "Live API"})
                    </p>
                  )}
                  {testResult.error && <p className="text-rose-600 font-bold">{testResult.error}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: EKSPOR DATASET RISET                                */}
        {/* ========================================================= */}
        {activeTab === "export" && (
          <div className="space-y-6">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h1 className="text-xl font-black text-[#0F5132]">Ekspor Dataset Riset Anonim</h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Unduh dataset anonim interaksi anak, kurva gizi WHO, dan kepatuhan pola makan sehat untuk keperluan analisis riset kesehatan masyarakat.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs">
                <h3 className="text-sm font-bold text-[#0F172A]">Dataset Format CSV (Excel Compatible)</h3>
                <p className="mt-1 text-xs text-[#64748B]">
                  Format tabel spreadsheet siap pakai untuk analisis SPSS, R, atau Python Pandas.
                </p>
                <a
                  href="/api/admin/export?format=csv"
                  download="dataset_si_cehat.csv"
                  className="mt-4 inline-block rounded bg-[#0F5132] px-4 py-2 text-xs font-bold text-white hover:bg-[#146C43]"
                >
                  Unduh Dataset (CSV)
                </a>
              </div>

              <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs">
                <h3 className="text-sm font-bold text-[#0F172A]">Dataset Format JSON Raw</h3>
                <p className="mt-1 text-xs text-[#64748B]">
                  Struktur objek JSON lengkap untuk integrasi pipeline data atau model analitik prediktif.
                </p>
                <a
                  href="/api/admin/export?format=json"
                  download="dataset_si_cehat.json"
                  className="mt-4 inline-block rounded bg-[#144E83] px-4 py-2 text-xs font-bold text-white hover:bg-[#00335E]"
                >
                  Unduh Dataset (JSON)
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: FORM RESEP TRADISIONAL SEHAT                       */}
      {/* ========================================================= */}
      {showRecipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 className="text-base font-black text-[#0F5132]">
                {editingRecipeId ? "Edit Resep Tradisional" : "Tambah Resep Tradisional Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setShowRecipeModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A]">Nama Masakan / Minuman</label>
                  <input
                    type="text"
                    required
                    value={recipeForm.title}
                    onChange={(e) => setRecipeForm({ ...recipeForm, title: e.target.value })}
                    className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs"
                    placeholder="cth: Sayur Asem Tradisional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A]">Kategori</label>
                  <select
                    value={recipeForm.category}
                    onChange={(e) => setRecipeForm({ ...recipeForm, category: e.target.value as "makanan" | "minuman" | "camilan" })}
                    className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs bg-white"
                  >
                    <option value="makanan">Makanan Utama</option>
                    <option value="minuman">Minuman Segar Sehat</option>
                    <option value="camilan">Camilan Rendah Gula</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A]">Deskripsi Singkat</label>
                <textarea
                  required
                  rows={2}
                  value={recipeForm.description}
                  onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })}
                  className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs"
                  placeholder="Keterangan cita rasa, manfaat serat, dan rekomendasi penyajian..."
                />
              </div>

              {/* Nutrients Row */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 bg-[#F8F9FA] p-3 rounded-lg border border-[#E9ECEF] text-xs">
                <div>
                  <label className="block font-bold text-[#0F5132]">Kalori (kkal)</label>
                  <input
                    type="number"
                    value={recipeForm.caloriesKkal}
                    onChange={(e) => setRecipeForm({ ...recipeForm, caloriesKkal: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-[#CBD5E1] bg-white p-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-rose-700">Gula (g)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={recipeForm.sugarGram}
                    onChange={(e) => setRecipeForm({ ...recipeForm, sugarGram: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-[#CBD5E1] bg-white p-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-blue-700">Karbo (g)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={recipeForm.carbsGram}
                    onChange={(e) => setRecipeForm({ ...recipeForm, carbsGram: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-[#CBD5E1] bg-white p-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-amber-700">Protein (g)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={recipeForm.proteinGram}
                    onChange={(e) => setRecipeForm({ ...recipeForm, proteinGram: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-[#CBD5E1] bg-white p-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700">Lemak (g)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={recipeForm.fatGram}
                    onChange={(e) => setRecipeForm({ ...recipeForm, fatGram: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-[#CBD5E1] bg-white p-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-emerald-700">Serat (g)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={recipeForm.fiberGram}
                    onChange={(e) => setRecipeForm({ ...recipeForm, fiberGram: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-[#CBD5E1] bg-white p-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A]">Bahan-Bahan (1 bahan per baris)</label>
                <textarea
                  required
                  rows={3}
                  value={recipeForm.ingredientsText}
                  onChange={(e) => setRecipeForm({ ...recipeForm, ingredientsText: e.target.value })}
                  className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs font-mono"
                  placeholder="1 buah labu siam&#10;4 batang kacang panjang&#10;1 buah jagung manis"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A]">Instruksi Memasak (1 langkah per baris)</label>
                <textarea
                  required
                  rows={3}
                  value={recipeForm.instructionsText}
                  onChange={(e) => setRecipeForm({ ...recipeForm, instructionsText: e.target.value })}
                  className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs font-mono"
                  placeholder="Didihkan air bersama bumbu.&#10;Masukkan sayuran keras terlebih dahulu.&#10;Sajikan selagi hangat."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A]">URL Gambar / Foto Makanan (Opsional)</label>
                <input
                  type="url"
                  value={recipeForm.imageUrl}
                  onChange={(e) => setRecipeForm({ ...recipeForm, imageUrl: e.target.value })}
                  className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-[#F1F5F9] pt-3">
                <button
                  type="button"
                  onClick={() => setShowRecipeModal(false)}
                  className="rounded border border-[#CBD5E1] px-4 py-2 text-xs font-bold text-[#64748B]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded bg-[#0F5132] px-5 py-2 text-xs font-bold text-white hover:bg-[#146C43]"
                >
                  Simpan Resep
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FORM MATERI EDUKASI (ARTIKEL/VIDEO/MAKANAN)        */}
      {/* ========================================================= */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 className="text-base font-black text-[#0F5132]">
                {editingArticleId ? "Edit Materi Edukasi" : "Tambah Materi Edukasi Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setShowArticleModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#0F172A]">Judul Materi</label>
                  <input
                    type="text"
                    required
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                    className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs"
                    placeholder="cth: Apa itu Diabetes pada Anak?"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A]">Kategori</label>
                  <select
                    value={articleForm.category}
                    onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value as "artikel" | "makanan" | "video" })}
                    className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs bg-white"
                  >
                    <option value="artikel">Artikel Bacaan</option>
                    <option value="makanan">Makanan Sehat</option>
                    <option value="video">Video Edukasi</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A]">Custom Slug (Opsional)</label>
                  <input
                    type="text"
                    value={articleForm.slug}
                    onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
                    className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs font-mono"
                    placeholder="apa-itu-diabetes-pada-anak"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A]">Estimasi Menit Baca</label>
                  <input
                    type="number"
                    min={1}
                    value={articleForm.readTimeMinutes}
                    onChange={(e) => setArticleForm({ ...articleForm, readTimeMinutes: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A]">Ringkasan Singkat</label>
                <textarea
                  required
                  rows={2}
                  value={articleForm.summary}
                  onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                  className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs"
                  placeholder="Ringkasan 1-2 kalimat untuk kartu pratinjau..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A]">Konten Materi (Teks / Panduan)</label>
                <textarea
                  required
                  rows={5}
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                  className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs leading-relaxed"
                  placeholder="Isi lengkap artikel atau transkrip panduan edukasi..."
                />
              </div>

              {articleForm.category === "video" && (
                <div>
                  <label className="block text-xs font-bold text-[#0F172A]">URL Video (YouTube / MP4)</label>
                  <input
                    type="url"
                    value={articleForm.videoUrl}
                    onChange={(e) => setArticleForm({ ...articleForm, videoUrl: e.target.value })}
                    className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#0F172A]">URL Gambar Banner (Opsional)</label>
                <input
                  type="url"
                  value={articleForm.imageUrl}
                  onChange={(e) => setArticleForm({ ...articleForm, imageUrl: e.target.value })}
                  className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-[#F1F5F9] pt-3">
                <button
                  type="button"
                  onClick={() => setShowArticleModal(false)}
                  className="rounded border border-[#CBD5E1] px-4 py-2 text-xs font-bold text-[#64748B]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded bg-[#0F5132] px-5 py-2 text-xs font-bold text-white hover:bg-[#146C43]"
                >
                  Simpan Materi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: UPDATE KONSULTASI MEDIS                             */}
      {/* ========================================================= */}
      {activeConsultationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 className="text-base font-black text-[#0F5132]">Tindak Lanjut Konsultasi Medis</h3>
              <button
                type="button"
                onClick={() => setActiveConsultationModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateConsultation} className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-[#64748B]">Topik Pengajuan:</p>
                <p className="text-sm font-bold text-[#0F172A]">{activeConsultationModal.topic}</p>
                <p className="text-xs text-[#64748B] mt-1">
                  Tenaga Medis: {activeConsultationModal.specialistName} ({activeConsultationModal.specialistType})
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A]">Status Sesi Konsultasi</label>
                <select
                  value={consultationStatusUpdate}
                  onChange={(e) => setConsultationStatusUpdate(e.target.value as "PENDING" | "ACTIVE" | "COMPLETED")}
                  className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs bg-white font-bold"
                >
                  <option value="PENDING">PENDING (Menunggu Respons)</option>
                  <option value="ACTIVE">ACTIVE (Sedang Berlangsung / Dijadwalkan)</option>
                  <option value="COMPLETED">COMPLETED (Selesai & Rekomendasi Terbit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A]">
                  Catatan Tindak Lanjut / Rekomendasi Klinis
                </label>
                <textarea
                  rows={4}
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  className="mt-1 w-full rounded border border-[#CBD5E1] p-2 text-xs leading-relaxed"
                  placeholder="Tuliskan rekomendasi gizi, anjuran tes glukosa puasa, atau jadwal sesi tatap muka..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-[#F1F5F9] pt-3">
                <button
                  type="button"
                  onClick={() => setActiveConsultationModal(null)}
                  className="rounded border border-[#CBD5E1] px-4 py-2 text-xs font-bold text-[#64748B]"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="rounded bg-[#0F5132] px-5 py-2 text-xs font-bold text-white hover:bg-[#146C43]"
                >
                  Simpan Pembaruan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

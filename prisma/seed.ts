import { db } from "../src/lib/db";

async function main() {
  console.log("Seeding CMS & Figma baseline content...");

  // 1. Challenges
  const challengeCount = await db.challenge.count();
  if (challengeCount === 0) {
    await db.challenge.createMany({
      data: [
        {
          title: "Misi Warna Piring",
          description: "Makan satu buah atau sayur hari ini, lalu ceritakan warnanya.",
          xp: 30,
          isActive: true,
        },
        {
          title: "Misi Gerak Ceria",
          description: "Lakukan lompat tali atau jalan santai selama 20 menit bersama teman atau keluarga.",
          xp: 25,
          isActive: false,
        },
        {
          title: "Misi Teguk Segar",
          description: "Minum minimal 6 gelas air putih sebelum waktu tidur tiba.",
          xp: 20,
          isActive: false,
        },
      ],
    });
    console.log("Created default challenges.");
  }

  // 2. Quizzes
  const quizCount = await db.quiz.count();
  if (quizCount === 0) {
    await db.quiz.createMany({
      data: [
        {
          question: "Minuman apa yang paling baik diminum setiap hari?",
          options: JSON.stringify(["Air putih", "Soda", "Teh manis sangat banyak"]),
          answer: "Air putih",
          xp: 20,
          isActive: true,
        },
        {
          question: "Sayur berwarna oranye seperti wortel sangat baik untuk kesehatan apa?",
          options: JSON.stringify(["Mata", "Kuku", "Rambut"]),
          answer: "Mata",
          xp: 20,
          isActive: false,
        },
        {
          question: "Berapa menit kita dianjurkan bergerak aktif setiap hari?",
          options: JSON.stringify(["60 menit", "5 menit", "500 menit"]),
          answer: "60 menit",
          xp: 20,
          isActive: false,
        },
      ],
    });
    console.log("Created default quizzes.");
  }

  // 3. Recommended Menus
  const menuCount = await db.recommendedMenu.count();
  if (menuCount === 0) {
    await db.recommendedMenu.createMany({
      data: [
        {
          title: "Nasi, ayam, sayur bening, dan pepaya",
          note: "Ada sumber tenaga, lauk, sayur, dan buah. Porsinya tetap secukupnya.",
          orderIndex: 1,
        },
        {
          title: "Karedok ringan dengan nasi dan telur",
          note: "Sayurnya beragam. Kurangi saus terlalu manis atau terlalu banyak.",
          orderIndex: 2,
        },
        {
          title: "Tumis brokoli wortel dan tempe",
          note: "Warna sayur membantu anak mengenali isi piring yang seimbang.",
          orderIndex: 3,
        },
      ],
    });
    console.log("Created default recommended menus.");
  }

  // 4. Traditional Recipes (From Figma: Sayur Asem, Pecel Lele, Nasi Rawon)
  const recipeCount = await db.recipe.count();
  if (recipeCount === 0) {
    await db.recipe.createMany({
      data: [
        {
          title: "Sayur Asem",
          category: "makanan",
          description: "Sayur kuah asam segar tradisional kaya serat dan rendah gula.",
          caloriesKkal: 120,
          carbsGram: 18,
          proteinGram: 4,
          fatGram: 1,
          fiberGram: 4,
          sugarGram: 2,
          ingredients: JSON.stringify([
            "1 genggam kacang panjang, potong-potong",
            "1 buah jagung manis, potong melingkar",
            "1 genggam daun melinjo muda",
            "30 gr labu siam, potong dadu",
            "3 sendok makan air asam jawa murni",
            "1 liter air bersih",
          ]),
          instructions: JSON.stringify([
            "Didihkan 1 liter air di dalam panci bersama jagung manis hingga agak lunak.",
            "Masukkan labu siam dan kacang panjang, masak selama 3-5 menit.",
            "Tambahkan air asam jawa, daun melinjo, dan sedikit garam secukupnya.",
            "Aduk rata, masak sebentar hingga matang lalu angkat dan sajikan hangat.",
          ]),
          imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
        },
        {
          title: "Pecel Lele Panggang",
          category: "makanan",
          description: "Ikan lele panggang dengan sambal tomat segar tanpa minyak berlebih.",
          caloriesKkal: 210,
          carbsGram: 4,
          proteinGram: 22,
          fatGram: 8,
          fiberGram: 2,
          sugarGram: 1,
          ingredients: JSON.stringify([
            "2 ekor ikan lele segar, bersihkan",
            "1 sendok teh air jeruk nipis & ketumbar bubuk",
            "2 buah tomat matang, kukus",
            "3 siung bawang merah, sangrai",
            "Kemangi dan timun lalapan segar",
          ]),
          instructions: JSON.stringify([
            "Lumuri ikan lele dengan jeruk nipis, bawang putih halus, dan garam.",
            "Panggang lele di teflon antilengket atau pemanggang hingga matang kecokelatan.",
            "Ulek tomat kukus bersama bawang merah dan sedikit garam untuk sambal.",
            "Sajikan lele panggang bersama lalapan dan sambal segar.",
          ]),
          imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=60",
        },
        {
          title: "Nasi Rawon Daging Tanpa Lemak",
          category: "makanan",
          description: "Kuah rawon khas kluwek kaya rempah dengan irisan daging sapi tanpa lemak.",
          caloriesKkal: 280,
          carbsGram: 32,
          proteinGram: 24,
          fatGram: 6,
          fiberGram: 3,
          sugarGram: 1,
          ingredients: JSON.stringify([
            "150 gr daging sapi has dalam (tanpa lemak), potong dadu",
            "2 buah kluwek tua, rendam air panas",
            "Bumbu rempah rawon (bawang, jahe, kunyit, serai)",
            "Segenggam tauge pendek segar",
          ]),
          instructions: JSON.stringify([
            "Rebus daging sapi hingga empuk, tiriskan kaldu beningnya.",
            "Tumis bumbu halus kluwek dengan sedikit minyak kelapa hingga wangi.",
            "Masukkan bumbu tumis ke air rebusan daging, masak hingga bumbu meresap.",
            "Sajikan rawon bersama tauge pendek mentah yang renyah dan nasi secukupnya.",
          ]),
          imageUrl: "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=500&auto=format&fit=crop&q=60",
        },
        {
          title: "Es Timun Serut Jeruk Nipis",
          category: "minuman",
          description: "Minuman dingin segar tanpa sirup buatan, kaya hidrasi dan antioksidan.",
          caloriesKkal: 45,
          carbsGram: 10,
          proteinGram: 1,
          fatGram: 0,
          fiberGram: 2,
          sugarGram: 6,
          ingredients: JSON.stringify([
            "2 buah mentimun segar, cuci dan serut memanjang",
            "1 sendok makan biji selasih, rendam air hangat",
            "2 buah jeruk nipis, peras airnya",
            "1 sendok makan madu murni",
            "Air mineral dan es batu secukupnya",
          ]),
          instructions: JSON.stringify([
            "Campurkan mentimun serut dan biji selasih mekar ke dalam wadah.",
            "Tambahkan perasan jeruk nipis, madu, dan air dingin secukupnya.",
            "Aduk rata dan sajikan dingin.",
          ]),
          imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60",
        },
      ],
    });
    console.log("Created default traditional recipes.");
  }

  // 5. Education Articles (From Figma: Apa itu Diabetes, Bahaya Minuman Manis)
  const articleCount = await db.educationArticle.count();
  if (articleCount === 0) {
    await db.educationArticle.createMany({
      data: [
        {
          slug: "apa-itu-diabetes-pada-anak",
          title: "Apa itu Diabetes pada Anak?",
          category: "artikel",
          readTimeMinutes: 4,
          summary: "Mengenal gejala awal dan perbedaan diabetes tipe 1 dan tipe 2 pada usia tumbuh kembang.",
          content: `Diabetes pada anak adalah kondisi ketika kadar gula (glukosa) dalam darah anak berada di atas batas normal. Tubuh membutuhkan hormon insulin untuk mengubah gula dari makanan menjadi energi.

Gejala Umum yang Perlu Diwaspadai:
1. Sering buang air kecil (terutama di malam hari)
2. Cepat merasa haus walau sudah minum banyak
3. Penurunan berat badan tanpa sebab yang jelas
4. Anak mudah lelah dan lemas saat beraktivitas

Pencegahan sejak dini melalui pola makan piring seimbang dan aktivitas fisik sangat penting untuk menjaga sensitivitas hormon insulin anak.`,
          imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500&auto=format&fit=crop&q=60",
        },
        {
          slug: "bahaya-minuman-manis-pada-anak",
          title: "Bahaya Minuman Manis pada Anak",
          category: "artikel",
          readTimeMinutes: 3,
          summary: "Mengapa minuman kemasan manis dan boba menjadi pemicu utama lonjakan gula darah anak.",
          content: `Minuman kemasan sering kali mengandung gula tersembunyi hingga 25-40 gram per botol, jauh melebihi batas anjuran konsumsi harian anak (maksimal 20-25 gram per hari).

Dampak Konsumsi Gula Berlebih:
- Memicu lonjakan kadar gula darah secara cepat lalu anjlok drastis (sugar crash)
- Meningkatkan risiko resistensi insulin dan obesitas
- Merusak kesehatan enamel gigi anak

Tips Pengganti Sehat:
Gantikan minuman manis kemasan dengan air putih dingin beraroma buah (infused water) atau jus buah asli tanpa gula tambahan.`,
          imageUrl: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&auto=format&fit=crop&q=60",
        },
        {
          slug: "kreasi-masakan-sehat-praktis",
          title: "Kreasi Masakan Sehat Hari Praktis",
          category: "makanan",
          readTimeMinutes: 5,
          summary: "Tips menyusun menu bekal dan hidangan keluarga kaya serat yang disukai anak.",
          content: `Menyiapkan makanan sehat tidak harus rumit atau mahal. Kunci utamanya adalah prinsip "Isi Piringku":
- 1/2 piring berisi sayur dan buah-buahan
- 1/4 piring berisi karbohidrat kompleks (nasi merah, kentang rebus, atau jagung)
- 1/4 piring berisi protein berkualitas (telur, tempe, tahu, ikan, atau daging tanpa lemak)

Gunakan metode memasak kukus, rebus, atau panggang untuk membatasi lemak jenuh dari minyak goreng berulang.`,
          imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=60",
        },
      ],
    });
    console.log("Created default education articles.");
  }

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

import { count, eq } from "drizzle-orm";
import { drizzleDb, pgSql } from "./index";
import {
  posyandus,
  guardians,
  children,
  screeningRecords,
  growthMeasurements,
  consultations,
  detailedFoodLogs,
  challenges,
  quizzes,
  recommendedMenus,
  recipes,
  educationArticles,
} from "./schema";
import { hashPassword } from "../utils/password";

async function main() {
  console.log("Seeding CMS, Admin, Posyandu & Baseline Content (Drizzle ORM)...");

  // 0. Master Data: Posyandu
  let [melatiPosyandu] = await drizzleDb
    .select()
    .from(posyandus)
    .where(eq(posyandus.code, "POS-MELATI-01"))
    .limit(1);

  if (!melatiPosyandu) {
    const [inserted] = await drizzleDb
      .insert(posyandus)
      .values({
        name: "Posyandu Melati 01",
        code: "POS-MELATI-01",
        rw: "RW 03",
        rt: "RT 05",
        kelurahan: "Tebet Barat",
        kecamatan: "Tebet",
        city: "Jakarta Selatan",
        address: "Balai Warga RW 03, Jl. Tebet Barat Dalam Raya No. 12",
        contactPhone: "081233445566",
        leaderName: "Bdn. Siti Rahmawati, S.Tr.Keb",
      })
      .returning();
    melatiPosyandu = inserted;
    console.log("Created master data: Posyandu Melati 01 (POS-MELATI-01)");
  }

  let [mawarPosyandu] = await drizzleDb
    .select()
    .from(posyandus)
    .where(eq(posyandus.code, "POS-MAWAR-02"))
    .limit(1);

  if (!mawarPosyandu) {
    const [inserted] = await drizzleDb
      .insert(posyandus)
      .values({
        name: "Posyandu Mawar 02",
        code: "POS-MAWAR-02",
        rw: "RW 05",
        rt: "RT 02",
        kelurahan: "Manggarai Selatan",
        kecamatan: "Tebet",
        city: "Jakarta Selatan",
        address: "Pos RW 05, Jl. Manggarai Selatan No. 4",
        contactPhone: "081277889900",
        leaderName: "Bdn. Tri Handayani, A.Md.Keb",
      })
      .returning();
    mawarPosyandu = inserted;
    console.log("Created master data: Posyandu Mawar 02 (POS-MAWAR-02)");
  }

  // 1. Super Admin Account (Pusat Riset)
  const [existingAdmin] = await drizzleDb
    .select({ id: guardians.id })
    .from(guardians)
    .where(eq(guardians.email, "admin@sicehat.id"))
    .limit(1);

  if (!existingAdmin) {
    const adminPasswordHash = await hashPassword("AdminSehat2026!");
    await drizzleDb.insert(guardians).values({
      email: "admin@sicehat.id",
      passwordHash: adminPasswordHash,
      name: "Administrator Si-Cehat",
      role: "ADMIN",
      phone: "081199887766",
      education: "S2 Kesehatan Masyarakat",
      occupation: "Lead Health Administrator",
      address: "Pusat Riset Si-Cehat, Jakarta",
    });
    console.log("Created default Admin account: admin@sicehat.id / AdminSehat2026!");
  }

  // 2. Admin Posyandu Accounts
  const [existingMelatiAdmin] = await drizzleDb
    .select({ id: guardians.id })
    .from(guardians)
    .where(eq(guardians.email, "posyandu.melati@sicehat.id"))
    .limit(1);

  if (!existingMelatiAdmin) {
    const posyanduPasswordHash = await hashPassword("PosyanduSehat2026!");
    await drizzleDb.insert(guardians).values({
      email: "posyandu.melati@sicehat.id",
      passwordHash: posyanduPasswordHash,
      name: "Bdn. Siti Rahmawati (Admin Posyandu Melati 01)",
      role: "POSYANDU",
      posyanduId: melatiPosyandu.id,
      phone: "081233445566",
      education: "D4 Kebidanan",
      occupation: "Bidan Pembina Posyandu",
      address: "Jl. Tebet Barat Dalam Raya No. 12",
    });
    console.log("Created Admin Posyandu Melati: posyandu.melati@sicehat.id / PosyanduSehat2026!");
  }

  const [existingMawarAdmin] = await drizzleDb
    .select({ id: guardians.id })
    .from(guardians)
    .where(eq(guardians.email, "posyandu.mawar@sicehat.id"))
    .limit(1);

  if (!existingMawarAdmin) {
    const posyanduPasswordHash = await hashPassword("PosyanduSehat2026!");
    await drizzleDb.insert(guardians).values({
      email: "posyandu.mawar@sicehat.id",
      passwordHash: posyanduPasswordHash,
      name: "Bdn. Tri Handayani (Admin Posyandu Mawar 02)",
      role: "POSYANDU",
      posyanduId: mawarPosyandu.id,
      phone: "081277889900",
      education: "D3 Kebidanan",
      occupation: "Bidan Pembina Posyandu",
      address: "Jl. Manggarai Selatan No. 4",
    });
    console.log("Created Admin Posyandu Mawar: posyandu.mawar@sicehat.id / PosyanduSehat2026!");
  }

  // Sample Guardian & Child for Surveillance demonstration (associated with Posyandu Melati 01)
  const [existingMother] = await drizzleDb
    .select({ id: guardians.id, posyanduId: guardians.posyanduId })
    .from(guardians)
    .where(eq(guardians.email, "ibu.rina@example.com"))
    .limit(1);

  if (!existingMother) {
    const motherPasswordHash = await hashPassword("PasswordSehat123!");
    const [mother] = await drizzleDb
      .insert(guardians)
      .values({
        email: "ibu.rina@example.com",
        passwordHash: motherPasswordHash,
        name: "Ibu Rina Sasmita",
        role: "GUARDIAN",
        posyanduId: melatiPosyandu.id,
        phone: "081234567890",
        education: "S1 Pendidikan",
        occupation: "Guru SD",
        address: "Jl. Melati Sehat No. 14, Jakarta Selatan",
      })
      .returning();

    const [child] = await drizzleDb
      .insert(children)
      .values({
        guardianId: mother.id,
        posyanduId: melatiPosyandu.id,
        name: "Ahmad Farhan",
        gender: "MALE",
        birthDate: new Date("2017-05-10"),
        healthHistory: "Riwayat diabetes tipe-2 pada kakek pihak ibu",
      })
      .returning();

    if (child) {
      await drizzleDb.insert(screeningRecords).values({
        childId: child.id,
        guardianId: mother.id,
        ageYears: 9,
        weightKg: 38.5,
        heightCm: 128.0,
        familyHistory: true,
        sweetDrinkFrequency: "sering",
        physicalActivityHours: 0.5,
        riskScore: 78,
        riskCategory: "TINGGI",
        recommendations: JSON.stringify([
          "Batasi asupan minuman manis kemasan maksimal 1 kali per minggu.",
          "Tingkatkan durasi aktivitas fisik aktif minimal 60 menit sehari.",
          "Lakukan pemeriksaan gula darah puasa di fasilitas kesehatan.",
        ]),
      });

      await drizzleDb.insert(growthMeasurements).values({
        childId: child.id,
        date: new Date(),
        weightKg: 38.5,
        heightCm: 128.0,
        bmi: 23.5,
        nutritionalStatus: "Obesitas",
      });

      await drizzleDb.insert(consultations).values([
        {
          guardianId: mother.id,
          specialistType: "AHLI_GIZI",
          specialistName: "Nurul Aini, S.Gz, RD",
          status: "ACTIVE",
          topic: "Konsultasi Diet Gula & Hasil Skrining Tinggi",
          notes:
            "Farhan terbiasa minum teh manis botolan 2-3 kali sehari dan mengeluh cepat lelah saat berolahraga.",
        },
        {
          guardianId: mother.id,
          specialistType: "DOKTER_ANAK",
          specialistName: "dr. Hendra Wijaya, Sp.A",
          status: "PENDING",
          topic: "Evaluasi Risiko & Skrining Glukosa Puasa",
          notes: "Anak sering haus di malam hari dan berat badan stagnan.",
        },
        {
          guardianId: mother.id,
          specialistType: "BIDAN",
          specialistName: "Bd. Siti Rahma, S.ST",
          status: "COMPLETED",
          topic: "Konseling Pola Asuh & Kebiasaan Minum Air",
          notes:
            "Ibu telah menerima panduan Isi Piringku dan target 6 gelas air putih/hari.",
        },
      ]);

      await drizzleDb.insert(detailedFoodLogs).values({
        childId: child.id,
        date: new Date(),
        mealSlot: "siang",
        foodName: "Sayur Asem & Tempe Bakar",
        portion: "1 porsi sedang",
        caloriesKkal: 220,
        carbsGram: 22,
        proteinGram: 10,
        fatGram: 4,
      });
    }
    console.log("Created sample mother, child, screening, and consultation data.");
  }

  // 1. Challenges
  const [{ total: challengeCount }] = await drizzleDb
    .select({ total: count() })
    .from(challenges);
  if (Number(challengeCount) === 0) {
    await drizzleDb.insert(challenges).values([
      {
        title: "Misi Warna Piring",
        description:
          "Makan satu buah atau sayur hari ini, lalu ceritakan warnanya.",
        xp: 30,
        isActive: true,
      },
      {
        title: "Misi Gerak Ceria",
        description:
          "Lakukan lompat tali atau jalan santai selama 20 menit bersama teman atau keluarga.",
        xp: 25,
        isActive: false,
      },
      {
        title: "Misi Teguk Segar",
        description:
          "Minum minimal 6 gelas air putih sebelum waktu tidur tiba.",
        xp: 20,
        isActive: false,
      },
    ]);
    console.log("Created default challenges.");
  }

  // 2. Quizzes
  const [{ total: quizCount }] = await drizzleDb
    .select({ total: count() })
    .from(quizzes);
  if (Number(quizCount) === 0) {
    await drizzleDb.insert(quizzes).values([
      {
        question: "Minuman apa yang paling baik diminum setiap hari?",
        options: JSON.stringify([
          "Air putih",
          "Soda",
          "Teh manis sangat banyak",
        ]),
        answer: "Air putih",
        xp: 20,
        isActive: true,
      },
      {
        question:
          "Sayur berwarna oranye seperti wortel sangat baik untuk kesehatan apa?",
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
    ]);
    console.log("Created default quizzes.");
  }

  // 3. Recommended Menus
  const [{ total: menuCount }] = await drizzleDb
    .select({ total: count() })
    .from(recommendedMenus);
  if (Number(menuCount) === 0) {
    await drizzleDb.insert(recommendedMenus).values([
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
    ]);
    console.log("Created default recommended menus.");
  }

  // 4. Traditional Recipes
  const [{ total: recipeCount }] = await drizzleDb
    .select({ total: count() })
    .from(recipes);
  if (Number(recipeCount) === 0) {
    await drizzleDb.insert(recipes).values([
      {
        title: "Sayur Asem",
        category: "makanan",
        description:
          "Sayur kuah asam segar tradisional kaya serat dan rendah gula.",
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
        imageUrl:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
      },
      {
        title: "Pecel Lele Panggang",
        category: "makanan",
        description:
          "Ikan lele panggang dengan sambal tomat segar tanpa minyak berlebih.",
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
        imageUrl:
          "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=60",
      },
      {
        title: "Nasi Rawon Daging Tanpa Lemak",
        category: "makanan",
        description:
          "Kuah rawon khas kluwek kaya rempah dengan irisan daging sapi tanpa lemak.",
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
        imageUrl:
          "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=500&auto=format&fit=crop&q=60",
      },
      {
        title: "Es Timun Serut Jeruk Nipis",
        category: "minuman",
        description:
          "Minuman dingin segar tanpa sirup buatan, kaya hidrasi dan antioksidan.",
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
        imageUrl:
          "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60",
      },
    ]);
    console.log("Created default traditional recipes.");
  }

  // 5. Education Articles
  const [{ total: articleCount }] = await drizzleDb
    .select({ total: count() })
    .from(educationArticles);
  if (Number(articleCount) === 0) {
    await drizzleDb.insert(educationArticles).values([
      {
        slug: "apa-itu-diabetes-pada-anak",
        title: "Apa itu Diabetes pada Anak?",
        category: "artikel",
        readTimeMinutes: 4,
        summary:
          "Mengenal gejala awal dan perbedaan diabetes tipe 1 dan tipe 2 pada usia tumbuh kembang.",
        content: `Diabetes pada anak adalah kondisi ketika kadar gula (glukosa) dalam darah anak berada di atas batas normal. Tubuh membutuhkan hormon insulin untuk mengubah gula dari makanan menjadi energi.

Gejala Umum yang Perlu Diwaspadai:
1. Sering buang air kecil (terutama di malam hari)
2. Cepat merasa haus walau sudah minum banyak
3. Penurunan berat badan tanpa sebab yang jelas
4. Anak mudah lelah dan lemas saat beraktivitas

Pencegahan sejak dini melalui pola makan piring seimbang dan aktivitas fisik sangat penting untuk menjaga sensitivitas hormon insulin anak.`,
        imageUrl:
          "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500&auto=format&fit=crop&q=60",
      },
      {
        slug: "bahaya-minuman-manis-pada-anak",
        title: "Bahaya Minuman Manis pada Anak",
        category: "artikel",
        readTimeMinutes: 3,
        summary:
          "Mengapa minuman kemasan manis dan boba menjadi pemicu utama lonjakan gula darah anak.",
        content: `Minuman kemasan sering kali mengandung gula tersembunyi hingga 25-40 gram per botol, jauh melebihi batas anjuran konsumsi harian anak (maksimal 20-25 gram per hari).

Dampak Konsumsi Gula Berlebih:
- Memicu lonjakan kadar gula darah secara cepat lalu anjlok drastis (sugar crash)
- Meningkatkan risiko resistensi insulin dan obesitas
- Merusak kesehatan enamel gigi anak

Tips Pengganti Sehat:
Gantikan minuman manis kemasan dengan air putih dingin beraroma buah (infused water) atau jus buah asli tanpa gula tambahan.`,
        imageUrl:
          "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&auto=format&fit=crop&q=60",
      },
      {
        slug: "kreasi-masakan-sehat-praktis",
        title: "Kreasi Masakan Sehat Hari Praktis",
        category: "makanan",
        readTimeMinutes: 5,
        summary:
          "Tips menyusun menu bekal dan hidangan keluarga kaya serat yang disukai anak.",
        content: `Menyiapkan makanan sehat tidak harus rumit atau mahal. Kunci utamanya adalah prinsip "Isi Piringku":
- 1/2 piring berisi sayur dan buah-buahan
- 1/4 piring berisi karbohidrat kompleks (nasi merah, kentang rebus, atau jagung)
- 1/4 piring berisi protein berkualitas (telur, tempe, tahu, ikan, atau daging tanpa lemak)

Gunakan metode memasak kukus, rebus, atau panggang untuk membatasi lemak jenuh dari minyak goreng berulang.`,
        imageUrl:
          "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=60",
      },
      {
        slug: "video-kenali-tanda-bahaya-diabetes-anak",
        title: "Video: Kenali Tanda Bahaya Diabetes Anak Sejak Dini",
        category: "video",
        readTimeMinutes: 5,
        summary:
          "Video panduan visual mengenai gejala 4P (Poliuria, Polidipsia, Polifagia, Penurunan Berat) pada anak usia sekolah.",
        content: `Dalam video edukasi ini, dokter spesialis anak menjelaskan bagaimana mendeteksi secara dini gejala 4P diabetes pada anak:
1. Poliuria: Anak sangat sering buang air kecil, bahkan mengompol kembali.
2. Polidipsia: Rasa haus berlebih yang tidak kunjung reda.
3. Polifagia: Nafsu makan meningkat tajam namun berat badan justru merosot.
4. Penurunan Berat Badan & Kelelahan: Tubuh kekurangan energi karena glukosa tidak dapat masuk ke sel tubuh.

Simak penjelasan lengkap dan langkah pencegahan pertama di rumah melalui video berikut.`,
        mediaType: "youtube",
        videoUrl: "https://www.youtube.com/watch?v=kXYiU_JCYtU",
        speakerOrSource: "dr. Amanda Sp.A - Satgas Gizi & Diabetes Anak",
        imageUrl:
          "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=60",
      },
      {
        slug: "podcast-bicara-pola-asuh-gizi-anak",
        title: "Podcast: Bicara Pola Asuh Gizi Anak & Batasi Minuman Manis",
        category: "podcast",
        readTimeMinutes: 12,
        summary:
          "Obrolan santai bersama bidan komunitas dan dokter spesialis anak tentang trik mengajak anak gemar makan sayur dan air putih.",
        content: `Di episode podcast perdana Si-Cehat ini, kita mengupas tuntas:
- Mengapa anak zaman sekarang lebih cepat terpikat kemasan minuman berpemanis (MBDK).
- Trik psikologis orang tua: jangan melarang total, namun sediakan alternatif lezat di meja makan.
- Peran ayah dan ibu sebagai role-model nyata kebiasaan minum air putih.
- Cara bijak mengatur jajan anak di lingkungan sekolah.

Dengarkan podcast ini sambil menemani aktivitas santai bersama keluarga!`,
        mediaType: "direct_audio",
        audioUrl: "https://actions.google.com/sounds/v1/water/rain_heavy.ogg",
        speakerOrSource: "Bidan Rita & dr. Farhan Sp.A",
        imageUrl:
          "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&auto=format&fit=crop&q=60",
      },
    ]);
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
    await pgSql.end();
  });

import { db } from "../src/lib/db";

async function main() {
  console.log("Seeding CMS baseline content...");

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

# Product Requirements Document

## Si Cehat — Sistem Cerdas Anak Sehat Anti Diabetes

**Versi:** 3.0  
**Platform MVP:** Web Application  
**Metodologi penelitian:** ADDIE  
**Tahap sumber requirement:** Analyze — Focus Group Discussion  
**Target utama:** Anak usia 8–12 tahun / kelas 3–6 SD  
**Target sekunder:** Orang tua/wali dan pihak pendamping kesehatan  
**Fokus MVP:** AI-powered health companion untuk anak, dengan parent dashboard sebagai kontrol keluarga

---

# 1. Latar Belakang

Si Cehat merupakan media edukasi kesehatan yang ditujukan untuk mendukung pencegahan diabetes pada anak melalui penyampaian informasi yang sederhana, menarik, visual, interaktif, dan sesuai usia.

Hasil tahap Analyze melalui FGD menunjukkan kebutuhan terhadap media yang:

* menggunakan bahasa sederhana dan tidak menghakimi;
* menyampaikan informasi secara visual;
* mudah digunakan anak;
* menyediakan mekanisme tanya-jawab;
* memberikan informasi mengenai makanan sehat;
* mempertimbangkan makanan lokal/tradisional;
* membantu membangun kebiasaan hidup sehat;
* memiliki karakter atau elemen visual yang menarik bagi anak;
* mendukung pengalaman seperti game, challenge, reward, quiz, dan reminder;
* memberi orang tua alat sederhana untuk memantau kebiasaan anak.

Versi MVP diperluas dari avatar edukasi percakapan menjadi **AI Health Companion + Parent Engagement**. Produk tetap bukan sistem diagnosis atau clinical decision support system.

---

# 2. Product Vision

Menyediakan teman kesehatan virtual berbentuk avatar buah/sayur yang memungkinkan anak belajar, bertanya, melakukan tantangan sehat, mencatat kebiasaan harian, dan mendapat dukungan dari orang tua.

Si Cehat bertujuan:

> Membuat edukasi kesehatan anak terasa seperti berinteraksi dengan teman, bukan membaca buku kesehatan.

Avatar berfungsi sebagai representasi visual AI sekaligus companion yang mendorong tindakan kecil yang sehat.

AI harus:

1. menjawab dengan bahasa yang dapat dipahami anak;
2. tetap berada dalam domain edukasi kesehatan;
3. tidak bertindak sebagai dokter;
4. tidak memberikan diagnosis;
5. mengarahkan percakapan menuju kebiasaan hidup sehat;
6. memberikan respons singkat dan konkret;
7. membantu mencatat makanan, air minum, aktivitas, quiz, dan challenge melalui tool/function yang terkontrol;
8. melibatkan orang tua melalui ringkasan dan dashboard sederhana.

---

# 3. Tujuan MVP

MVP digunakan untuk mengevaluasi apakah interaksi berbasis avatar AI, tracking ringan, gamifikasi sederhana, dan parent dashboard dapat menjadi media edukasi yang:

* menarik bagi anak;
* mudah digunakan;
* mudah dipahami;
* memberikan informasi yang relevan;
* mendorong pemahaman mengenai makanan dan kebiasaan sehat;
* membantu anak melakukan aksi kecil seperti minum air, bergerak, atau memilih makanan lebih sehat;
* membantu orang tua memahami kebiasaan anak tanpa membuat anak merasa diawasi secara negatif.

MVP **tidak ditujukan sebagai aplikasi diagnosis, medical chatbot, nutrition calculator klinis, rekam medis digital, atau clinical decision support system**.

---

# 4. Requirement Traceability

Setiap requirement utama harus dapat diklasifikasikan sebagai:

```text
FGD-derived requirement → Product inference → Technical implementation decision
```

Contoh:

* Anak menyukai karakter, game, dan interaksi cepat → avatar companion dan challenge harian → komponen AvatarStage, DailyChallenge, dan RewardSummary.
* Orang tua membutuhkan ide menu dan pantauan kebiasaan → parent dashboard → halaman `/parent` dengan ringkasan log anak.
* Anak membutuhkan bahasa sederhana → AI child-safe prompt → server endpoint `/api/chat` dengan safety rules.

Catatan metodologi: apabila dokumen FGD menyebut responden SMP/SMA sementara target PRD adalah anak 8–12 tahun / kelas 3–6 SD, inkonsistensi ini harus diklarifikasi sebelum digunakan sebagai klaim formal penelitian.

---

# 5. Target Pengguna

## 5.1 Primary User

Anak:

* usia 8–12 tahun;
* kelas 3–6 SD;
* memiliki kemampuan membaca dasar;
* tidak diasumsikan memahami istilah medis;
* memiliki tingkat literasi digital yang bervariasi;
* menyukai pengalaman visual, karakter, quick interaction, quiz, reward, dan aktivitas seperti game.

## 5.2 Secondary User

Orang tua/wali:

* membutuhkan ide menu sehat sederhana;
* membutuhkan penjelasan manfaat makanan;
* membutuhkan contoh makanan/minuman yang sebaiknya dibatasi;
* ingin memantau kebiasaan makan, minum, aktivitas, dan progress anak;
* membutuhkan bahasa yang mudah dipahami;
* membutuhkan aplikasi yang mudah diakses dan tidak mahal.

## 5.3 Future Supporting User

Pada pengembangan berikutnya:

* tenaga promosi kesehatan;
* tenaga gizi;
* bidan;
* kader kesehatan;
* pihak sekolah atau UKS.

Health-worker integration tidak termasuk MVP pertama kecuali sebatas konten edukasi umum.

---

# 6. Design Principles

## 6.1 Child First

Interface harus dirancang dari sudut pandang anak terlebih dahulu, bukan dashboard administratif.

## 6.2 Minimal Text

Gunakan teks pendek, visual kuat, dan instruksi satu langkah.

Prinsip layar:

```text
1 screen, 1 message, 1 action
```

## 6.3 Immediate Feedback

Setiap aksi anak harus memberi respons cepat melalui avatar, animasi, progress, bintang, XP, atau pesan singkat.

## 6.4 Non-Judgmental

Produk tidak boleh mempermalukan anak karena makanan, berat badan, atau kebiasaan. Gunakan nada positif dan ajakan kecil.

## 6.5 Simple Before Powerful

Fitur hanya dimasukkan apabila memiliki kontribusi langsung terhadap tujuan penelitian.

MVP boleh memiliki tracking, quiz, reward, dan dashboard, tetapi tetap menghindari kompleksitas berikut:

* autonomous agent bebas;
* complex RAG;
* Live2D;
* model 3D;
* voice cloning;
* emotion recognition;
* social features;
* clinical integration.

## 6.6 Controlled AI

AI bukan general-purpose chatbot.

AI adalah:

> Educational companion, bukan medical advisor.

AI tidak boleh bebas menjawab seluruh hal kesehatan. Domain, tool, dan fallback harus dikontrol server-side.

---

# 7. Core Product Loop

Loop utama Si Cehat:

```text
Talk → Learn → Do → Track → Reward → Repeat
```

Makna loop:

* Talk: anak bertanya atau bercerita kepada avatar.
* Learn: AI memberi edukasi singkat dan sesuai usia.
* Do: anak mendapat ajakan aksi kecil.
* Track: anak mencatat air minum, makanan, aktivitas, atau challenge.
* Reward: sistem memberi XP, bintang, badge, atau pujian.
* Repeat: anak kembali berinteraksi melalui reminder atau challenge berikutnya.

---

# 8. Core User Flow

```text
Buka Si Cehat
      ↓
Onboarding singkat
      ↓
Pilih mode / masuk sebagai anak atau orang tua
      ↓
Anak memilih avatar
      ↓
┌──────────────────────────┐
│ Default Orb              │
│ Apel                     │
│ Brokoli                  │
│ Wortel                   │
└────────────┬─────────────┘
             ↓
      Child Dashboard
             ↓
┌──────────────────────────┐
│ Chat AI                  │
│ Daily Challenge          │
│ Quiz                     │
│ Food/Water/Activity Log  │
│ Reward Progress          │
└────────────┬─────────────┘
             ↓
      Parent Dashboard
             ↓
┌──────────────────────────┐
│ Ringkasan kebiasaan      │
│ Menu dan resep           │
│ Progress anak            │
│ Reminder                 │
└──────────────────────────┘
```

---

# 9. Product Modes

## 9.1 Child Mode

Child Mode adalah pengalaman utama anak.

Fitur:

* avatar AI companion;
* chat edukasi;
* suggested questions;
* food logging ringan;
* water logging;
* activity logging;
* daily challenge;
* quiz;
* XP/reward;
* reminder sederhana;
* progress visual.

## 9.2 Parent Mode

Parent Mode adalah dashboard sederhana untuk orang tua/wali.

Fitur:

* ringkasan makanan/minuman/aktivitas anak;
* progress challenge dan quiz;
* ide menu sehat;
* resep sederhana;
* penjelasan manfaat makanan;
* contoh makanan/minuman yang perlu dibatasi;
* reminder dukungan keluarga.

Parent Mode tidak boleh menjadi alat untuk menghukum atau mempermalukan anak.

---

# 10. Authentication and Roles

Karena MVP diperluas dengan parent dashboard dan log kebiasaan, aplikasi membutuhkan mekanisme identitas sederhana.

Requirement:

* user dapat memilih atau membuat profil anak;
* user dapat mengakses Child Mode;
* orang tua dapat mengakses Parent Mode;
* data anak harus diperlakukan sebagai data sensitif;
* untuk prototype penelitian, data dummy dapat digunakan jika consent dan tata kelola data belum siap.

Implementasi MVP dapat menggunakan auth sederhana, local-first profile, atau backend ringan. Jika data nyata anak dikumpulkan, consent dan tata kelola data penelitian wajib disiapkan sebelum evaluasi.

---

# 11. Avatar System

## 11.1 Karakter

MVP menyediakan empat pilihan.

### Default Orb

Karakter abstrak berbentuk lingkaran.

Tujuan:

* memberikan opsi visual netral;
* menjadi avatar default;
* dapat digunakan sebagai baseline terhadap karakter makanan.

### Apel

Representasi kategori buah.

Karakteristik:

* merah;
* bulat;
* ramah;
* mudah dikenali.

### Brokoli

Representasi kategori sayuran hijau.

Karakteristik:

* hijau;
* siluet berbeda;
* visual playful.

### Wortel

Representasi sayuran.

Karakteristik:

* oranye;
* bentuk vertikal;
* mudah dikenali.

---

# 12. Avatar State Machine

Avatar mempunyai state utama berikut.

```typescript
type AvatarState =
  | "idle"
  | "listening"
  | "thinking"
  | "talking"
  | "happy"
  | "celebrating"
  | "confused";
```

## Idle

Kondisi normal.

Animasi:

* floating;
* breathing;
* blinking.

## Listening

Digunakan ketika anak sedang memberikan input.

Animasi:

* sedikit membesar;
* mata fokus;
* indikator listening.

## Thinking

Digunakan ketika menunggu respons LLM atau tool call.

Animasi:

* floating lebih lambat;
* expression berpikir;
* bubble/dots.

## Talking

Digunakan ketika jawaban sedang ditampilkan/dibacakan.

Animasi:

* mouth animation;
* subtle bounce;
* expression positif.

## Happy

Digunakan setelah anak menyelesaikan aksi sehat kecil.

## Celebrating

Digunakan ketika challenge, quiz, streak, atau reward tercapai.

## Confused

Digunakan untuk fallback ringan saat pertanyaan tidak jelas atau keluar domain.

State transition utama:

```text
IDLE → LISTENING → THINKING → TALKING → HAPPY/CELEBRATING → IDLE
                         ↓
                      CONFUSED → IDLE
```

---

# 13. Avatar Customization

Customization sengaja dibatasi.

## Character

```text
○ Default
○ Apel
○ Brokoli
○ Wortel
```

## Accessories

Opsional:

```text
None
Kacamata
Headphone
Topi
```

Aksesori bersifat kosmetik dan tidak memengaruhi kemampuan AI.

## Color

Custom color hanya diterapkan pada **Default Orb**.

Karakter buah/sayur menggunakan warna aslinya agar identitas makanan tetap jelas.

---

# 14. Child Dashboard

Child Dashboard adalah hub utama anak setelah onboarding.

Konten utama:

* avatar dan greeting;
* tombol tanya Si Cehat;
* challenge hari ini;
* quiz singkat;
* progress XP/bintang;
* tombol catat minum air;
* tombol catat makanan;
* tombol catat aktivitas;
* shortcut suggested questions.

Layout harus mobile-first, visual, dan tidak padat.

---

# 15. Chat Interface

Layout utama:

```text
┌─────────────────────────────────┐
│ Si Cehat                    ⚙   │
├─────────────────────────────────┤
│                                 │
│              🍎                 │
│          [ AI Avatar ]          │
│                                 │
│       "Halo! Mau belajar        │
│        sehat hari ini?"         │
│                                 │
├─────────────────────────────────┤
│ AI: Halo!                       │
│ User: Aku tadi minum 2 gelas    │
│ AI: Hebat! Aku catat ya.        │
├─────────────────────────────────┤
│ [Tulis pertanyaan...]      ➤    │
└─────────────────────────────────┘
```

Chat tidak hanya menjawab pertanyaan, tetapi juga dapat mengubah percakapan menjadi aksi terkontrol seperti logging dan challenge completion.

---

# 16. Suggested Questions

Untuk mengurangi blank-state problem, sistem menyediakan contoh pertanyaan.

Contoh:

* Kenapa kita harus makan sayur?
* Boleh minum minuman manis setiap hari?
* Buah apa yang baik untuk tubuh?
* Kenapa kita harus bergerak dan bermain?
* Apa contoh makanan sehat?
* Apa makanan Sunda yang sehat?
* Aku tadi minum 2 gelas, boleh dicatat?
* Challenge sehat hari ini apa?
* Quiz sehat yuk!

Pertanyaan dipilih dengan satu klik.

---

# 17. Tracking Requirements

Tracking pada MVP bersifat ringan, edukatif, dan tidak klinis.

## 17.1 Food Logging

Anak atau orang tua dapat mencatat makanan secara sederhana.

Contoh input:

* nasi;
* ayam;
* sayur bayam;
* apel;
* es teh manis;
* makanan tradisional seperti lotek, karedok, gado-gado, atau seblak.

Sistem dapat memberi edukasi umum, bukan penilaian medis.

## 17.2 Water Logging

Anak dapat mencatat jumlah gelas air minum.

Contoh:

> Aku tadi minum 2 gelas.

AI dapat memanggil tool `log_water(2)` dan memberi respons positif.

## 17.3 Activity Logging

Anak dapat mencatat aktivitas fisik sederhana.

Contoh:

* bermain bola;
* jalan kaki;
* bersepeda;
* senam;
* membantu pekerjaan rumah.

## 17.4 Progress Summary

Sistem menampilkan ringkasan harian/mingguan yang mudah dipahami.

Progress tidak boleh berupa diagnosis, skor risiko diabetes, atau label buruk/baik terhadap anak.

---

# 18. Daily Challenge, Quiz, and Reward

## 18.1 Daily Challenge

Challenge harus sederhana dan dapat dilakukan anak.

Contoh:

* Minum air putih hari ini.
* Makan satu jenis sayur.
* Bermain aktif 15 menit.
* Pilih buah sebagai camilan.
* Tidur lebih awal.

## 18.2 Quiz

Quiz digunakan untuk mengevaluasi pemahaman ringan.

Contoh:

> Mana minuman yang lebih baik diminum setiap hari?

Pilihan:

* Air putih
* Minuman bersoda
* Es teh manis

## 18.3 XP, Stars, Badges, and Streaks

Reward bersifat motivasional.

Requirement:

* anak mendapat XP/bintang setelah menyelesaikan aksi;
* badge dapat diberikan untuk milestone sederhana;
* streak boleh digunakan tetapi tidak boleh membuat anak merasa gagal;
* avatar memberi pujian yang spesifik dan tidak berlebihan.

---

# 19. Reminder Requirements

Reminder membantu kebiasaan sehat tanpa mengganggu.

MVP dapat menyediakan reminder untuk:

* minum air;
* challenge harian;
* aktivitas fisik;
* waktu tidur;
* orang tua melihat ringkasan.

Browser notification bersifat opsional dan harus meminta izin pengguna.

---

# 20. Parent Dashboard

Parent Dashboard menampilkan informasi sederhana agar orang tua dapat mendukung anak.

Konten:

* profil anak;
* avatar yang dipilih;
* jumlah pertanyaan atau interaksi;
* log makanan ringkas;
* log air minum;
* log aktivitas;
* completion challenge;
* quiz completion;
* reward/progress;
* menu recommendation;
* resep sederhana;
* pesan edukasi untuk orang tua.

Parent Dashboard tidak menampilkan diagnosis, prediksi penyakit, skor risiko medis, atau rekomendasi obat.

---

# 21. Menu and Recipe Recommendation

Sistem dapat memberikan rekomendasi menu dan resep sederhana.

Requirement:

* menggunakan bahasa sederhana;
* menggunakan bahan familiar dan lokal jika memungkinkan;
* memberi alternatif yang lebih sehat tanpa melarang total;
* mempertimbangkan makanan tradisional;
* menjelaskan bahwa makanan tradisional tidak otomatis sehat.

Prinsip penting:

> Traditional ≠ automatically healthy.

Contoh:

* lotek dengan banyak sayur dapat menjadi pilihan baik;
* gorengan sebaiknya tidak terlalu sering;
* minuman manis sebaiknya dibatasi;
* porsi dan kebiasaan harian tetap penting.

---

# 22. AI Requirements

## 22.1 AI Role

AI bertindak sebagai:

**Asisten edukasi kesehatan Si Cehat untuk anak usia 8–12 tahun.**

AI juga dapat membantu orang tua memahami kebiasaan sehat anak secara umum.

## 22.2 Response Characteristics

Respons harus:

* singkat;
* konkret;
* ramah;
* menggunakan Bahasa Indonesia sederhana;
* sesuai usia;
* menghindari terminologi medis yang tidak diperlukan;
* menggunakan contoh makanan yang familiar;
* tidak menakut-nakuti;
* tidak body shaming;
* tidak memberi rasa bersalah.

Target panjang jawaban anak:

**2–5 kalimat pendek.**

Target panjang jawaban orang tua:

**3–7 kalimat pendek atau bullet ringkas.**

---

# 23. AI Scope

## Allowed

AI dapat membahas:

* makanan sehat;
* buah;
* sayuran;
* gula;
* minuman;
* kebiasaan makan;
* sarapan;
* aktivitas fisik;
* tidur;
* pola hidup sehat;
* konsep dasar diabetes;
* makanan tradisional;
* pilihan makanan yang lebih sehat;
* challenge sehat;
* quiz edukatif;
* pencatatan kebiasaan non-klinis.

## Restricted

AI tidak boleh:

* mendiagnosis penyakit;
* menentukan anak menderita diabetes;
* memberikan dosis obat;
* menggantikan dokter;
* memberikan keputusan klinis;
* memberikan diet ekstrem;
* menakut-nakuti anak;
* melakukan body shaming;
* membuat anak merasa bersalah;
* memberi skor risiko diabetes;
* menyimpulkan status gizi secara klinis;
* menjadikan LLM sebagai sumber tunggal data nutrisi.

---

# 24. Out-of-Scope Handling

Pertanyaan tidak relevan tidak perlu ditolak secara kasar.

Contoh:

**User**

> Siapa presiden Indonesia?

**AI**

> Aku lebih jago ngobrol tentang makanan dan kebiasaan sehat. Mau tanya tentang makanan favoritmu?

Dengan demikian persona tetap konsisten.

---

# 25. Medical Boundary

Untuk pertanyaan seperti:

> Aku sering pusing, apakah aku diabetes?

AI tidak boleh menjawab:

> Ya, kemungkinan kamu diabetes.

Respons yang diharapkan:

> Pusing bisa terjadi karena banyak hal, jadi kita tidak bisa tahu hanya dari itu. Ceritakan kepada orang tua atau orang dewasa yang kamu percaya supaya mereka bisa membantu memeriksakannya.

Untuk orang tua, respons yang diharapkan:

> Saya tidak bisa menentukan diagnosis. Jika keluhan anak sering terjadi atau membuat khawatir, sebaiknya konsultasikan dengan tenaga kesehatan. Si Cehat hanya membantu edukasi kebiasaan sehat.

---

# 26. System Prompt

```text
Kamu adalah Si Cehat, asisten edukasi kesehatan dan teman kesehatan virtual
untuk anak usia 8 sampai 12 tahun.

Tujuanmu adalah membantu anak memahami makanan, minuman, aktivitas fisik,
tidur, dan kebiasaan hidup sehat, terutama untuk edukasi pencegahan diabetes.

Kamu boleh membantu mencatat kebiasaan ringan seperti makanan, air minum,
aktivitas, challenge, dan quiz jika sistem menyediakan tool yang sesuai.

ATURAN:

1. Gunakan Bahasa Indonesia sederhana.
2. Gunakan kalimat pendek.
3. Jawaban normal untuk anak maksimal 5 kalimat pendek.
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
14. Jika pertanyaan menyangkut gejala atau kondisi kesehatan pribadi,
    sarankan berbicara dengan orang tua/wali dan tenaga kesehatan.
15. Jika pertanyaan berada jauh di luar topik, arahkan secara singkat
    kembali ke makanan dan kebiasaan sehat.
16. Jangan melakukan body shaming atau membuat anak merasa bersalah.
17. Jangan membuat skor risiko diabetes atau status gizi klinis.
18. Untuk data nutrisi, gunakan knowledge base atau tool yang disediakan.
    Jangan mengarang angka nutrisi.
19. Makanan tradisional tidak otomatis sehat atau tidak sehat. Jelaskan
    dengan seimbang.

Kamu bukan dokter dan tidak menggantikan tenaga kesehatan.

Nada bicara:
ramah, sederhana, positif, tidak menghakimi, dan sesuai untuk anak SD.
```

---

# 27. LLM Architecture

Provider harus interchangeable.

```text
Frontend
   │
   ▼
POST /api/chat
   │
   ▼
AI Orchestrator
   │
   ├── System Prompt
   ├── User Context
   ├── Recent Conversation
   ├── Curated Knowledge Base
   ├── Tool / Function Calling
   ├── Safety Layer
   │
   ▼
OpenAI-compatible API / Gemini-compatible provider
```

Konfigurasi server-only:

```env
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=
```

Dengan demikian provider dapat diganti tanpa mengubah UI.

Catatan provider prototype:

* Gemini dapat digunakan karena free tier, function calling, structured output, dan ekosistem JavaScript.
* Groq dapat dievaluasi sebagai alternatif low-latency.
* ElevenLabs dapat dievaluasi untuk TTS opsional, bukan MVP wajib.

---

# 28. AI Tool / Function Calling

AI dapat memanggil tool terkontrol untuk mengubah percakapan menjadi aksi.

Candidate functions:

```typescript
log_food(input)
log_water(glasses)
log_activity(input)
get_progress(childId)
get_today_challenge(childId)
complete_challenge(challengeId)
get_recommended_menu(context)
get_quiz(topic)
submit_quiz_answer(input)
```

Contoh vertical slice:

```text
Anak: Aku tadi minum 2 gelas.
AI Orchestrator: log_water(2)
System: log diperbarui
Avatar: Hebat! Aku catat 2 gelas air putih ya. Teruskan kebiasaan baikmu!
Dashboard: progress air minum bertambah 2 gelas
```

Tool tidak boleh digunakan untuk diagnosis, prediksi penyakit, atau keputusan klinis.

---

# 29. Knowledge Base and Nutrition Reliability

LLM tidak boleh menjadi sumber tunggal data nutrisi.

MVP membutuhkan curated knowledge base ringan untuk:

* kategori makanan umum;
* contoh buah dan sayur;
* contoh minuman manis;
* makanan tradisional/lokal;
* tips porsi umum non-klinis;
* ide menu sehat;
* quiz dan challenge.

Knowledge base harus disusun sebagai materi edukasi umum, bukan kalkulator nutrisi klinis.

Jika informasi tidak tersedia di knowledge base, AI harus menjawab secara umum atau mengatakan tidak yakin, bukan mengarang angka nutrisi.

---

# 30. Security and Privacy Requirements

API key **tidak boleh berada di frontend**.

Tidak diperbolehkan:

```typescript
const API_KEY = "sk-...";
```

pada client bundle.

Semua komunikasi dengan provider dilakukan melalui server endpoint:

```text
Browser
   │
   ▼
/api/chat
   │
   ▼
LLM Provider
```

Data anak dan data kesehatan/kebiasaan harus diperlakukan sensitif.

Requirement:

* jangan memakai data nyata anak tanpa consent penelitian;
* gunakan dummy data untuk testing free-tier AI;
* jangan mengirim data yang tidak diperlukan ke provider AI;
* simpan hanya data minimum yang dibutuhkan MVP;
* parent dashboard hanya boleh menampilkan data anak yang terkait dengan profil keluarga/prototype tersebut.

---

# 31. Data Strategy

Karena MVP diperluas dengan parent dashboard dan tracking, aplikasi membutuhkan penyimpanan data ringan.

Data yang perlu disimpan:

* profil anak;
* role orang tua/anak;
* preferensi avatar;
* food log;
* water log;
* activity log;
* challenge progress;
* quiz result;
* reward/XP;
* reminder settings.

Untuk prototype awal, opsi implementasi:

* localStorage atau IndexedDB untuk demo lokal;
* backend ringan dengan database sederhana untuk evaluasi multi-user;
* dummy dataset jika consent belum siap.

Conversation history dapat tetap session-local kecuali ada requirement penelitian yang jelas untuk menyimpannya.

Contoh avatar preference:

```json
{
  "character": "broccoli",
  "accessory": "headphone",
  "orbColor": "#6FCF97"
}
```

---

# 32. Functional Requirements

### FR-01

User dapat memilih avatar.

### FR-02

User dapat mengganti avatar.

### FR-03

Pilihan avatar tersimpan pada browser atau profil user.

### FR-04

Avatar memiliki interaction states utama dan state reward/fallback.

### FR-05

User dapat mengetik pertanyaan.

### FR-06

Sistem mengirim pertanyaan ke AI orchestrator server-side.

### FR-07

AI memberikan jawaban sesuai target anak.

### FR-08

AI membatasi pembahasan pada domain edukasi kesehatan.

### FR-09

User dapat memilih suggested question.

### FR-10

Sistem menampilkan loading/thinking state.

### FR-11

Error API ditampilkan dengan bahasa sederhana.

### FR-12

API credential tidak terekspos pada browser.

### FR-13

Anak dapat mencatat makanan secara sederhana.

### FR-14

Anak dapat mencatat jumlah gelas air minum.

### FR-15

Anak dapat mencatat aktivitas fisik.

### FR-16

Anak dapat melihat progress harian.

### FR-17

Anak dapat mengerjakan daily challenge.

### FR-18

Anak dapat mengerjakan quiz edukatif.

### FR-19

Sistem memberikan XP, bintang, badge, atau reward sederhana.

### FR-20

Orang tua dapat melihat parent dashboard.

### FR-21

Orang tua dapat melihat ringkasan makanan, air minum, aktivitas, challenge, quiz, dan reward.

### FR-22

Sistem menyediakan menu recommendation dan resep sederhana.

### FR-23

Sistem menyediakan reminder sederhana.

### FR-24

AI dapat melakukan tool/function calling yang aman untuk logging dan progress.

### FR-25

AI tidak dapat menggunakan tool untuk diagnosis, obat, atau keputusan klinis.

---

# 33. Non-Functional Requirements

## Performance

Initial load:

< 3 detik pada koneksi normal untuk halaman utama.

AI response target:

* respons text awal ideal < 5 detik;
* fallback ramah jika provider lambat atau gagal.

Avatar animation:

target 60 FPS.

## Accessibility

* ukuran font minimum sekitar 16 px;
* contrast mencukupi;
* tombol besar;
* tidak bergantung hanya pada warna;
* motion tidak berlebihan;
* quiz dan challenge dapat digunakan tanpa gesture kompleks.

## Responsive

Minimum:

```text
Mobile    360px+
Tablet    768px+
Desktop   1024px+
```

Prioritas:

**mobile-first**.

---

# 34. Proposed Technology

```text
Next.js
TypeScript
Tailwind CSS
Framer Motion
OpenAI-compatible API / Gemini-compatible provider
Zod
localStorage / IndexedDB for local prototype
Lightweight database for multi-user parent dashboard if needed
```

Database tidak wajib untuk demo lokal, tetapi menjadi kebutuhan apabila MVP diuji dengan akun/profil nyata dan parent dashboard multi-user.

---

# 35. Component Architecture

```text
App
│
├── Onboarding
│
├── RoleModeSelector
│
├── AvatarSelector
│   ├── CharacterCard
│   ├── AccessorySelector
│   └── OrbColorSelector
│
├── ChildDashboard
│   ├── AvatarStage
│   ├── DailyChallengeCard
│   ├── QuizCard
│   ├── QuickLogActions
│   ├── RewardProgress
│   └── SuggestedQuestions
│
├── ChatPage
│   ├── Header
│   ├── AvatarStage
│   │   ├── AvatarRenderer
│   │   ├── Expression
│   │   └── Accessory
│   ├── ChatMessages
│   ├── SuggestedQuestions
│   └── ChatInput
│
└── ParentDashboard
    ├── ChildSummary
    ├── FoodLogSummary
    ├── WaterLogSummary
    ├── ActivitySummary
    ├── ChallengeProgress
    ├── QuizProgress
    ├── MenuRecommendation
    └── ReminderSettings
```

---

# 36. Application State

```typescript
interface AppState {
  user: {
    role: "child" | "parent";
    childId?: string;
  };

  childProfile: {
    id: string;
    name: string;
    age?: number;
  };

  avatar: {
    character:
      | "default"
      | "apple"
      | "broccoli"
      | "carrot";

    state:
      | "idle"
      | "listening"
      | "thinking"
      | "talking"
      | "happy"
      | "celebrating"
      | "confused";

    accessory:
      | "none"
      | "glasses"
      | "headphone"
      | "hat";

    orbColor: string;
  };

  chat: {
    messages: Message[];
    loading: boolean;
    error?: string;
  };

  tracking: {
    foodLogs: FoodLog[];
    waterLogs: WaterLog[];
    activityLogs: ActivityLog[];
  };

  learning: {
    dailyChallenge?: Challenge;
    completedChallenges: ChallengeResult[];
    quizResults: QuizResult[];
    xp: number;
    badges: Badge[];
  };
}
```

---

# 37. MVP Pages

MVP expanded membutuhkan halaman utama berikut.

```text
/
Onboarding

/avatar
Avatar customization

/child
Child dashboard

/chat
AI interaction

/parent
Parent dashboard
```

Settings dapat menggunakan modal/drawer dan tidak perlu halaman terpisah.

---

# 38. Research Instrumentation

Karena aplikasi digunakan sebagai prototype penelitian, beberapa data interaksi dapat berguna untuk evaluasi.

Contoh metrik:

* avatar yang dipilih;
* jumlah pertanyaan;
* suggested question yang dipilih;
* durasi sesi;
* jumlah error;
* pergantian avatar;
* completion rate;
* challenge completion;
* quiz completion;
* food/water/activity log count;
* reminder interaction;
* AI latency;
* tool/function-call success rate;
* fallback rate;
* task completion;
* time-on-task;
* error rate;
* SUS;
* knowledge score;
* healthy food recognition;
* parent perceived usefulness;
* child perceived enjoyment.

Tracking tidak boleh dimasukkan secara sembarangan apabila penelitian belum memiliki mekanisme consent dan tata kelola datanya.

Untuk MVP awal tanpa consent, telemetry harus dinonaktifkan atau menggunakan dummy data.

---

# 39. Acceptance Criteria

MVP dianggap selesai ketika:

* empat avatar tersedia;
* user dapat memilih avatar;
* avatar preference tersimpan;
* avatar mempunyai interaction states yang dibutuhkan;
* child dashboard tersedia;
* chat dapat berkomunikasi dengan AI provider melalui server endpoint;
* provider dapat dikonfigurasi melalui environment;
* AI menggunakan persona Si Cehat;
* jawaban sesuai bahasa anak;
* AI menangani pertanyaan di luar domain;
* AI tidak memberikan diagnosis;
* anak dapat mencatat makanan;
* anak dapat mencatat air minum;
* anak dapat mencatat aktivitas;
* anak dapat mengerjakan daily challenge;
* anak dapat mengerjakan quiz;
* reward/XP/bintang tersedia;
* parent dashboard menampilkan ringkasan anak;
* menu recommendation tersedia;
* reminder sederhana tersedia;
* AI tool/function calling dapat menjalankan minimal satu vertical slice logging;
* UI responsive;
* API key tidak terekspos;
* data anak tidak dikirim atau disimpan tanpa kebutuhan dan consent yang jelas.

---

# 40. Out of Scope MVP

Tidak dikerjakan pada fase pertama:

* diagnosis;
* medical prediction;
* telemedicine;
* e-PPGBM integration;
* Puskesmas integration;
* automated referral;
* clinical decision support;
* medical record system;
* rekomendasi obat;
* diet ekstrem;
* growth monitoring klinis;
* long-term AI memory;
* complex RAG;
* voice recognition;
* advanced speech-to-text;
* TTS wajib;
* Live2D;
* 3D avatar;
* advanced lip sync;
* social features;
* PWA/offline cache wajib.

Requirement tersebut dapat dievaluasi pada iterasi ADDIE berikutnya.

---

# 41. Success Criteria Penelitian

Evaluasi sebaiknya lebih fokus pada outcome daripada sekadar keberhasilan teknis.

Variabel yang dapat dievaluasi antara lain:

### Usability

Apakah anak dapat menggunakan aplikasi tanpa banyak bantuan?

### Comprehension

Apakah jawaban AI dapat dipahami?

### Engagement

Apakah avatar, reward, quiz, dan challenge membuat pengalaman lebih menarik?

### Relevance

Apakah jawaban sesuai dengan pertanyaan anak?

### Perceived Friendliness

Apakah karakter terasa ramah dan tidak mengintimidasi?

### Preference

Apakah anak lebih memilih:

* avatar abstrak;
* avatar buah;
* avatar sayur?

### Behavior Support

Apakah tracking, challenge, reminder, dan reward membantu anak melakukan aksi sehat kecil?

### Parent Usefulness

Apakah parent dashboard membantu orang tua memahami dan mendukung kebiasaan anak?

Keberadaan **Default Orb** menjadi menarik karena dapat berfungsi sebagai representasi abstrak untuk dibandingkan dengan avatar bertema makanan.

---

# 42. Definition of Done

Prototype dinyatakan siap untuk evaluasi ketika seluruh core flow berikut dapat dijalankan:

```text
Open App
   ↓
Choose Role / Profile
   ↓
Choose Avatar
   ↓
Open Child Dashboard
   ↓
Ask Question
   ↓
Avatar Thinks
   ↓
AI Answers
   ↓
Log Water/Food/Activity
   ↓
Complete Challenge or Quiz
   ↓
Receive Reward
   ↓
Open Parent Dashboard
   ↓
Parent Reviews Summary
   ↓
Ask Again
```

tanpa membutuhkan konfigurasi teknis dari pengguna akhir.

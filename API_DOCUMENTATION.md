# Si-Cehat API Documentation

Dokumentasi lengkap seluruh REST API endpoint pada platform **Si-Cehat**, dirancang berdasarkan spesifikasi arsitektur produk dan analisis fitur desain mockup aplikasi (Figma). Dokumen ini mencakup spesifikasi parameter teknis, skema data, serta contoh implementasi siap pakai (*cURL* dan *JavaScript / TypeScript Fetch*).

Endpoint dikelompokkan secara terstruktur berdasarkan peran dan modul:
- **Role: Anak & Edukasi Interaktif (Tamu / Publik)**
- **Role: Parent / Ibu & Fitur Kesehatan Keluarga (Guardian Session)**
- **Role: Administrator (Wajib Login Admin)**

---

## Daftar Isi
- [1. Standar Konvensi & Otentikasi](#1-standar-konvensi--otentikasi)
- [2. Role: Anak & Edukasi Interaktif (Publik / Tamu)](#2-role-anak--edukasi-interaktif-publik--tamu)
  - [2.1. POST /api/chat - AI Chat Edukasi Si-Cehat](#21-post-apichat---ai-chat-edukasi-si-cehat)
  - [2.2. GET /api/avatar - Konfigurasi Avatar Edukasi](#22-get-apiavatar---konfigurasi-avatar-edukasi)
  - [2.3. POST /api/avatar - Simpan Konfigurasi Avatar](#23-post-apiavatar---simpan-konfigurasi-avatar)
  - [2.4. GET /api/progress - Ambil Progres Harian & Gamifikasi](#24-get-apiprogress---ambil-progres-harian--gamifikasi)
  - [2.5. POST /api/progress - Catat Progres Harian](#25-post-apiprogress---catat-progres-harian)
  - [2.6. GET /api/content - Ambil Konten Misi & Kuis Harian](#26-get-apicontent---ambil-konten-misi--kuis-harian)
- [3. Role: Parent / Ibu & Manajemen Kesehatan Anak](#3-role-parent--ibu--manajemen-kesehatan-anak)
  - [3.1. POST /api/auth/register - Pendaftaran Akun Ibu](#31-post-apiauthregister---pendaftaran-akun-ibu)
  - [3.2. GET /api/parent/profile - Ambil Data Profil Ibu](#32-get-apiparentprofile---ambil-data-profil-ibu)
  - [3.3. PUT /api/parent/profile - Perbarui Data Profil Ibu](#33-put-apiparentprofile---perbarui-data-profil-ibu)
  - [3.4. GET /api/children - Ambil Daftar Anak](#34-get-apichildren---ambil-daftar-anak)
  - [3.5. POST /api/children - Tambah Profil Anak](#35-post-apichildren---tambah-profil-anak)
  - [3.6. GET /api/children/[id] - Ambil Detail Profil & Riwayat Anak](#36-get-apichildrenid---ambil-detail-profil--riwayat-anak)
  - [3.7. PUT /api/children/[id] - Perbarui Profil & Riwayat Kesehatan Anak](#37-put-apichildrenid---perbarui-profil--riwayat-kesehatan-anak)
  - [3.8. POST /api/screening - Kalkulasi Skrining Risiko Diabetes Anak](#38-post-apiscreening---kalkulasi-skrining-risiko-diabetes-anak)
  - [3.9. GET /api/screening - Riwayat Skrining Risiko Diabetes](#39-get-apiscreening---riwayat-skrining-risiko-diabetes)
  - [3.10. GET /api/tracker/growth - Kurva & Riwayat Pertumbuhan WHO](#310-get-apitrackergrowth---kurva--riwayat-pertumbuhan-who)
  - [3.11. POST /api/tracker/growth - Catat Pengukuran Tumbuh Kembang](#311-post-apitrackergrowth---catat-pengukuran-tumbuh-kembang)
  - [3.12. POST /api/nutrition/calculate - Kalkulator Nutrisi & Kandungan Gula](#312-post-apinutritioncalculate---kalkulator-nutrisi--kandungan-gula)
  - [3.13. GET /api/food-diary - Diary Makan Harian Per Slot Waktu](#313-get-apifood-diary---diary-makan-harian-per-slot-waktu)
  - [3.14. POST /api/food-diary - Catat Diary Konsumsi Makanan](#314-post-apifood-diary---catat-diary-konsumsi-makanan)
  - [3.15. GET /api/recipes - Daftar Resep Tradisional Sehat](#315-get-apirecipes---daftar-resep-tradisional-sehat)
  - [3.16. GET /api/recipes/[id] - Detail Bahan & Instruksi Resep](#316-get-apirecipesid---detail-bahan--instruksi-resep)
  - [3.17. GET /api/reminders - Ambil Daftar Pengingat Rutinitas](#317-get-apireminders---ambil-daftar-pengingat-rutinitas)
  - [3.18. POST /api/reminders - Tambah Pengingat Baru](#318-post-apireminders---tambah-pengingat-baru)
  - [3.19. PATCH /api/reminders/[id] - Toggle Aktif/Nonaktif Jam Pengingat](#319-patch-apiremindersid---toggle-aktifnonaktif-jam-pengingat)
  - [3.20. GET /api/education/articles - Pustaka Edukasi (Artikel/Makanan/Video)](#320-get-apieducationarticles---pustaka-edukasi-artikelmakananvideo)
  - [3.21. GET /api/education/articles/[id] - Detail Materi Edukasi](#321-get-apieducationarticlesid---detail-materi-edukasi)
  - [3.22. GET /api/consultations/specialists - Direktori Tenaga Medis Mitra](#322-get-apiconsultationsspecialists---direktori-tenaga-medis-mitra)
  - [3.23. GET /api/consultations - Riwayat Sesi Konsultasi Ibu](#323-get-apiconsultations---riwayat-sesi-konsultasi-ibu)
  - [3.24. POST /api/consultations - Ajukan Sesi Telekonsultasi Tenaga Medis](#324-post-apiconsultations---ajukan-sesi-telekonsultasi-tenaga-medis)
- [4. Role: Administrator (Wajib Login Admin)](#4-role-administrator-wajib-login-admin)
  - [4.1. GET /api/admin/metrics - Ringkasan Analitik Platform](#41-get-apiadminmetrics---ringkasan-analitik-platform)
  - [4.2. GET /api/admin/export - Ekspor Data Riset Anonim (CSV / JSON)](#42-get-apiadminexport---ekspor-data-riset-anonim-csv--json)
  - [4.3. GET /api/admin/content - Ambil Konten Edukasi CMS](#43-get-apiadmincontent---ambil-konten-edukasi-cms)
  - [4.4. POST /api/admin/content - Buat Konten Edukasi Baru](#44-post-apiadmincontent---buat-konten-edukasi-baru)
  - [4.5. GET /api/admin/bot-config - Ambil Konfigurasi Model AI](#45-get-apiadminbot-config---ambil-konfigurasi-model-ai)
  - [4.6. PUT /api/admin/bot-config - Perbarui Parameter Model AI](#46-put-apiadminbot-config---perbarui-parameter-model-ai)
  - [4.7. POST /api/admin/bot-config/test - Pengujian Konektivitas Model AI](#47-post-apiadminbot-configtest---pengujian-konektivitas-model-ai)

---

## 1. Standar Konvensi & Otentikasi

- **Base URL:** `http://localhost:3000`
- **Format Payload:** `application/json; charset=utf-8`
- **Zona Waktu:** Asia/Jakarta (WIB, UTC+7)
- **Otentikasi Pengguna:**
  - **Mode Publik / Tamu (Anak):** Tidak memerlukan header otentikasi. Data sesi tersimpan secara lokal (`localStorage`) atau dialirkan melalui `sessionId`.
  - **Sesi Orang Tua (Guardian):** Menggunakan Cookie Sesi NextAuth (`authjs.session-token`).
  - **Hak Akses Administrator:** **Wajib Login Administrator**. Sesi harus memiliki atribut `role: "ADMIN"`. Permintaan tanpa otentikasi akan ditolak dengan `401 Unauthorized`, dan akun non-admin akan ditolak dengan `403 Forbidden`.

---

## 2. Role: Anak & Edukasi Interaktif (Publik / Tamu)

### 2.1. POST `/api/chat` - AI Chat Edukasi Si-Cehat
Inferensi percakapan edukasi interaktif pencegahan diabetes ramah anak usia 8–12 tahun. Mengembalikan respon maksimal 5 kalimat dalam Bahasa Indonesia dan mematuhi etika batasan medis.

#### Request Setting
| Setting | Value |
| :--- | :--- |
| **HTTP Method** | `POST` |
| **Path** | `/api/chat` |
| **Host** | `http://localhost:3000` |
| **Otentikasi** | None (Guest Mode / Publik) |

#### Request Body
| Field | Data Type | Mandatory | Description |
| :--- | :--- | :--- | :--- |
| `messages` | `Array of Object` | Yes | Riwayat obrolan (min 1, maks 20). Berisi `role` (`user`\|`assistant`) dan `content` (1–1000 karakter). |
| `childId` | `String (UUID)` | No | ID profil anak di database (jika ada). |
| `sessionId` | `String (UUID)` | No | ID sesi percakapan persisten. |

#### Implementasi: cURL
```bash
curl -X POST "http://localhost:3000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Kenapa kita harus batasi minum boba dan es teh manis?"
      }
    ],
    "childId": "c10e8400-e29b-41d4-a716-446655440001"
  }'
```

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [
      { role: "user", content: "Kenapa kita harus batasi minum boba dan es teh manis?" }
    ],
    childId: "c10e8400-e29b-41d4-a716-446655440001"
  })
});
const data = await response.json();
console.log("Respon Bot:", data.message.content);
```

---

### 2.2. GET `/api/avatar` - Konfigurasi Avatar Edukasi
Mengambil pengaturan avatar anak (Orb, Apel, Brokoli, Wortel) dan tema warna.

#### Request Setting
| Setting | Value |
| :--- | :--- |
| **HTTP Method** | `GET` |
| **Path** | `/api/avatar?childId=c10e8400-e29b-41d4-a716-446655440001` |
| **Host** | `http://localhost:3000` |
| **Otentikasi** | None (Fallback lokal tersedia) |

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/avatar?childId=c10e8400-e29b-41d4-a716-446655440001");
const { avatar } = await response.json();
console.log("Tipe Avatar:", avatar.characterType);
```

---

### 2.3. POST `/api/avatar` - Simpan Konfigurasi Avatar
Menyimpan pilihan karakter avatar dan tema warna pendamping anak.

#### Request Body
| Field | Data Type | Mandatory | Description |
| :--- | :--- | :--- | :--- |
| `childId` | `String (UUID)` | Yes | UUID anak. |
| `characterType` | `String` | Yes | Salah satu dari: `"orb"`, `"apple"`, `"broccoli"`, `"carrot"`. |
| `colorTheme` | `String` | No | Pilihan tema: `"teal"`, `"emerald"`, `"indigo"`, `"rose"`. |

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/avatar", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    childId: "c10e8400-e29b-41d4-a716-446655440001",
    characterType: "carrot",
    colorTheme: "emerald"
  })
});
const result = await response.json();
```

---

### 2.4. GET `/api/progress` - Ambil Progres Harian & Gamifikasi
Mengambil poin kesehatan, lencana kepatuhan, serta log makanan hari ini.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/progress?childId=c10e8400-e29b-41d4-a716-446655440001&date=2026-10-02");
const data = await response.json();
console.log("Total Poin:", data.progress.points);
```

---

### 2.5. POST `/api/progress` - Catat Progres Harian
Mencatat penambahan poin setelah menyelesaikan misi sehat atau kuis edukasi.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/progress", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    childId: "c10e8400-e29b-41d4-a716-446655440001",
    pointsEarned: 25,
    badges: ["JUARA_AIR_PUTIH"],
    foodLogged: {
      mealName: "Sayur Bayam Jagung",
      calories: 90,
      sugarCategory: "RENDAH"
    }
  })
});
```

---

### 2.6. GET `/api/content` - Ambil Konten Misi & Kuis Harian
Mengambil paket misi harian, kuis interaktif pencegahan diabetes, serta rekomendasi menu sehat ramah anak.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/content?category=ALL");
const { missions, quizzes, menus } = await response.json();
```

---

## 3. Role: Parent / Ibu & Manajemen Kesehatan Anak

### 3.1. POST `/api/auth/register` - Pendaftaran Akun Ibu
Mendaftarkan akun orang tua/ibu baru dengan nama lengkap, nomor WhatsApp/ponsel, email, dan kata sandi.

#### Request Body
| Field | Data Type | Mandatory | Description |
| :--- | :--- | :--- | :--- |
| `name` / `motherName` | `String` | Yes | Nama lengkap ibu (min 2 karakter). |
| `phone` | `String` | Yes | Nomor telepon / WhatsApp ibu. |
| `email` | `String` | Yes | Alamat email unik. |
| `password` | `String` | Yes | Kata sandi aman (min 8 karakter). |

#### Implementasi: cURL
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "motherName": "Ibu Rina Sasmita",
    "phone": "081234567890",
    "email": "ibu.rina@example.com",
    "password": "PasswordSehat123!"
  }'
```

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    motherName: "Ibu Rina Sasmita",
    phone: "081234567890",
    email: "ibu.rina@example.com",
    password: "PasswordSehat123!"
  })
});
const data = await response.json();
```

---

### 3.2. GET `/api/parent/profile` - Ambil Data Profil Ibu
Mengambil rincian profil ibu yang sedang login (Nama, Telepon, Tingkat Pendidikan, Pekerjaan, Alamat Domisili).

#### Request Setting
| Setting | Value |
| :--- | :--- |
| **HTTP Method** | `GET` |
| **Path** | `/api/parent/profile` |
| **Otentikasi** | Guardian Session (Cookie) |

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/parent/profile");
const { profile } = await response.json();
console.log("Ibu:", profile.name, "Pekerjaan:", profile.occupation);
```

---

### 3.3. PUT `/api/parent/profile` - Perbarui Data Profil Ibu
Memperbarui informasi demografis dan kontak ibu.

#### Request Body
| Field | Data Type | Mandatory | Description |
| :--- | :--- | :--- | :--- |
| `name` | `String` | No | Nama lengkap ibu. |
| `phone` | `String` | No | Nomor telepon. |
| `education` | `String` | No | Pendidikan terakhir (misal: "S1 Kesehatan", "SMA"). |
| `occupation` | `String` | No | Pekerjaan (misal: "Ibu Rumah Tangga", "Guru"). |
| `address` | `String` | No | Alamat tempat tinggal. |

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/parent/profile", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    education: "S1 Ekonomi",
    occupation: "Wirausaha",
    address: "Jl. Sehat Ceria No. 12, Jakarta Selatan"
  })
});
const { profile } = await response.json();
```

---

### 3.4. GET `/api/children` - Ambil Daftar Anak
Mengambil seluruh profil anak yang terhubung dengan akun orang tua.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/children");
const { children } = await response.json();
```

---

### 3.5. POST `/api/children` - Tambah Profil Anak
Menambahkan data profil anak ke akun orang tua.

#### Request Body
| Field | Data Type | Mandatory | Description |
| :--- | :--- | :--- | :--- |
| `name` | `String` | Yes | Nama panggilan/lengkap anak. |
| `age` | `Number` | Yes | Usia anak dalam tahun (5–17). |
| `gender` | `String` | No | `"L"` (Laki-laki) atau `"P"` (Perempuan). |
| `birthDate` | `String (ISO)` | No | Tanggal lahir anak (YYYY-MM-DD). |
| `healthHistory` | `String` | No | Riwayat alergi atau penyakit turunan. |

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/children", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Ahmad Farhan",
    age: 9,
    gender: "L",
    birthDate: "2017-04-12",
    healthHistory: "Riwayat diabetes tipe-2 pada kakek pihak ibu"
  })
});
```

---

### 3.6. GET `/api/children/[id]` - Ambil Detail Profil & Riwayat Anak
Mengambil profil spesifik anak beserta ringkasan log pertumbuhan dan skrining terakhir.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/children/c10e8400-e29b-41d4-a716-446655440001");
const { child } = await response.json();
```

---

### 3.7. PUT `/api/children/[id]` - Perbarui Profil & Riwayat Kesehatan Anak
Memperbarui informasi medis atau demografis anak.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/children/c10e8400-e29b-41d4-a716-446655440001", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    healthHistory: "Sering mengeluh cepat haus setelah bermain di luar",
    gender: "L"
  })
});
```

---

### 3.8. POST `/api/screening` - Kalkulasi Skrining Risiko Diabetes Anak
Menghitung persentase risiko diabetes anak berdasarkan antropometri, gaya hidup, asupan manis, dan riwayat keluarga. Menghasilkan skor 0–100%, kategori (*Rendah*, *Sedang*, *Tinggi*), dan rekomendasi klinis.

#### Request Body
| Field | Data Type | Mandatory | Description |
| :--- | :--- | :--- | :--- |
| `childId` | `String (UUID)` | Yes | ID anak yang diskrining. |
| `age` | `Number` | Yes | Usia anak (tahun). |
| `gender` | `String` | Yes | `"L"` atau `"P"`. |
| `weightKg` | `Number` | Yes | Berat badan aktual (kg). |
| `heightCm` | `Number` | Yes | Tinggi badan aktual (cm). |
| `familyDiabetesHistory` | `Boolean` | Yes | Ada riwayat diabetes di keluarga kandung? |
| `sweetDrinkFrequency` | `String` | Yes | Frekuensi minuman manis: `"JARANG"`, `"KADANG"`, `"SERING"`. |
| `fastFoodFrequency` | `String` | Yes | Frekuensi makanan cepat saji: `"JARANG"`, `"KADANG"`, `"SERING"`. |
| `dailyPhysicalActivity` | `String` | Yes | Aktivitas fisik harian: `"<30_MENIT"`, `"30_60_MENIT"`, `">60_MENIT"`. |
| `symptoms` | `Array of String` | No | Gejala klinis: `["sering_haus", "sering_pipis", "cepat_lelah"]`. |

#### Implementasi: cURL
```bash
curl -X POST "http://localhost:3000/api/screening" \
  -H "Content-Type: application/json" \
  -d '{
    "childId": "c10e8400-e29b-41d4-a716-446655440001",
    "age": 9,
    "gender": "L",
    "weightKg": 38.5,
    "heightCm": 128,
    "familyDiabetesHistory": true,
    "sweetDrinkFrequency": "SERING",
    "fastFoodFrequency": "KADANG",
    "dailyPhysicalActivity": "<30_MENIT",
    "symptoms": ["sering_haus", "cepat_lelah"]
  }'
```

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/screening", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    childId: "c10e8400-e29b-41d4-a716-446655440001",
    age: 9,
    gender: "L",
    weightKg: 38.5,
    heightCm: 128,
    familyDiabetesHistory: true,
    sweetDrinkFrequency: "SERING",
    fastFoodFrequency: "KADANG",
    dailyPhysicalActivity: "<30_MENIT",
    symptoms: ["sering_haus", "cepat_lelah"]
  })
});
const { record } = await response.json();
console.log(`Skor Risiko: ${record.riskScore}% (${record.riskCategory})`);
```

---

### 3.9. GET `/api/screening` - Riwayat Skrining Risiko Diabetes
Mengambil riwayat skrining anak untuk memantau tren perkembangan risiko dari waktu ke waktu.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/screening?childId=c10e8400-e29b-41d4-a716-446655440001");
const { screenings } = await response.json();
```

---

### 3.10. GET `/api/tracker/growth` - Kurva & Riwayat Pertumbuhan WHO
Mengambil riwayat tinggi badan, berat badan, lingkar kepala, BMI Z-score, dan status gizi anak untuk divisualisasikan dalam grafik kurva WHO.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/tracker/growth?childId=c10e8400-e29b-41d4-a716-446655440001");
const { measurements } = await response.json();
```

---

### 3.11. POST `/api/tracker/growth` - Catat Pengukuran Tumbuh Kembang
Mencatat hasil penimbangan berat badan atau pengukuran tinggi badan berkala di Posyandu atau di rumah.

#### Request Body
| Field | Data Type | Mandatory | Description |
| :--- | :--- | :--- | :--- |
| `childId` | `String (UUID)` | Yes | ID anak. |
| `date` | `String (ISO)` | Yes | Tanggal pengukuran (YYYY-MM-DD). |
| `weightKg` | `Number` | Yes | Berat badan (kg). |
| `heightCm` | `Number` | Yes | Tinggi badan (cm). |
| `headCircumCm` | `Number` | No | Lingkar kepala (opsional). |
| `notes` | `String` | No | Catatan posyandu/klinik. |

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/tracker/growth", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    childId: "c10e8400-e29b-41d4-a716-446655440001",
    date: "2026-10-02",
    weightKg: 29.5,
    heightCm: 132.0,
    notes: "Pengukuran rutin di Posyandu Mawar"
  })
});
const { measurement } = await response.json();
console.log("Status Gizi:", measurement.nutritionalStatus);
```

---

### 3.12. POST `/api/nutrition/calculate` - Kalkulator Nutrisi & Kandungan Gula
Menghitung estimasi kalori, makronutrisi (karbohidrat, protein, lemak), serta kandungan gula dari porsi makanan atau resep.

#### Request Body
| Field | Data Type | Mandatory | Description |
| :--- | :--- | :--- | :--- |
| `foodName` | `String` | Yes | Nama makanan/minuman (misal: "Es Teh Manis Jumbo"). |
| `portionGram` | `Number` | Yes | Ukuran porsi dalam gram/ml. |
| `ingredients` | `Array of String` | No | Daftar komposisi bahan (jika tersedia). |

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/nutrition/calculate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    foodName: "Pecel Sayur Saus Kacang",
    portionGram: 200,
    ingredients: ["Kangkung", "Tauge", "Kacang Panjang", "Saus Kacang"]
  })
});
const { nutrition } = await response.json();
console.log(`Kalori: ${nutrition.calories} kkal, Gula: ${nutrition.sugarGram} gram`);
```

---

### 3.13. GET `/api/food-diary` - Diary Makan Harian Per Slot Waktu
Mengambil daftar makanan yang dikonsumsi anak pada tanggal tertentu, dikelompokkan berdasarkan slot waktu makan: **SARAPAN**, **MAKAN_SIANG**, **MAKAN_MALAM**, dan **CAMILAN**.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/food-diary?childId=c10e8400-e29b-41d4-a716-446655440001&date=2026-10-02");
const { diary } = await response.json();
```

---

### 3.14. POST `/api/food-diary` - Catat Diary Konsumsi Makanan
Mencatat menu makanan yang dikonsumsi anak untuk pemantauan asupan gula dan kalori harian.

#### Request Body
| Field | Data Type | Mandatory | Description |
| :--- | :--- | :--- | :--- |
| `childId` | `String (UUID)` | Yes | ID anak. |
| `date` | `String (ISO)` | Yes | Tanggal konsumsi (YYYY-MM-DD). |
| `mealSlot` | `String` | Yes | `"SARAPAN"`, `"MAKAN_SIANG"`, `"MAKAN_MALAM"`, `"CAMILAN"`. |
| `foodName` | `String` | Yes | Nama hidangan yang dimakan. |
| `portionDescription` | `String` | No | Keterangan porsi (misal: "1 Mangkok Kecil"). |
| `caloriesKkal` | `Number` | No | Estimasi kalori hidangan. |
| `sugarGram` | `Number` | No | Estimasi gram gula pasir / sukrosa. |

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/food-diary", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    childId: "c10e8400-e29b-41d4-a716-446655440001",
    date: "2026-10-02",
    mealSlot: "SARAPAN",
    foodName: "Oatmeal Pisang & Susu UHT Rendah Lemak",
    portionDescription: "1 mangkok sedang",
    caloriesKkal: 210,
    sugarGram: 6.5
  })
});
```

---

### 3.15. GET `/api/recipes` - Daftar Resep Tradisional Sehat
Mengambil katalog menu masakan tradisional nusantara rendah gula dan kaya serat (seperti Sayur Asem, Pepes Ikan, Gado-Gado Rendah Gula).

#### Query Parameters
- `category` (opsional): `"makanan"`, `"minuman"`, `"camilan"`.
- `search` (opsional): Kata kunci pencarian resep.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/recipes?category=makanan&search=asem");
const { recipes } = await response.json();
```

---

### 3.16. GET `/api/recipes/[id]` - Detail Bahan & Instruksi Resep
Mengambil rincian takaran bahan, langkah-langkah memasak higienis, serta rincian nilai gizi per porsi hidangan tradisional.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/recipes/sayur-asem");
const { recipe } = await response.json();
console.log("Langkah Masak:", recipe.instructions);
```

---

### 3.17. GET `/api/reminders` - Ambil Daftar Pengingat Rutinitas
Mengambil jadwal alarm/notifikasi pengingat harian ibu: Sarapan Sehat, Minum Air Putih, Olahraga/Aktivitas Luar, dan Jam Tidur Teratur.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/reminders?childId=c10e8400-e29b-41d4-a716-446655440001");
const { reminders } = await response.json();
```

---

### 3.18. POST `/api/reminders` - Tambah Pengingat Baru
Membuat alarm pengingat kebiasaan sehat baru.

#### Request Body
| Field | Data Type | Mandatory | Description |
| :--- | :--- | :--- | :--- |
| `childId` | `String (UUID)` | Yes | ID anak target pengingat. |
| `type` | `String` | Yes | `"SARAPAN"`, `"MINUM_AIR"`, `"AKTIVITAS_FISIK"`, `"TIDUR"`, `"LAINNYA"`. |
| `title` | `String` | Yes | Judul alarm (misal: "Waktunya Minum Air Gelas ke-4"). |
| `time` | `String` | Yes | Format jam 24 jam (misal: `"14:00"`). |
| `daysOfWeek` | `Array of Number` | No | Hari aktif pengingat `[0,1,2,3,4,5,6]`. |

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/reminders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    childId: "c10e8400-e29b-41d4-a716-446655440001",
    type: "MINUM_AIR",
    title: "Minum Air Putih Siang Hari",
    time: "13:30",
    daysOfWeek: [1, 2, 3, 4, 5]
  })
});
```

---

### 3.19. PATCH `/api/reminders/[id]` - Toggle Aktif/Nonaktif Jam Pengingat
Mengubah saklar switch toggle alarm aktif atau nonaktif dari tampilan dashboard ibu.

#### Request Body
| Field | Data Type | Mandatory | Description |
| :--- | :--- | :--- | :--- |
| `isActive` | `Boolean` | No | Nilai boolean status saklar (`true` atau `false`). |
| `time` | `String` | No | Jam baru (opsional). |

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/reminders/rem-uuid-1", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ isActive: false })
});
```

---

### 3.20. GET `/api/education/articles` - Pustaka Edukasi (Artikel/Makanan/Video)
Mengambil daftar artikel kesehatan, rekomendasi bahan makanan bergizi, dan video edukasi pencegahan diabetes anak.

#### Query Parameters
- `category` (opsional): `"artikel"`, `"makanan"`, `"video"`, `"semua"`.
- `search` (opsional): Pencarian judul atau rangkuman.
- `page` & `limit` (opsional): Paginasi data.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/education/articles?category=artikel");
const { meta, data } = await response.json();
```

---

### 3.21. GET `/api/education/articles/[id]` - Detail Materi Edukasi
Mengambil isi lengkap teks artikel ilmiah populer atau tautan video tutorial edukasi.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/education/articles/apa-itu-diabetes-pada-anak");
const { article } = await response.json();
```

---

### 3.22. GET `/api/consultations/specialists` - Direktori Tenaga Medis Mitra
Mengambil daftar tenaga profesional medis yang tersedia untuk telekonsultasi kesehatan (Bidan, Ahli Gizi / Dietisien, Dokter Spesialis Anak).

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/consultations/specialists?type=AHLI_GIZI");
const { specialists } = await response.json();
```

---

### 3.23. GET `/api/consultations` - Riwayat Sesi Konsultasi Ibu
Mengambil daftar tiket konsultasi medis yang pernah diajukan oleh orang tua.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/consultations");
const { consultations } = await response.json();
```

---

### 3.24. POST `/api/consultations` - Ajukan Sesi Telekonsultasi Tenaga Medis
Mengirimkan pengajuan konsultasi daring baru kepada tenaga medis mitra.

#### Request Body
| Field | Data Type | Mandatory | Description |
| :--- | :--- | :--- | :--- |
| `specialistType` | `String` | Yes | `"BIDAN"`, `"AHLI_GIZI"`, atau `"DOKTER"`. |
| `specialistName` | `String` | Yes | Nama tenaga medis yang dituju. |
| `topic` | `String` | Yes | Topik atau keluhan utama (misal: "Hasil Skrining Risiko Tinggi"). |
| `notes` | `String` | No | Catatan tambahan kondisi anak. |

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/consultations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    specialistType: "AHLI_GIZI",
    specialistName: "Nurul Aini, S.Gz, RD",
    topic: "Konsultasi Penurunan Porsi Gula Balita",
    notes: "Anak terbiasa minum teh manis kemasan 3 kotak per hari"
  })
});
const { consultation } = await response.json();
```

---

## 4. Role: Administrator (Wajib Login Admin)

> **Catatan Keamanan:** Seluruh endpoint di bawah ini memvalidasi sesi server. Jika pemanggil bukan akun dengan peran `role === "ADMIN"`, sistem mengembalikan respon `401 Unauthorized` atau `403 Forbidden`.

### 4.1. GET `/api/admin/metrics` - Ringkasan Analitik Platform
Mengambil metrik agregat performa platform: total keluarga terdaftar, anak aktif, total turn percakapan AI, rata-rata durasi sesi, dan statistik penyelesaian misi harian.

#### Implementasi: cURL
```bash
curl -X GET "http://localhost:3000/api/admin/metrics" \
  -H "Cookie: authjs.session-token=ADMIN_SESSION_COOKIE"
```

---

### 4.2. GET `/api/admin/export` - Ekspor Data Riset Anonim (CSV / JSON)
Mengekspor dataset anonim interaksi anak dan progres edukasi kesehatan untuk keperluan riset kesehatan masyarakat tanpa mengekspos PII (*Personally Identifiable Information*).

#### Query Parameters
- `format`: `"csv"` atau `"json"` (default: `"csv"`).

#### Implementasi: cURL
```bash
curl -X GET "http://localhost:3000/api/admin/export?format=csv" \
  -H "Cookie: authjs.session-token=ADMIN_SESSION_COOKIE" \
  --output export_riset_si_cehat.csv
```

---

### 4.3. GET `/api/admin/content` - Ambil Konten Edukasi CMS
Mengambil seluruh konten edukasi aktif maupun nonaktif untuk dikelola tim kurator konten.

---

### 4.4. POST `/api/admin/content` - Buat Konten Edukasi Baru
Membuat konten misi baru, butir soal kuis, atau rekomendasi makanan sehat.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/admin/content", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    category: "MISSION",
    title: "Minum Air Putih 6 Gelas Hari Ini",
    description: "Tantang dirimu untuk minum 6 gelas air putih dan kurangi minuman manis!",
    points: 20,
    isActive: true
  })
});
```

---

### 4.5. GET `/api/admin/bot-config` - Ambil Konfigurasi Model AI
Mengambil model LLM aktif, base URL inference, system prompt edukasi pencegahan diabetes, serta parameter `temperature` dan `maxTokens`.

---

### 4.6. PUT `/api/admin/bot-config` - Perbarui Parameter Model AI
Memperbarui system instruction atau parameter model AI tanpa perlu restart server.

---

### 4.7. POST `/api/admin/bot-config/test` - Pengujian Konektivitas Model AI
Menguji kesiapan koneksi dan latensi model provider AI secara real-time dari panel administrator.

#### Implementasi: JavaScript (fetch)
```javascript
const response = await fetch("/api/admin/bot-config/test", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "Halo Si-Cehat, apa itu gula darah?"
  })
});
const testResult = await response.json();
console.log("Latensi:", testResult.latencyMs, "ms");
```

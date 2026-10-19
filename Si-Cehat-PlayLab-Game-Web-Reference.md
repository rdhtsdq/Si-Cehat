# Si-Cehat PlayLab — Referensi Implementasi Web Game

> **Status dokumen:** Rancangan konseptual untuk dijadikan referensi coding agent.  
> **Produk:** Si-Cehat  
> **Fitur:** Mini-game edukasi kesehatan berbasis web, diakses dari aplikasi Flutter melalui WebView.  
> **Tujuan:** Mendukung pembelajaran kesehatan anak sekaligus menyediakan data yang layak untuk evaluasi penelitian.

---

## 1. Ringkasan Eksekutif

**Si-Cehat PlayLab** adalah fitur mini-game edukasi yang terintegrasi dengan aplikasi Si-Cehat. Game pertama yang direkomendasikan adalah **Piring Sehat Nimbo**, sebuah permainan drag-and-drop untuk membantu anak memahami variasi makanan dan prinsip dasar piring makan seimbang.

Desain yang disarankan adalah arsitektur hybrid:

- **Flutter** mengelola navigasi aplikasi, autentikasi, profil, dan lifecycle WebView.
- **Web game** mengelola gameplay, animasi, input sentuh, instruksi, dan umpan balik.
- **Backend Si-Cehat** mengelola sesi, otorisasi, validasi hasil, progres, dan data penelitian.
- **PostgreSQL + Prisma** menyimpan data dengan versi game dan instrumen yang dapat ditelusuri.

Game harus dirancang bukan hanya untuk meningkatkan engagement, tetapi juga untuk membantu mengevaluasi hasil pembelajaran. Skor gameplay tidak boleh dianggap sebagai bukti langsung bahwa anak memahami materi.

### Tujuan produk

1. Menyajikan edukasi kesehatan melalui interaksi yang sesuai usia.
2. Mengukur engagement dan penyelesaian game.
3. Mengukur pengetahuan sebelum dan sesudah intervensi dengan instrumen yang sesuai.
4. Memungkinkan pengukuran retensi pengetahuan jika dibutuhkan protokol penelitian.
5. Menyediakan data yang aman, konsisten, dan dapat dianalisis.

### Prinsip utama

- Satu game berfokus pada satu kompetensi atau kelompok kompetensi yang terdefinisi.
- Anak belajar melalui tindakan dan umpan balik, bukan hanya membaca materi.
- Kesalahan dijadikan kesempatan belajar, bukan hukuman.
- Gameplay score dan knowledge score dipisahkan.
- Data dikumpulkan seminimal mungkin sesuai tujuan produk dan penelitian.
- Backend menjadi sumber kebenaran untuk hasil final dan reward.
- Versi game, konten, aturan penilaian, dan instrumen penelitian dicatat.

---

## 2. Konsep Produk

### Nama kerja

**Si-Cehat PlayLab**

### Game pertama

**Piring Sehat Nimbo**

### Sasaran pengguna

Rentang usia awal yang dipertimbangkan adalah 6–12 tahun, berdasarkan konteks produk Si-Cehat. Rentang ini harus dikonfirmasi terhadap populasi penelitian yang sebenarnya. Instruksi, ukuran elemen interaktif, tingkat kesulitan, dan instrumen penilaian perlu disesuaikan dengan usia dan kemampuan peserta.

### Durasi sesi

Target awal 3–5 menit per sesi. Durasi akhir perlu diuji melalui usability testing.

### Peran Nimbo

Nimbo menjadi pemandu non-menghakimi yang:

- Memberikan instruksi singkat.
- Memberi umpan balik setelah pilihan dibuat.
- Menjelaskan alasan edukatif di balik jawaban.
- Memberi dorongan positif tanpa mempermalukan anak.

Konten kesehatan, aturan jawaban, dan umpan balik harus ditinjau oleh ahli yang relevan sebelum dipakai dalam penelitian.

---

## 3. Pilihan Game dalam Roadmap

Hanya satu game dibangun pada MVP. Game lain menjadi kandidat pengembangan setelah arsitektur dan alur penelitian terbukti berjalan.

### 3.1 Piring Sehat Nimbo — MVP

**Genre:** Puzzle drag-and-drop.  
**Kompetensi:** Mengenali variasi makanan dan prinsip dasar makan seimbang.

Anak menyeret kartu makanan ke area piring atau memilih makanan sesuai instruksi. Game memberikan umpan balik edukatif berdasarkan pedoman gizi yang telah ditinjau ahli.

Data potensial:

- Pilihan per item.
- Ketepatan jawaban.
- Jumlah percobaan.
- Penggunaan petunjuk.
- Waktu penyelesaian.
- Skor knowledge check terpisah dari skor gameplay.

### 3.2 Misi Tangan Bersih — kandidat lanjutan

**Genre:** Simulasi interaktif dan pengurutan langkah.  
**Kompetensi:** Memahami urutan dan langkah mencuci tangan.

Data potensial: ketepatan urutan, langkah yang terlewat, dan hasil assessment pre-test/post-test.

### 3.3 Pilih Minumanmu — kandidat lanjutan

**Genre:** Pemilihan berdasarkan situasi.  
**Kompetensi:** Memahami air putih sebagai pilihan minuman sehari-hari dan mengenali pilihan minuman dalam konteks kebiasaan sehat.

Data potensial: akurasi jawaban dan pola miskonsepsi.

### Keputusan roadmap

Bangun Piring Sehat Nimbo terlebih dahulu. Jangan membuat tiga game sekaligus sebelum terbukti bahwa satu game dapat dimainkan dengan baik, terintegrasi aman, menghasilkan data konsisten, dan mendukung evaluasi pembelajaran.

---

## 4. Gameplay MVP: Piring Sehat Nimbo

### 4.1 Alur sesi

1. **Pembukaan:** Nimbo meminta anak membantu menyiapkan piring makan.
2. **Eksplorasi:** Anak melihat kartu makanan, misalnya nasi, sayur, buah, telur, ikan, dan tempe.
3. **Interaksi:** Anak menyeret item ke area piring atau memilih item sesuai instruksi.
4. **Umpan balik:** Nimbo menjelaskan alasan pilihan sesuai atau perlu diperbaiki.
5. **Knowledge check:** Anak menjawab pertanyaan singkat yang tidak menampilkan petunjuk jawaban.
6. **Hasil:** Game menampilkan ringkasan permainan dan reward yang sesuai.
7. **Sinkronisasi:** Hasil dan event yang diperlukan dikirim ke backend.

### 4.2 Mekanik inti

Contoh instruksi: “Bantu Nimbo memilih makanan dengan beragam kelompok pangan.”

Anak dapat memilih nasi, sayur, buah, telur, dan tempe. Game tidak cukup hanya mengatakan benar atau salah; game harus memberi penjelasan yang sesuai usia.

Aturan penilaian tidak boleh disusun sembarangan. Konten makanan, porsi, kelompok pangan, dan umpan balik harus ditinjau ahli gizi atau ahli kesehatan yang relevan. Hindari menyederhanakan pedoman gizi menjadi aturan absolut yang keliru.

### 4.3 Pemisahan skor

| Jenis skor | Tujuan | Penggunaan |
|---|---|---|
| `gameplay_score` | Mengukur performa pada mekanik permainan | Progres dan reward |
| `knowledge_score` | Mengukur pemahaman melalui pertanyaan terdefinisi | Evaluasi penelitian |

Skor gameplay tidak boleh dipakai sebagai pengganti skor pengetahuan. Anak dapat mahir menyeret kartu tanpa memahami materi, atau memahami materi tetapi mengalami kesulitan menggunakan antarmuka.

### 4.4 Knowledge check

- Gunakan instrumen yang sesuai usia dan tujuan penelitian.
- Pisahkan soal latihan dari item yang dipakai untuk mengukur hasil belajar.
- Jika memungkinkan, gunakan bentuk soal yang sebanding untuk pre-test dan post-test.
- Jangan menganggap kenaikan skor segera setelah bermain sebagai bukti retensi jangka panjang.
- Simpan versi instrumen dan aturan penilaian.

### 4.5 Persyaratan UX

- Mobile-first dan responsif.
- Mendukung layar sentuh; tidak boleh bergantung pada hover atau mouse.
- Target sentuh cukup besar dan tidak terlalu rapat.
- Instruksi singkat, jelas, dan sesuai usia.
- Tersedia loading state, error state, dan jalur keluar yang jelas.
- Tidak ada hukuman yang mempermalukan anak.
- Game dapat menangani pergantian aplikasi, reload, dan koneksi yang tidak stabil dengan status sesi yang jelas.

---

## 5. Arsitektur Teknis

### 5.1 Rancangan tingkat tinggi

```text
Flutter Mobile
├── Auth & Profile
├── Game Launcher
└── WebView Lifecycle
        │
        ├── Bridge terbatas untuk event UI/navigasi
        └── HTTPS ke backend untuk data dan hasil
                 │
Web Game (React/Vite/TypeScript atau HTML/CSS/JS)
├── Gameplay engine
├── Input dan animasi
├── Feedback edukatif
└── Research events yang diperlukan
                 │
Backend Si-Cehat (Bun API)
├── Autentikasi dan otorisasi
├── Pembuatan sesi
├── Validasi hasil
├── Aturan reward
└── API penelitian
                 │
PostgreSQL + Prisma
├── Game definitions / versions
├── Game sessions
├── Game events
├── Game results
└── Assessment attempts
                 │
Research dashboard / export
```

### 5.2 Teknologi yang disarankan

| Komponen | Pilihan awal | Alasan / trade-off |
|---|---|---|
| Mobile host | Flutter + `webview_flutter` | Integrasi dengan aplikasi mobile yang sudah ada. |
| Game frontend | React + Vite + TypeScript | Terpisah dari aplikasi utama dan mudah dibangun sebagai static site. |
| Alternatif frontend | HTML/CSS/JavaScript tanpa framework | Lebih sederhana jika gameplay hanya drag-and-drop dan animasi ringan. |
| Gameplay | DOM/CSS untuk MVP | Cukup untuk puzzle dan UI interaktif sederhana. |
| Game engine opsional | Phaser | Pertimbangkan jika kelak membutuhkan sprite, collision, fisika, atau gameplay 2D lebih kompleks. |
| API | Backend Bun yang sudah ada | Menghindari backend duplikat. |
| ORM | Prisma | Konsisten dengan stack saat ini. |
| Database | PostgreSQL | Penyimpanan terstruktur dan transaksi. |
| Research dashboard | Modul admin yang ada atau halaman web terpisah | Dashboard kompleks tidak diperlukan untuk MVP. |

**Prinsip pemilihan teknologi:** gunakan abstraksi sesederhana mungkin. Jangan menambahkan Phaser atau framework lain jika kebutuhan game belum memerlukannya.

### 5.3 Strategi hosting

Host game sebagai static build pada origin khusus, misalnya `games.example.com`, dan gunakan origin API terpisah. Domain di atas hanyalah contoh; sesuaikan dengan infrastruktur Si-Cehat.

Keuntungan:

- Game dapat diperbarui tanpa merilis ulang aplikasi Flutter selama kontrak bridge/API tetap kompatibel.
- Aset dapat dicache.
- Source game terpisah dari source mobile dan backend.
- Versi game dapat dikunci dan dilacak untuk penelitian.

Risiko: pembaruan web dapat langsung memengaruhi peserta studi. Karena itu, versi yang digunakan dalam satu studi harus dikunci. Perubahan konten, gameplay, scoring, atau instrumen harus dicatat dan tidak dilakukan diam-diam selama pengumpulan data.

---

## 6. Integrasi Flutter–WebView

### 6.1 Tanggung jawab Flutter

- Memastikan pengguna dan profil anak yang aktif benar.
- Meminta pembuatan sesi game dari backend.
- Membuka origin game yang diizinkan.
- Menangani lifecycle WebView, tombol kembali, loading, error, dan keluar dari game.
- Memperbarui tampilan hasil dengan mengambil data dari API, bukan mempercayai pesan JavaScript sebagai hasil final.

### 6.2 Tanggung jawab web game

- Menjalankan mekanik gameplay.
- Menampilkan instruksi dan umpan balik.
- Mengelola state permainan selama sesi.
- Mengirim event yang memang dibutuhkan.
- Meminta penyelesaian sesi melalui alur yang ditetapkan.
- Tidak menjadi sumber kebenaran untuk skor final atau reward.

### 6.3 Contoh kontrak pesan

```typescript
type GameToAppMessage =
  | {
      type: "GAME_READY";
      protocolVersion: 1;
    }
  | {
      type: "GAME_COMPLETED";
      sessionId: string;
    }
  | {
      type: "EXIT_GAME";
    };
```

Makna pesan:

- `GAME_READY`: web game siap ditampilkan.
- `GAME_COMPLETED`: meminta Flutter menyegarkan hasil sesi dari API. Pesan ini bukan bukti skor sah.
- `EXIT_GAME`: meminta Flutter menjalankan alur keluar yang aman.

Semua pesan harus divalidasi berdasarkan schema, panjang payload, tipe pesan, dan konteks sesi. Abaikan pesan yang tidak dikenal atau tidak valid.

### 6.4 Pertukaran sesi

Saat game dibuka:

1. Flutter meminta backend membuat sesi untuk pengguna, profil, game, dan versi yang tepat.
2. Backend mengembalikan identifier sesi dan mekanisme bootstrap yang aman.
3. Flutter membuka game pada origin yang diizinkan.
4. Game memperoleh akses sesi melalui mekanisme yang disepakati.
5. Backend memeriksa otorisasi setiap kali menerima event atau permintaan penyelesaian.

Salah satu opsi adalah kode sesi sekali pakai, berumur pendek, dan terikat pada pengguna, game, serta versi. Jangan menaruh access token permanen, refresh token, atau data identitas anak dalam query string URL. URL dapat masuk ke log, riwayat, atau sistem monitoring.

### 6.5 Kebijakan navigasi

- Izinkan hanya origin game yang ditentukan.
- Blokir atau buka origin eksternal di browser terpisah.
- Jangan memberikan bridge istimewa kepada halaman eksternal.
- Pastikan deep link dan tombol kembali tidak dapat memintas pemeriksaan sesi.
- Tangani sesi kedaluwarsa dengan pesan yang jelas dan jalur kembali ke aplikasi.

---

## 7. Backend, API, dan Validasi Hasil

### 7.1 Endpoint usulan

Endpoint berikut adalah rancangan, bukan klaim bahwa endpoint tersebut sudah tersedia di repository.

| Endpoint | Fungsi |
|---|---|
| `GET /api/games` | Mendapatkan daftar game yang tersedia. |
| `POST /api/game-sessions` | Membuat sesi game yang terotorisasi. |
| `POST /api/game-sessions/:id/events` | Mengirim event terstruktur yang diperlukan. |
| `POST /api/game-sessions/:id/complete` | Memvalidasi dan menyelesaikan sesi. |
| `GET /api/game-sessions/:id/result` | Mengambil hasil final yang telah divalidasi. |
| `POST /api/assessments/attempts` | Mengirim jawaban assessment. |
| `GET /api/research/studies/:id/export` | Ekspor data studi dengan otorisasi khusus. |

### 7.2 Validasi server

- Jangan menerima `knowledge_score` dari client sebagai nilai final tepercaya.
- Kirim jawaban atau bukti interaksi yang diperlukan, lalu hitung skor menggunakan kunci jawaban dan versi instrumen di server.
- Validasi bahwa sesi milik pengguna/profil yang benar dan masih dapat diselesaikan.
- Validasi status sesi, urutan event jika relevan, dan aturan game.
- Terapkan idempotency untuk endpoint penyelesaian agar retry tidak menggandakan hasil atau reward.
- Batasi ukuran payload dan laju permintaan.
- Gunakan transaksi database untuk perubahan hasil dan reward yang harus konsisten.
- Simpan versi aturan penilaian yang digunakan.

### 7.3 Offline dan retry

Untuk MVP, gameplay boleh berlangsung di WebView tanpa terus-menerus memanggil server untuk setiap gerakan. Namun, kebijakan offline harus jelas:

- Tentukan apakah game boleh dimulai tanpa koneksi.
- Jika event lokal diantrekan, gunakan identifier dan urutan event yang stabil.
- Jangan menyatakan hasil sudah tersinkron sebelum server mengonfirmasi.
- Pengiriman ulang tidak boleh membuat sesi atau reward ganda.
- Jika hasil penelitian tidak dapat diverifikasi karena koneksi putus, tandai statusnya dengan benar; jangan mengarang hasil yang hilang.

---

## 8. Model Data Awal

Rancangan konseptual entitas:

### `GameDefinition`

- `id`
- `slug`
- `title`
- `current_version`
- status publikasi dan metadata yang diperlukan

### `GameSession`

- `id`
- `participant_id` atau referensi profil yang sesuai dengan model aplikasi
- `game_id`
- `game_version`
- `started_at`
- `completed_at`
- `status`

### `GameEvent`

- `id`
- `session_id`
- `event_type`
- `sequence` jika diperlukan
- `payload` yang dibatasi schema-nya
- `occurred_at`

### `GameResult`

- `id`
- `session_id` dengan unique constraint jika satu sesi hanya boleh menghasilkan satu hasil final
- `gameplay_score`
- `knowledge_score` jika memang diukur dalam sesi tersebut
- `rules_version`
- waktu finalisasi

### `AssessmentAttempt`

- `id`
- `participant_id` atau kode peserta
- `study_id`
- `assessment_type` seperti pre-test, post-test, atau follow-up
- `instrument_version`
- jawaban terstruktur
- skor
- `completed_at`

### Aturan database

- Sesuaikan foreign key dan relasi dengan model pengguna/profil anak yang benar-benar ada di repository.
- Jangan membuat model identitas peserta duplikat jika aplikasi sudah memiliki model yang tepat.
- Batasi event pada data yang relevan; tidak perlu merekam setiap gerakan pointer.
- Terapkan unique constraint dan transaksi sesuai kebutuhan konsistensi.
- Tetapkan retensi dan penghapusan data sebelum pengumpulan data penelitian dimulai.
- Data analisis sebaiknya menggunakan kode peserta; pemetaan ke identitas akun disimpan terpisah dengan akses yang lebih ketat.

Skema ini adalah titik awal diskusi, bukan skema Prisma final. Coding agent harus memeriksa schema Prisma dan struktur backend yang sebenarnya sebelum membuat migrasi.

---

## 9. Desain Penelitian dan Evaluasi Efektivitas

### 9.1 Tujuan evaluasi

Bedakan tiga konstruk berikut:

1. **Engagement:** apakah anak tertarik memainkan game dan menyelesaikannya?
2. **Learning outcome:** apakah pengetahuan meningkat setelah intervensi?
3. **Retention:** apakah pengetahuan masih diingat pada evaluasi lanjutan?

Skor game tinggi tidak otomatis membuktikan anak memahami materi. Data interaksi dapat mendukung evaluasi proses, tetapi tidak membuktikan perubahan perilaku kesehatan dalam kehidupan sehari-hari.

### 9.2 Variabel yang disarankan

**Variabel primer — pengetahuan kesehatan**

- Skor pre-test dan post-test.
- Instrumen sesuai usia dan tujuan studi.
- Instrumen ditinjau atau divalidasi untuk tujuan penelitian.

**Variabel proses — interaksi**

- Waktu bermain.
- Jumlah percobaan.
- Kesalahan.
- Penggunaan petunjuk.
- Tingkat penyelesaian.

**Variabel sekunder — retensi**

- Skor follow-up, misalnya 7–14 hari setelah intervensi jika layak dan sesuai protokol.

**Variabel pendukung — usability**

- Apakah anak memahami instruksi.
- Apakah anak dapat menyelesaikan interaksi.
- Apakah pendamping perlu membantu.
- Hambatan teknis dan aksesibilitas.

### 9.3 Protokol evaluasi

- **T0 — Pre-test:** ukur pengetahuan sebelum bermain.
- **Intervensi:** anak memainkan game dengan instruksi dan durasi yang distandardisasi.
- **T1 — Post-test:** ukur pengetahuan setelah intervensi menggunakan instrumen yang sebanding.
- **T2 — Follow-up:** ukur retensi jika dibutuhkan protokol penelitian.

### 9.4 Desain studi dan batas interpretasi

Pre-test/post-test satu kelompok tidak cukup kuat untuk menyimpulkan bahwa game menyebabkan peningkatan pengetahuan. Perubahan skor dapat dipengaruhi pengulangan tes, maturasi, atau paparan informasi lain.

Jika sumber daya memungkinkan, pertimbangkan kelompok pembanding dan alokasi yang sesuai protokol penelitian. Analisis dapat membandingkan perubahan skor antarkelompok, bukan hanya melihat kenaikan skor satu kelompok.

Ukuran sampel, instrumen, metode analisis, dan kriteria keberhasilan harus ditetapkan bersama penanggung jawab penelitian. Jangan mengklaim efektivitas sebelum data dianalisis dengan metode yang sesuai.

### 9.5 Validitas data penelitian

- Catat versi game, konten, scoring, dan instrumen.
- Standardisasi instruksi dan kondisi pengujian.
- Pisahkan soal latihan dari soal assessment jika memungkinkan.
- Hindari perubahan materi atau scoring selama pengumpulan data tanpa dokumentasi dan penilaian dampaknya.
- Catat kegagalan teknis dan data yang tidak lengkap.
- Jangan menyamakan completion rate dengan efektivitas edukasi.

---

## 10. Keamanan dan Privasi

Karena target pengguna adalah anak-anak dan data digunakan untuk penelitian, keamanan harus menjadi persyaratan desain sejak awal.

### 10.1 Threat model

| Risiko | Mitigasi |
|---|---|
| Manipulasi skor dari JavaScript atau DevTools | Backend menghitung ulang skor dari jawaban dan aturan versi yang tersimpan. |
| Klaim reward berulang | ID sesi unik, operasi idempoten, dan transaksi database. |
| Akses data peserta lain | Otorisasi setiap endpoint berdasarkan pengguna, profil, studi, dan hak akses yang sesuai. |
| Bridge disalahgunakan halaman asing | Allowlist origin, validasi payload, dan navigasi eksternal dibatasi. |
| Token bocor melalui URL atau log | Pertukaran kode sesi sekali pakai; redaksi token dan identitas dari log. |
| Konten berubah saat penelitian berlangsung | Kunci versi game/instrumen dan dokumentasikan setiap perubahan. |
| Pengumpulan data berlebihan | Kumpulkan hanya event yang relevan dengan tujuan produk dan penelitian. |
| Koneksi terputus | Status sinkronisasi eksplisit dan mekanisme retry yang idempoten. |

### 10.2 Checklist keamanan WebView

1. Izinkan navigasi hanya ke origin game yang ditentukan.
2. Validasi schema pesan bridge, panjang payload, dan tipe pesan yang diperbolehkan.
3. Hindari mengaktifkan akses file lokal atau akses lintas file yang tidak diperlukan.
4. Jangan memberikan bridge istimewa kepada halaman eksternal.
5. Gunakan HTTPS untuk komunikasi jaringan.
6. Jangan menyimpan kredensial sensitif di `localStorage` hanya demi kemudahan integrasi.
7. Uji reload, background/resume, sesi kedaluwarsa, dan koneksi putus.
8. Periksa log agar token, jawaban sensitif, atau identitas langsung tidak terekspos.
9. Terapkan pembatasan payload dan rate limiting di backend.
10. Uji otorisasi dengan akun/profil berbeda, termasuk percobaan mengakses session ID milik peserta lain.

### 10.3 Privasi dan perlindungan peserta

Pisahkan:

- **Data operasional:** akun, izin akses, profil anak, dan status sesi.
- **Data penelitian:** kode peserta, versi intervensi, skor instrumen, dan event yang diperlukan.

Pseudonimisasi mengurangi paparan identitas tetapi tidak membuat data otomatis anonim. Pemetaan identitas akun dengan kode peserta sebaiknya disimpan terpisah dan hanya dapat diakses oleh pihak berwenang.

Jika penelitian melibatkan anak, tetapkan persetujuan orang tua/wali dan prosedur persetujuan anak sesuai usia, protokol etik, dan aturan perlindungan data yang berlaku. Persetujuan menggunakan aplikasi tidak otomatis sama dengan persetujuan ikut penelitian.

Tetapkan tujuan penggunaan data, masa retensi, akses, ekspor, dan penghapusan sebelum rekrutmen peserta dimulai.

---

## 11. Rencana Implementasi MVP

Perkiraan berikut adalah estimasi awal untuk satu developer yang sudah memahami codebase Si-Cehat dan memperoleh konten/desain penelitian yang cukup. Ini bukan jaminan jadwal.

### Sprint 1 — Fondasi dan spesifikasi (2–3 hari kerja)

- Audit struktur Flutter, backend, autentikasi, dan database.
- Tentukan kompetensi belajar dan aturan game.
- Buat wireframe, state machine, dan kontrak API.
- Tentukan kebutuhan evaluasi dan persetujuan penelitian.

**Deliverable:** spesifikasi MVP yang siap diimplementasikan.

### Sprint 2 — Gameplay web (3–5 hari kerja)

- Implementasikan Piring Sehat Nimbo.
- Buat drag-and-drop yang mendukung sentuhan.
- Tambahkan umpan balik, animasi sederhana, dan knowledge check.
- Implementasikan layout responsif dan state game yang dapat diuji.

**Deliverable:** web game yang bisa dimainkan mandiri.

### Sprint 3 — Integrasi Flutter dan backend (3–5 hari kerja)

- Tambahkan launcher WebView di Flutter.
- Integrasikan pembuatan sesi dan autentikasi.
- Implementasikan API hasil, validasi skor, dan sinkronisasi.
- Simpan progres dan versi game.

**Deliverable:** game berjalan end-to-end di dalam Si-Cehat.

### Sprint 4 — QA dan pilot terbatas (3–5 hari kerja)

- Uji keamanan bridge dan otorisasi.
- Uji perangkat Android dan koneksi tidak stabil.
- Uji pemahaman instruksi dan usability.
- Verifikasi ekspor data dan konsistensi hasil.

**Deliverable:** MVP siap memasuki evaluasi sesuai protokol penelitian.

### Estimasi total

Sekitar **11–18 hari kerja** untuk satu developer, belum termasuk persetujuan etik, rekrutmen peserta, validasi instrumen, atau perubahan besar pada autentikasi dan model data.

---

## 12. Kriteria Penerimaan MVP

### Gameplay

- Game dapat diselesaikan pada layar ponsel tanpa interaksi yang bergantung pada hover atau mouse.
- Instruksi dipahami oleh pengguna sasaran dalam usability testing.
- Kesalahan menghasilkan umpan balik edukatif yang sesuai.
- Gameplay score dan knowledge score tidak dicampur.

### WebView

- Game dapat dibuka dan ditutup dengan benar.
- Tombol kembali, loading, error, background/resume, dan sesi kedaluwarsa ditangani.
- Navigasi hanya mengizinkan origin yang disetujui.

### Keamanan

- Skor final tidak ditentukan sepihak oleh client.
- Session ID milik peserta lain tidak dapat diakses.
- Pesan bridge divalidasi.
- Token jangka panjang tidak berada di URL atau log.
- Permintaan penyelesaian berulang tidak menggandakan hasil/reward.

### Konsistensi data

- Hasil tersimpan satu kali sesuai aturan sesi.
- Versi game dan instrumen tersimpan.
- Retry tidak menggandakan event/result.
- Status sinkronisasi dan data tidak lengkap ditangani secara eksplisit.

### Penelitian dan privasi

- Pre-test/post-test dapat ditautkan menggunakan kode peserta yang sesuai.
- Dataset ekspor tidak berisi identitas langsung yang tidak diperlukan.
- Konten, instrumen, dan aturan scoring memiliki versi.
- Retensi dan akses data telah ditetapkan.

---

## 13. Batasan MVP: Fitur yang Ditunda

Jangan masukkan fitur berikut pada iterasi pertama kecuali ada kebutuhan penelitian yang jelas:

- Multiplayer dan leaderboard publik.
- Avatar dengan animasi kompleks.
- Ekonomi virtual, toko item, atau reward yang dapat ditukar.
- Editor generik untuk membuat banyak game.
- AI yang mengubah materi atau penilaian secara dinamis.
- Dashboard penelitian kompleks dengan visualisasi real-time.

Prioritas MVP adalah membuktikan bahwa satu game dapat dimainkan dengan baik, terintegrasi dengan aman, menghasilkan data yang valid, dan mendukung pengukuran pembelajaran.

---

## 14. Arahan untuk Coding Agent

Gunakan dokumen ini sebagai **spesifikasi awal**, bukan izin untuk langsung mengubah semua bagian codebase. Audit repository terlebih dahulu dan pertahankan pola arsitektur yang sudah ada jika masih layak.

### Tahap kerja wajib

1. **Audit repository**
   - Identifikasi struktur Flutter, web frontend, backend Bun, Prisma schema, autentikasi, dan model profil anak.
   - Temukan pola API, error handling, logging, dan testing yang sudah digunakan.
   - Jangan membuat ulang model pengguna atau sistem autentikasi tanpa alasan yang kuat.

2. **Laporkan temuan dan rencana**
   - Tunjukkan file/komponen yang akan ditambah atau diubah.
   - Identifikasi risiko migrasi database dan kompatibilitas API.
   - Konfirmasi asumsi yang belum diketahui sebelum perubahan berisiko tinggi.

3. **Implementasikan vertical slice**
   - Mulai dari satu game dengan satu alur lengkap.
   - Bangun gameplay lokal terlebih dahulu, lalu integrasikan WebView, sesi API, hasil, dan penyimpanan.
   - Jangan membangun game lain atau dashboard kompleks sebelum vertical slice lolos pengujian.

4. **Keamanan sejak awal**
   - Terapkan allowlist origin WebView dan validasi bridge.
   - Jangan percaya skor final dari client.
   - Jangan menyimpan token jangka panjang di URL atau `localStorage`.
   - Pastikan otorisasi berdasarkan pengguna/profil yang benar.

5. **Data penelitian yang dapat ditelusuri**
   - Catat versi game, konten, dan instrumen.
   - Pisahkan gameplay score dari knowledge score.
   - Dokumentasikan data yang dikumpulkan dan tujuan setiap event.

6. **Pengujian**
   - Unit test untuk scoring dan validasi.
   - Integration test untuk pembuatan/penyelesaian sesi dan idempotency.
   - Test otorisasi antarprofil.
   - Test WebView di perangkat Android, termasuk back navigation dan lifecycle.
   - Test retry dan koneksi terputus.
   - Usability test dengan prosedur yang sesuai untuk peserta anak.

7. **Deliverable akhir**
   - Ringkasan perubahan dan alasan arsitektural.
   - Daftar file yang ditambah/diubah.
   - Migrasi database jika diperlukan.
   - Dokumentasi setup dan konfigurasi environment.
   - Cara menjalankan web game dan aplikasi Flutter.
   - Hasil test yang benar-benar dijalankan.
   - Risiko atau pekerjaan yang belum selesai.

### Batasan untuk agent

- Jangan mengasumsikan nama tabel, model, atau endpoint yang belum ditemukan di repository.
- Jangan melakukan migrasi destruktif atau menghapus data.
- Jangan mengubah konfigurasi aplikasi utama secara luas untuk memudahkan game.
- Jangan mengklaim tes lulus jika belum dijalankan.
- Jangan mengklaim efektivitas edukasi tanpa hasil penelitian yang sesuai.
- Jangan memasukkan data pribadi nyata anak ke fixture, log, atau dataset pengembangan.
- Jika requirement bertentangan dengan arsitektur yang ada, jelaskan trade-off dan usulkan perubahan minimal sebelum melanjutkan.

---

## 15. Keputusan yang Harus Dikonfirmasi Sebelum Implementasi

1. **Target usia dan populasi:** apakah rentang 6–12 tahun benar-benar sesuai dengan peserta penelitian?
2. **Topik edukasi:** apakah fokus pertama adalah gizi seimbang, kebersihan tangan, hidrasi, atau topik lain yang ditetapkan peneliti?
3. **Instrumen penelitian:** apakah sudah tersedia dan ditinjau/validasi untuk tujuan penelitian?
4. **Mode koneksi:** apakah game harus dapat dimainkan offline, atau boleh membutuhkan koneksi aktif?
5. **Profil dan autentikasi:** model profil anak dan mekanisme autentikasi apa yang sudah tersedia di repository?
6. **Penyimpanan data:** event apa yang benar-benar diperlukan, siapa yang boleh mengaksesnya, dan berapa lama data disimpan?
7. **Desain studi:** apakah studi menggunakan satu kelompok atau kelompok pembanding, dan apakah follow-up dibutuhkan?

Jika keputusan tersebut belum tersedia, coding agent harus mendokumentasikan asumsi dan menghindari implementasi yang mengunci desain penelitian secara prematur.

---

## 16. Kesimpulan

Arsitektur yang direkomendasikan adalah:

**Flutter → WebView → Piring Sehat Nimbo → Backend Bun → PostgreSQL/Prisma → evaluasi penelitian.**

Bangun satu vertical slice yang lengkap sebelum memperluas katalog game. Pastikan gameplay, integrasi, keamanan, konsistensi data, dan evaluasi penelitian berjalan bersama. Keberhasilan MVP bukan sekadar game bisa dimainkan, tetapi game dapat digunakan secara aman dan menghasilkan data yang dapat ditafsirkan dengan benar.

> **Catatan:** Dokumen ini adalah rancangan teknis dan produk awal. Konten kesehatan, instrumen evaluasi, protokol penelitian, perlindungan peserta anak, dan persyaratan etik harus ditinjau oleh pihak yang kompeten sebelum studi dijalankan.

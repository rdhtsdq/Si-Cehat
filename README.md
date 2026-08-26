# Si Cehat

Si Cehat adalah prototipe web **AI health companion** untuk membantu anak usia 8-12 tahun mempelajari kebiasaan sehat melalui avatar, percakapan singkat, misi harian, pencatatan sederhana, dan reward. Orang tua mendapat ringkasan lokal untuk mendukung percakapan keluarga yang positif.

Pengalaman anak menggunakan konsep **Adventure Map**: anak memilih mascot, menjelajahi lokasi misi, mencatat air putih, makanan, dan aktivitas, lalu memperoleh XP. Si Cehat adalah teman edukasi, bukan dokter atau alat diagnosis.

> `PRD.md` adalah sumber utama untuk perilaku produk, ruang lingkup MVP, kebutuhan penelitian, dan batas keselamatan.

## Status

Proyek ini masih berupa **prototipe MVP untuk penelitian**.

Yang sudah tersedia:

- Onboarding bertema petualangan.
- Empat avatar: Bimbi, Apo, Brok, dan Roro.
- Aksesori, warna avatar, ekspresi, dan animasi mascot.
- Peta misi anak untuk air putih, aktivitas, makanan, tantangan, dan kuis.
- XP, level, skor keterlibatan, dan streak sederhana.
- Chat AI berbahasa Indonesia melalui endpoint server.
- Ringkasan orang tua dan inspirasi menu keluarga.
- Persistensi avatar dan progres harian menggunakan `localStorage`.

Belum tersedia:

- Akun, autentikasi, atau pemisahan akses orang tua dan anak.
- Database dan sinkronisasi antarperangkat.
- Riwayat chat persisten.
- Notifikasi, voice input, TTS, atau integrasi tenaga kesehatan.
- Test suite dan CI otomatis.

## Halaman

| Route | Fungsi |
| --- | --- |
| `/` | Gerbang onboarding dan pilihan mode. |
| `/avatar` | Memilih karakter, aksesori, dan warna mascot. |
| `/child` | Peta misi, tracking kebiasaan, kuis, tantangan, XP, dan level. |
| `/chat` | Percakapan edukasi dengan Si Cehat. |
| `/parent` | Ringkasan progres lokal dan ide menu keluarga. |
| `/api/chat` | Proxy server untuk provider AI OpenAI-compatible. |

## Teknologi

- [Next.js 15](https://nextjs.org/) App Router
- React 19 dan TypeScript strict mode
- Tailwind CSS v4
- Motion / Framer Motion untuk animasi avatar
- Zod untuk validasi input, environment, respons AI, dan data lokal
- Bun untuk dependency management dan scripts
- API AI dengan format OpenAI-compatible
- `localStorage` untuk data prototipe

## Quick Start

### Prasyarat

- [Bun](https://bun.sh/) terpasang.
- Kredensial provider AI OpenAI-compatible jika ingin memakai fitur chat.

### Instalasi

```bash
bun install
```

Salin konfigurasi environment:

```bash
cp .env.example .env.local
```

Isi `.env.local`:

```env
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your-server-only-api-key
AI_MODEL=gpt-4o-mini
```

Jalankan development server:

```bash
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Fitur selain chat tetap dapat digunakan tanpa kredensial AI. Jika konfigurasi belum lengkap, `/api/chat` akan mengembalikan status `503` dengan pesan ramah pengguna.

## Konfigurasi AI

`POST /api/chat` menerima daftar pesan tervalidasi, menambahkan system prompt keselamatan, lalu meneruskan permintaan ke:

```text
${AI_BASE_URL}/chat/completions
```

Environment yang dibutuhkan:

| Variable | Keterangan |
| --- | --- |
| `AI_BASE_URL` | Base URL provider tanpa suffix `/chat/completions`. |
| `AI_API_KEY` | API key server-only. Jangan gunakan prefix `NEXT_PUBLIC_`. |
| `AI_MODEL` | Nama model yang didukung provider. |

Kontrak request internal:

```json
{
  "messages": [
    { "role": "user", "content": "Kenapa kita perlu minum air putih?" }
  ]
}
```

Kontrak respons berhasil:

```json
{
  "message": "Air putih membantu tubuhmu bekerja dengan baik..."
}
```

Setiap pesan dibatasi 1-1000 karakter dan satu request memuat maksimal 12 pesan. UI hanya mengirim 10 pesan terakhir agar konteks dan biaya tetap terbatas.

## Arsitektur

```text
Browser
  |
  |-- /avatar ---------> src/lib/avatar.ts ------> localStorage
  |-- /child ----------> src/lib/progress.ts ----> localStorage
  |-- /parent ---------> src/lib/progress.ts ----> localStorage yang sama
  |-- /chat
        |
        `-- POST /api/chat
              |
              |-- validasi Zod
              |-- system prompt keselamatan
              `-- provider /chat/completions
```

Keputusan MVP yang penting:

- Avatar dan progres harian disimpan hanya di browser untuk menghindari kebutuhan database pada tahap penelitian.
- Parent mode membaca data dari browser yang sama. Ini belum merupakan kontrol orang tua berbasis akun.
- Riwayat percakapan hanya hidup selama halaman chat aktif dan tidak disimpan ke `localStorage`.
- Semua kredensial dan panggilan provider AI berada di server route.
- Output provider divalidasi sebelum dikirim ke client.

## Struktur Proyek

```text
src/
  app/
    api/chat/route.ts    # Boundary dan proxy provider AI
    avatar/page.tsx      # Kustomisasi mascot
    chat/page.tsx        # Antarmuka percakapan
    child/page.tsx       # Adventure map dan tracking anak
    parent/page.tsx      # Ringkasan keluarga
    globals.css          # Token dan bahasa visual global
    layout.tsx           # Root layout dan metadata
    page.tsx             # Onboarding
  components/
    AvatarRenderer.tsx   # Mascot SVG dan state animasi
  lib/
    avatar.ts            # Model dan persistensi avatar
    chat.ts              # Schema pesan dan system prompt
    progress.ts          # Model, validasi, dan ringkasan progres
```

Dokumen pendukung:

- `PRD.md`: sumber kebutuhan produk dan penelitian.
- `AGENTS.md`: aturan kerja untuk engineer dan coding agent.
- `graphify-out/`: knowledge graph dan laporan hubungan kode.

## Data Lokal

Data prototipe disimpan pada browser dengan key berikut:

| Key | Isi |
| --- | --- |
| `si-cehat-avatar` | Karakter, aksesori, dan warna mascot. |
| `si-cehat-progress` | Progres air, aktivitas, makanan, misi, kuis, XP, dan streak hari ini. |

Progres harian akan kembali ke nilai awal ketika tanggal berubah. Menghapus site data pada browser juga akan menghapus seluruh preferensi dan progres.

Jangan gunakan data kesehatan anak asli untuk pengujian prototipe. Gunakan data dummy atau skenario penelitian yang sudah disetujui.

## Batas Keselamatan

Si Cehat dirancang sebagai **educational companion, bukan medical advisor**.

Respons AI harus:

- Menggunakan Bahasa Indonesia sederhana dan kalimat pendek.
- Berfokus pada makanan, minuman, aktivitas fisik, dan kebiasaan sehat.
- Bersikap positif, tidak menghakimi, dan tidak menakut-nakuti anak.
- Mendorong anak berbicara dengan orang tua/wali dan tenaga kesehatan untuk keluhan pribadi.

Respons AI tidak boleh:

- Memberikan diagnosis atau menyatakan anak menderita penyakit tertentu.
- Memberikan dosis atau rekomendasi obat.
- Menyarankan diet ekstrem.
- Menggunakan body shaming, rasa bersalah, atau melabeli makanan sebagai selalu "jahat".
- Menggantikan konsultasi dengan tenaga kesehatan.

System prompt membantu mengarahkan respons, tetapi bukan satu-satunya batas keamanan. Validasi input, pembatasan request, server-only credentials, dan validasi respons provider tetap diterapkan di kode.

## Commands

| Command | Fungsi |
| --- | --- |
| `bun install` | Memasang dependencies. |
| `bun run dev` | Menjalankan development server. |
| `bun run lint` | Menjalankan ESLint. |
| `bun run typecheck` | Menjalankan TypeScript tanpa emit. |
| `bun run build` | Membuat production build. |
| `bun run start` | Menjalankan production build. |

Quality gate saat ini:

```bash
bun run lint
bun run typecheck
bun run build
```

Belum ada automated test suite. Perubahan UI perlu diperiksa pada ukuran mobile dan desktop, sedangkan perubahan chat perlu diuji dengan provider yang dikonfigurasi melalui `.env.local`.

## Kontribusi

1. Baca `PRD.md` sebelum mengubah perilaku produk atau batas keselamatan.
2. Gunakan Bun dan pertahankan Bun sebagai satu-satunya package manager.
3. Jangan masukkan API key, data kesehatan anak, atau `.env.local` ke version control.
4. Validasi seluruh input eksternal dengan Zod pada boundary.
5. Pertahankan bahasa anak yang singkat, positif, dan non-diagnostik.
6. Jalankan seluruh quality gate sebelum menyerahkan perubahan.
7. Setelah perubahan kode, jalankan `graphify update .` agar knowledge graph tetap mutakhir.

## Product Loop

```text
Talk -> Learn -> Do -> Track -> Reward -> Repeat
```

Tujuan akhirnya adalah membuat edukasi kesehatan anak terasa seperti berinteraksi dengan teman, bukan membaca buku kesehatan.

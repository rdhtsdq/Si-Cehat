"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";

interface ParameterRow {
  field: string;
  dataType: string;
  mandatory: boolean;
  description: string;
}

interface ResponseFieldRow {
  field: string;
  dataType: string;
  description: string;
}

interface BcaStyleEndpoint {
  id: string;
  category: "AUTH" | "ANAK" | "PARENT" | "ADMIN";
  categoryTitle: string;
  title: string;
  description: string;
  httpMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  host: string;
  authRequired: "None (Public)" | "Guardian Session" | "Admin Login (Role: ADMIN)";
  infoBox?: {
    type: "info" | "warning";
    title?: string;
    text: string;
  };
  headers: {
    name: string;
    format: string;
    mandatory: boolean;
    description: string;
  }[];
  requestParams?: ParameterRow[];
  responseFields: ResponseFieldRow[];
  requestCurl: string;
  responseSample: object | string;
  errorSample?: {
    status: number;
    body: object;
  };
}

const BCA_ENDPOINTS: BcaStyleEndpoint[] = [
  // ==========================================
  // ROLE: ANAK & EDUKASI KESEHATAN
  // ==========================================
  {
    id: "anak-chat",
    category: "ANAK",
    categoryTitle: "ROLE: ANAK & EDUKASI",
    title: "AI Chat Edukasi (Si Cehat)",
    description:
      "Layanan inferensi percakapan edukasi kesehatan interaktif untuk anak usia 8-12 tahun. Mengembalikan respon ramah anak maksimal 5 kalimat dalam Bahasa Indonesia serta mematuhi batasan pencegahan medis (tidak meresepkan obat atau mendiagnosis).",
    httpMethod: "POST",
    path: "/api/chat",
    host: "http://localhost:3000",
    authRequired: "None (Public)",
    infoBox: {
      type: "info",
      title: "Mode Tamu & Keamanan Anak",
      text: "Endpoint ini dapat dipanggil tanpa login (Guest Mode). Obrolan dibatasi maksimal 20 turn riwayat pesan untuk menjaga konteks token tetap optimal.",
    },
    headers: [
      {
        name: "Content-Type",
        format: "application/json",
        mandatory: true,
        description: "Format payload request standar JSON.",
      },
    ],
    requestParams: [
      {
        field: "messages",
        dataType: "Array of Object",
        mandatory: true,
        description: "Array riwayat pesan (min 1, maks 20). Tiap objek berisi 'role' ('user'|'assistant') dan 'content' (1-1000 karakter).",
      },
      {
        field: "childId",
        dataType: "String (UUID)",
        mandatory: false,
        description: "UUID identitas anak jika percakapan tersambung ke profil database.",
      },
      {
        field: "sessionId",
        dataType: "String (UUID)",
        mandatory: false,
        description: "UUID sesi percakapan untuk menghubungkan riwayat chat berkelanjutan.",
      },
    ],
    responseFields: [
      {
        field: "message",
        dataType: "String",
        description: "Respon teks jawaban edukasi dari asisten AI Si Cehat.",
      },
      {
        field: "sessionId",
        dataType: "String (UUID)",
        description: "UUID sesi chat yang baru dibuat atau diteruskan.",
      },
    ],
    requestCurl: `curl -X POST "http://localhost:3000/api/chat" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Kenapa kita tidak boleh sering makan permen dan es teh manis?"
      }
    ],
    "childId": "550e8400-e29b-41d4-a716-446655440000"
  }'`,
    responseSample: {
      message:
        "Permen dan es teh manis mengandung banyak sekali gula cair! Jika terlalu sering dikonsumsi, tubuh kita bisa mudah lelah, gigi cepat berlubang, dan risiko penyakit gula meningkat. Lebih asyik minum air putih dingin atau makan buah segar ya!",
      sessionId: "710e8400-e29b-41d4-a716-446655440001",
    },
    errorSample: {
      status: 400,
      body: {
        error: {
          message: "Pertanyaannya belum bisa dibaca. Coba tulis lebih singkat ya.",
        },
      },
    },
  },
  {
    id: "anak-avatar-get",
    category: "ANAK",
    categoryTitle: "ROLE: ANAK & EDUKASI",
    title: "Informasi Konfigurasi Avatar",
    description:
      "Mengambil preferensi tampilan visual avatar anak meliputi karakter buah/sayur, aksesori pelengkap, dan warna aura orb.",
    httpMethod: "GET",
    path: "/api/avatar",
    host: "http://localhost:3000",
    authRequired: "None (Public)",
    headers: [
      {
        name: "Accept",
        format: "application/json",
        mandatory: false,
        description: "Menerima format respon JSON.",
      },
    ],
    requestParams: [
      {
        field: "childId",
        dataType: "String (UUID)",
        mandatory: false,
        description: "Query parameter UUID anak. Jika tidak disertakan dan sedang login, mengambil anak pertama.",
      },
    ],
    responseFields: [
      {
        field: "character",
        dataType: "String",
        description: "Pilihan karakter: 'default' | 'apple' | 'broccoli' | 'carrot'.",
      },
      {
        field: "accessory",
        dataType: "String",
        description: "Aksesori avatar: 'none' | 'glasses' | 'headphone' | 'hat'.",
      },
      {
        field: "orbColor",
        dataType: "String",
        description: "Kode warna hexadecimal aura orb (contoh: '#4f9f7a').",
      },
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/avatar?childId=550e8400-e29b-41d4-a716-446655440000"`,
    responseSample: {
      character: "broccoli",
      accessory: "glasses",
      orbColor: "#4f9f7a",
    },
  },
  {
    id: "anak-avatar-post",
    category: "ANAK",
    categoryTitle: "ROLE: ANAK & EDUKASI",
    title: "Simpan Konfigurasi Avatar",
    description:
      "Menyimpan kustomisasi visual avatar anak. Jika dipanggil oleh pengguna yang login, disimpan ke database; jika mode tamu, dikembalikan dengan flag savedLocallyOnly.",
    httpMethod: "POST",
    path: "/api/avatar",
    host: "http://localhost:3000",
    authRequired: "None (Public)",
    headers: [
      {
        name: "Content-Type",
        format: "application/json",
        mandatory: true,
        description: "application/json",
      },
    ],
    requestParams: [
      {
        field: "character",
        dataType: "String",
        mandatory: true,
        description: "Karakter: 'default' | 'apple' | 'broccoli' | 'carrot'.",
      },
      {
        field: "accessory",
        dataType: "String",
        mandatory: true,
        description: "Aksesori: 'none' | 'glasses' | 'headphone' | 'hat'.",
      },
      {
        field: "orbColor",
        dataType: "String",
        mandatory: true,
        description: "Kode warna Hex (contoh '#ef4444').",
      },
      {
        field: "childId",
        dataType: "String (UUID)",
        mandatory: false,
        description: "UUID profil target anak jika login.",
      },
    ],
    responseFields: [
      {
        field: "success",
        dataType: "Boolean",
        description: "Status keberhasilan penyimpanan database (true).",
      },
      {
        field: "preference",
        dataType: "Object",
        description: "Objek preferensi avatar yang tersimpan.",
      },
    ],
    requestCurl: `curl -X POST "http://localhost:3000/api/avatar" \\
  -H "Content-Type: application/json" \\
  -d '{
    "character": "apple",
    "accessory": "hat",
    "orbColor": "#ef4444",
    "childId": "550e8400-e29b-41d4-a716-446655440000"
  }'`,
    responseSample: {
      success: true,
      preference: {
        character: "apple",
        accessory: "hat",
        orbColor: "#ef4444",
      },
    },
  },
  {
    id: "anak-progress-get",
    category: "ANAK",
    categoryTitle: "ROLE: ANAK & EDUKASI",
    title: "Informasi Progres Harian & Log Makanan",
    description:
      "Mengambil statistik progres harian anak meliputi jumlah gelas air putih, menit aktivitas fisik, perolehan poin XP, streak berturut-turut, dan catatan makanan pada tanggal spesifik.",
    httpMethod: "GET",
    path: "/api/progress",
    host: "http://localhost:3000",
    authRequired: "None (Public)",
    headers: [
      {
        name: "Accept",
        format: "application/json",
        mandatory: false,
        description: "application/json",
      },
    ],
    requestParams: [
      {
        field: "childId",
        dataType: "String (UUID)",
        mandatory: false,
        description: "UUID profil anak target.",
      },
      {
        field: "date",
        dataType: "String (YYYY-MM-DD)",
        mandatory: false,
        description: "Tanggal data yang diminta (default: hari ini).",
      },
    ],
    responseFields: [
      {
        field: "childId",
        dataType: "String (UUID)",
        description: "UUID profil anak.",
      },
      {
        field: "waterGlasses",
        dataType: "Integer",
        description: "Jumlah gelas air yang sudah diminum.",
      },
      {
        field: "activityMinutes",
        dataType: "Integer",
        description: "Total durasi aktivitas fisik aktif dalam menit.",
      },
      {
        field: "xp",
        dataType: "Integer",
        description: "Total akumulasi poin pengalaman (XP).",
      },
      {
        field: "streak",
        dataType: "Integer",
        description: "Jumlah hari berturut-turut aktif menyelesaikan misi.",
      },
      {
        field: "foodLogs",
        dataType: "Array of Object",
        description: "Daftar makanan yang dicatat beserta kategori gizinya ('balanced'|'sweet'|'fried'|'unknown').",
      },
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/progress?childId=550e8400-e29b-41d4-a716-446655440000&date=2026-10-01"`,
    responseSample: {
      childId: "550e8400-e29b-41d4-a716-446655440000",
      childName: "Budi Santoso",
      date: "2026-10-01",
      waterGlasses: 6,
      activityMinutes: 30,
      xp: 85,
      streak: 3,
      foodLogs: [
        { name: "Apel Manis Segar", tone: "balanced" },
        { name: "Donat Cokelat Gula", tone: "sweet" },
      ],
      avatarPreference: {
        character: "apple",
        accessory: "hat",
        orbColor: "#ef4444",
      },
    },
  },
  {
    id: "anak-progress-post",
    category: "ANAK",
    categoryTitle: "ROLE: ANAK & EDUKASI",
    title: "Sinkronisasi / Catat Progres Harian",
    description:
      "Menyimpan atau memperbarui data minum air, menit gerak, XP, dan daftar pencatatan makanan pada hari ini ke database PostgreSQL.",
    httpMethod: "POST",
    path: "/api/progress",
    host: "http://localhost:3000",
    authRequired: "None (Public)",
    headers: [
      {
        name: "Content-Type",
        format: "application/json",
        mandatory: true,
        description: "application/json",
      },
    ],
    requestParams: [
      {
        field: "waterGlasses",
        dataType: "Integer",
        mandatory: false,
        description: "Jumlah gelas air (0-30).",
      },
      {
        field: "activityMinutes",
        dataType: "Integer",
        mandatory: false,
        description: "Durasi aktif fisik dalam menit (0-600).",
      },
      {
        field: "xpEarned",
        dataType: "Integer",
        mandatory: false,
        description: "Poin XP bertambah (0-9999).",
      },
      {
        field: "streak",
        dataType: "Integer",
        mandatory: false,
        description: "Streak harian (0-365).",
      },
      {
        field: "foodLogs",
        dataType: "Array of Object",
        mandatory: false,
        description: "Daftar makanan: [{ name: string, tone: 'balanced'|'sweet'|'fried'|'unknown' }].",
      },
    ],
    responseFields: [
      {
        field: "success",
        dataType: "Boolean",
        description: "Status keberhasilan sinkronisasi (true).",
      },
      {
        field: "progressId",
        dataType: "String (UUID)",
        description: "ID catatan progres yang diperbarui atau dibuat.",
      },
    ],
    requestCurl: `curl -X POST "http://localhost:3000/api/progress" \\
  -H "Content-Type: application/json" \\
  -d '{
    "childId": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2026-10-01",
    "waterGlasses": 7,
    "activityMinutes": 45,
    "xpEarned": 110,
    "streak": 4,
    "foodLogs": [
      { "name": "Sayur Sop Bening", "tone": "balanced" },
      { "name": "Tahu Tempe Goreng", "tone": "fried" }
    ]
  }'`,
    responseSample: {
      success: true,
      progressId: "910e8400-e29b-41d4-a716-446655440099",
      childId: "550e8400-e29b-41d4-a716-446655440000",
    },
  },
  {
    id: "anak-content-get",
    category: "ANAK",
    categoryTitle: "ROLE: ANAK & EDUKASI",
    title: "Konten Harian (Misi, Kuis, Menu)",
    description:
      "Mengambil tantangan harian aktif, kuis gizi interaktif, dan rekomendasi menu makan bergizi seimbang dari database CMS.",
    httpMethod: "GET",
    path: "/api/content",
    host: "http://localhost:3000",
    authRequired: "None (Public)",
    headers: [
      {
        name: "Accept",
        format: "application/json",
        mandatory: false,
        description: "application/json",
      },
    ],
    responseFields: [
      {
        field: "challenge",
        dataType: "Object",
        description: "Objek tantangan harian aktif (id, title, description, xp).",
      },
      {
        field: "quiz",
        dataType: "Object",
        description: "Objek kuis harian (question, options[], answer, xp).",
      },
      {
        field: "recommendedMenus",
        dataType: "Array of Object",
        description: "Daftar menu makan bergizi seimbang yang direkomendasikan.",
      },
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/content"`,
    responseSample: {
      challenge: {
        id: "c1-229b-41d4-a716-446655440001",
        title: "Misi Warna Piring",
        description: "Makan satu buah atau sayur hari ini, lalu ceritakan warnanya.",
        xp: 30,
      },
      quiz: {
        question: "Minuman apa yang paling baik diminum setiap hari?",
        options: ["Air Putih", "Minuman Bersoda", "Sirup Manis", "Teh Manis"],
        answer: "Air Putih",
        xp: 20,
      },
      recommendedMenus: [
        {
          title: "Sarapan Ceria",
          note: "Nasi, telur dadar sayur, dan potongan buah pepaya.",
        },
        {
          title: "Makan Siang Juara",
          note: "Nasi merah, sup ayam wortel, tahu tempe kukus.",
        },
      ],
    },
  },

  // ==========================================
  // ROLE: PARENT & GUARDIAN
  // ==========================================
  {
    id: "parent-register",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Registrasi Akun Guardian",
    description:
      "Mendaftarkan akun orang tua baru dengan enkripsi password Bcrypt, dan secara otomatis membuat profil entitas anak pertama.",
    httpMethod: "POST",
    path: "/api/auth/register",
    host: "http://localhost:3000",
    authRequired: "None (Public)",
    headers: [
      {
        name: "Content-Type",
        format: "application/json",
        mandatory: true,
        description: "application/json",
      },
    ],
    requestParams: [
      {
        field: "email",
        dataType: "String (Email)",
        mandatory: true,
        description: "Format alamat email valid dan unik.",
      },
      {
        field: "password",
        dataType: "String",
        mandatory: true,
        description: "Kata sandi akun, minimal 6 karakter.",
      },
      {
        field: "childName",
        dataType: "String",
        mandatory: false,
        description: "Nama anak pertama (1-40 karakter, default: 'Teman Cehat').",
      },
    ],
    responseFields: [
      {
        field: "success",
        dataType: "Boolean",
        description: "Indikator pendaftaran sukses (true).",
      },
      {
        field: "guardian",
        dataType: "Object",
        description: "Data id, email, dan daftar profil anak yang terbuat.",
      },
    ],
    requestCurl: `curl -X POST "http://localhost:3000/api/auth/register" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "orangtua@example.com",
    "password": "PasswordAman123",
    "childName": "Budi Santoso"
  }'`,
    responseSample: {
      success: true,
      guardian: {
        id: "g10e8400-e29b-41d4-a716-446655440001",
        email: "orangtua@example.com",
        children: [
          {
            id: "c10e8400-e29b-41d4-a716-446655440001",
            name: "Budi Santoso",
            guardianId: "g10e8400-e29b-41d4-a716-446655440001",
          },
        ],
      },
    },
    errorSample: {
      status: 409,
      body: {
        error: {
          message: "Email sudah terdaftar. Silakan login.",
        },
      },
    },
  },
  {
    id: "parent-children-get",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Daftar Profil Anak Guardian",
    description:
      "Mengambil daftar seluruh anak yang berada di bawah kepemilikan akun orang tua yang sedang login beserta riwayat progres 7 hari terakhir.",
    httpMethod: "GET",
    path: "/api/children",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    infoBox: {
      type: "info",
      text: "Wajib menyertakan Cookie Sesi NextAuth yang valid. Pengguna hanya dapat mengakses data anak milik akunnya sendiri.",
    },
    headers: [
      {
        name: "Cookie",
        format: "authjs.session-token=<TOKEN>",
        mandatory: true,
        description: "Cookie sesi terotentikasi.",
      },
    ],
    responseFields: [
      {
        field: "children",
        dataType: "Array of Object",
        description: "Daftar entitas anak lengkap dengan nama, preferensi avatar, dan array dailyProgresses.",
      },
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/children" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..."`,
    responseSample: {
      children: [
        {
          id: "c10e8400-e29b-41d4-a716-446655440001",
          guardianId: "g10e8400-e29b-41d4-a716-446655440001",
          name: "Budi",
          avatarPreference: "{\"character\":\"apple\",\"accessory\":\"glasses\",\"orbColor\":\"#4f9f7a\"}",
          dailyProgresses: [
            {
              id: "p1-0001",
              date: "2026-10-01T00:00:00.000Z",
              waterGlasses: 6,
              activityMinutes: 30,
              xpEarned: 50,
              streak: 3,
            },
          ],
        },
      ],
    },
    errorSample: {
      status: 401,
      body: {
        error: {
          message: "Harus login terlebih dahulu.",
        },
      },
    },
  },
  {
    id: "parent-children-post",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Tambah Profil Anak Baru",
    description:
      "Menambahkan anak baru di bawah akun orang tua yang sedang terautentikasi.",
    httpMethod: "POST",
    path: "/api/children",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      {
        name: "Content-Type",
        format: "application/json",
        mandatory: true,
        description: "application/json",
      },
      {
        name: "Cookie",
        format: "authjs.session-token=<TOKEN>",
        mandatory: true,
        description: "Cookie sesi login.",
      },
    ],
    requestParams: [
      {
        field: "name",
        dataType: "String",
        mandatory: true,
        description: "Nama profil anak (1-40 karakter).",
      },
    ],
    responseFields: [
      {
        field: "child",
        dataType: "Object",
        description: "Entitas profil anak yang baru saja dibuat.",
      },
    ],
    requestCurl: `curl -X POST "http://localhost:3000/api/children" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..." \\
  -d '{
    "name": "Siti Rahma"
  }'`,
    responseSample: {
      child: {
        id: "c20e8400-e29b-41d4-a716-446655440002",
        guardianId: "g10e8400-e29b-41d4-a716-446655440001",
        name: "Siti Rahma",
        avatarPreference: "{\"character\":\"default\",\"accessory\":\"none\",\"orbColor\":\"#4f9f7a\"}",
      },
    },
    errorSample: {
      status: 400,
      body: {
        error: {
          message: "Nama anak harus diisi.",
        },
      },
    },
  },

{
    id: "parent-profile-get",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Profil Ibu (Detail & Demografis)",
    description: "Mengambil data lengkap profil ibu yang terautentikasi (Nama, Nomor Telepon/WhatsApp, Pendidikan, Pekerjaan, dan Alamat Rumah).",
    httpMethod: "GET",
    path: "/api/parent/profile",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      { name: "Cookie", format: "authjs.session-token=<TOKEN>", mandatory: true, description: "Cookie sesi login ibu" }
    ],
    responseFields: [
      { field: "profile.id", dataType: "String (UUID)", description: "ID unik ibu di database" },
      { field: "profile.name", dataType: "String", description: "Nama lengkap ibu" },
      { field: "profile.phone", dataType: "String", description: "Nomor kontak / WhatsApp" },
      { field: "profile.education", dataType: "String", description: "Tingkat pendidikan terakhir" },
      { field: "profile.occupation", dataType: "String", description: "Pekerjaan saat ini" },
      { field: "profile.address", dataType: "String", description: "Alamat domisili" }
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/parent/profile" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..."`,
    responseSample: {
      profile: {
        id: "g10e8400-e29b-41d4-a716-446655440001",
        email: "ibu.rina@example.com",
        name: "Ibu Rina Sasmita",
        phone: "081234567890",
        education: "S1 Pendidikan",
        occupation: "Guru & Ibu Rumah Tangga",
        address: "Jl. Melati Sehat No. 14, Jakarta",
        role: "GUARDIAN",
        createdAt: "2026-10-01T08:00:00.000Z"
      }
    }
  },
  {
    id: "parent-profile-put",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Perbarui Data Profil Ibu",
    description: "Memperbarui data demografis ibu seperti nomor telepon, pendidikan, pekerjaan, dan alamat.",
    httpMethod: "PUT",
    path: "/api/parent/profile",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      { name: "Content-Type", format: "application/json", mandatory: true, description: "application/json" },
      { name: "Cookie", format: "authjs.session-token=<TOKEN>", mandatory: true, description: "Cookie sesi login ibu" }
    ],
    requestParams: [
      { field: "name", dataType: "String", mandatory: false, description: "Nama lengkap ibu (2-60 karakter)" },
      { field: "phone", dataType: "String", mandatory: false, description: "Nomor telepon aktif" },
      { field: "education", dataType: "String", mandatory: false, description: "Tingkat pendidikan" },
      { field: "occupation", dataType: "String", mandatory: false, description: "Pekerjaan" },
      { field: "address", dataType: "String", mandatory: false, description: "Alamat domisili" }
    ],
    responseFields: [
      { field: "profile", dataType: "Object", description: "Data profil yang telah diperbarui" }
    ],
    requestCurl: `curl -X PUT "http://localhost:3000/api/parent/profile" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..." \\
  -d '{
    "phone": "081299887766",
    "education": "S1 Kesehatan Masyarakat",
    "occupation": "Wirausaha",
    "address": "Jl. Mawar Asri No. 5, Jakarta Selatan"
  }'`,
    responseSample: {
      profile: {
        id: "g10e8400-e29b-41d4-a716-446655440001",
        email: "ibu.rina@example.com",
        name: "Ibu Rina Sasmita",
        phone: "081299887766",
        education: "S1 Kesehatan Masyarakat",
        occupation: "Wirausaha",
        address: "Jl. Mawar Asri No. 5, Jakarta Selatan"
      }
    }
  },
  {
    id: "child-profile-get",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Detail Profil & Riwayat Anak",
    description: "Mengambil data lengkap anak spesifik berdasarkan ID, termasuk tanggal lahir, jenis kelamin, riwayat kesehatan, dan log pertumbuhan terakhir.",
    httpMethod: "GET",
    path: "/api/children/{id}",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      { name: "Cookie", format: "authjs.session-token=<TOKEN>", mandatory: true, description: "Cookie sesi login ibu" }
    ],
    responseFields: [
      { field: "child.id", dataType: "String (UUID)", description: "ID unik anak" },
      { field: "child.name", dataType: "String", description: "Nama anak" },
      { field: "child.age", dataType: "Number", description: "Usia anak (tahun)" },
      { field: "child.gender", dataType: "String", description: "Jenis kelamin (L / P)" },
      { field: "child.birthDate", dataType: "String (ISO)", description: "Tanggal lahir" },
      { field: "child.healthHistory", dataType: "String", description: "Riwayat kesehatan keluarga/alergi" },
      { field: "child.growthMeasurements", dataType: "Array", description: "Pengukuran antropometri terakhir" }
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/children/c10e8400-e29b-41d4-a716-446655440001" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..."`,
    responseSample: {
      child: {
        id: "c10e8400-e29b-41d4-a716-446655440001",
        name: "Ahmad Farhan",
        age: 9,
        gender: "L",
        birthDate: "2017-05-10T00:00:00.000Z",
        healthHistory: "Riwayat diabetes tipe 2 pada kakek",
        growthMeasurements: [
          { weightKg: 32.5, heightCm: 130.5, measuredAt: "2026-10-01T08:00:00.000Z" }
        ]
      }
    }
  },
  {
    id: "child-profile-put",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Perbarui Profil & Riwayat Anak",
    description: "Memperbarui nama, usia, jenis kelamin, tanggal lahir, dan catatan riwayat kesehatan anak.",
    httpMethod: "PUT",
    path: "/api/children/{id}",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      { name: "Content-Type", format: "application/json", mandatory: true, description: "application/json" },
      { name: "Cookie", format: "authjs.session-token=<TOKEN>", mandatory: true, description: "Cookie sesi login ibu" }
    ],
    requestParams: [
      { field: "name", dataType: "String", mandatory: false, description: "Nama anak (min 2 karakter)" },
      { field: "age", dataType: "Number", mandatory: false, description: "Usia anak (2-18 tahun)" },
      { field: "gender", dataType: "String", mandatory: false, description: "Jenis kelamin: 'L' atau 'P'" },
      { field: "birthDate", dataType: "String (ISO)", mandatory: false, description: "Format YYYY-MM-DD" },
      { field: "healthHistory", dataType: "String", mandatory: false, description: "Riwayat medis/alergi/riwayat gula" }
    ],
    responseFields: [
      { field: "child", dataType: "Object", description: "Data profil anak yang telah diperbarui" }
    ],
    requestCurl: `curl -X PUT "http://localhost:3000/api/children/c10e8400-e29b-41d4-a716-446655440001" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..." \\
  -d '{
    "healthHistory": "Tidak ada riwayat alergi, konsumsi susu manis dibatasi 1 gelas per hari",
    "gender": "L"
  }'`,
    responseSample: {
      child: {
        id: "c10e8400-e29b-41d4-a716-446655440001",
        name: "Ahmad Farhan",
        gender: "L",
        healthHistory: "Tidak ada riwayat alergi, konsumsi susu manis dibatasi 1 gelas per hari"
      }
    }
  },
  {
    id: "screening-post",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Kalkulasi Skrining Risiko Diabetes Anak",
    description: "Menghitung persentase skor risiko diabetes (0-100%), kategori risiko (RENDAH, SEDANG, TINGGI), dan rekomendasi klinis terpersonalisasi berdasarkan IMT, konsumsi manis, aktivitas fisik, dan riwayat keluarga.",
    httpMethod: "POST",
    path: "/api/screening",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      { name: "Content-Type", format: "application/json", mandatory: true, description: "application/json" },
      { name: "Cookie", format: "authjs.session-token=<TOKEN>", mandatory: true, description: "Cookie sesi login ibu" }
    ],
    requestParams: [
      { field: "childId", dataType: "String (UUID)", mandatory: true, description: "ID profil anak" },
      { field: "age", dataType: "Number", mandatory: true, description: "Usia anak dalam tahun" },
      { field: "gender", dataType: "String", mandatory: true, description: "'L' atau 'P'" },
      { field: "weightKg", dataType: "Number", mandatory: true, description: "Berat badan aktual (kg)" },
      { field: "heightCm", dataType: "Number", mandatory: true, description: "Tinggi badan aktual (cm)" },
      { field: "familyDiabetesHistory", dataType: "Boolean", mandatory: true, description: "Ada riwayat diabetes keluarga" },
      { field: "sweetDrinkFrequency", dataType: "String", mandatory: true, description: "'JARANG' | 'KADANG' | 'SERING'" },
      { field: "fastFoodFrequency", dataType: "String", mandatory: true, description: "'JARANG' | 'KADANG' | 'SERING'" },
      { field: "dailyPhysicalActivity", dataType: "String", mandatory: true, description: "'<30_MENIT' | '30_60_MENIT' | '>60_MENIT'" },
      { field: "symptoms", dataType: "Array of String", mandatory: false, description: "Gejala yang dirasakan (contoh: sering_haus, sering_kencing, lemas)" }
    ],
    responseFields: [
      { field: "record.riskScore", dataType: "Number", description: "Persentase skor risiko (0-100%)" },
      { field: "record.riskCategory", dataType: "String", description: "Kategori: 'RENDAH' | 'SEDANG' | 'TINGGI'" },
      { field: "record.bmi", dataType: "Number", description: "Indeks Massa Tubuh aktual" },
      { field: "record.recommendations", dataType: "Array of String", description: "Langkah-langkah pencegahan klinis" }
    ],
    requestCurl: `curl -X POST "http://localhost:3000/api/screening" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..." \\
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
    "symptoms": ["sering_haus", "lemas"]
  }'`,
    responseSample: {
      record: {
        id: "scr-uuid-1",
        childId: "c10e8400-e29b-41d4-a716-446655440001",
        riskScore: 68,
        riskCategory: "TINGGI",
        bmi: 23.5,
        recommendations: [
          "Kurangi konsumsi minuman manis dan ganti dengan air putih minimal 6-8 gelas/hari.",
          "Tingkatkan aktivitas fisik minimal 60 menit sehari (bersepeda, jalan kaki, bermain aktif).",
          "Konsultasikan hasil ini dengan dokter anak atau ahli gizi untuk pemeriksaan gula darah puasa."
        ],
        createdAt: "2026-10-02T00:10:00.000Z"
      }
    }
  },
  {
    id: "screening-history",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Riwayat Skrining Risiko Diabetes",
    description: "Mengambil daftar riwayat hasil skrining anak dari waktu ke waktu untuk memantau penurunan tingkat risiko.",
    httpMethod: "GET",
    path: "/api/screening?childId={childId}",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      { name: "Cookie", format: "authjs.session-token=<TOKEN>", mandatory: true, description: "Cookie sesi login ibu" }
    ],
    responseFields: [
      { field: "screenings", dataType: "Array of Object", description: "Daftar rekaman skrining diurutkan dari terbaru" }
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/screening?childId=c10e8400-e29b-41d4-a716-446655440001" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..."`,
    responseSample: {
      screenings: [
        {
          id: "scr-uuid-1",
          riskScore: 68,
          riskCategory: "TINGGI",
          bmi: 23.5,
          createdAt: "2026-10-02T00:10:00.000Z"
        }
      ]
    }
  },
  {
    id: "growth-tracker-get",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Kurva Pertumbuhan & Antropometri WHO",
    description: "Mengambil titik data pengukuran tinggi, berat, lingkar kepala, BMI, Z-score, dan status gizi anak untuk grafik kurva pertumbuhan WHO.",
    httpMethod: "GET",
    path: "/api/tracker/growth?childId={childId}",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      { name: "Cookie", format: "authjs.session-token=<TOKEN>", mandatory: true, description: "Cookie sesi login ibu" }
    ],
    responseFields: [
      { field: "measurements", dataType: "Array of Object", description: "Titik data kurva pertumbuhan" },
      { field: "measurements[].nutritionalStatus", dataType: "String", description: "Gizi Kurang | Normal | Berisiko Gizi Lebih | Obesitas" }
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/tracker/growth?childId=c10e8400-e29b-41d4-a716-446655440001" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..."`,
    responseSample: {
      measurements: [
        {
          id: "grow-uuid-1",
          weightKg: 31.0,
          heightCm: 130.0,
          bmi: 18.3,
          zScoreWeight: 0.45,
          zScoreHeight: 0.22,
          nutritionalStatus: "Gizi Baik (Normal)",
          measuredAt: "2026-10-01T00:00:00.000Z"
        }
      ]
    }
  },
  {
    id: "growth-tracker-post",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Catat Pengukuran Tumbuh Kembang Baru",
    description: "Mencatat hasil penimbangan berat badan dan tinggi badan anak secara berkala (misal dari Posyandu). Menghitung BMI dan status gizi otomatis.",
    httpMethod: "POST",
    path: "/api/tracker/growth",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      { name: "Content-Type", format: "application/json", mandatory: true, description: "application/json" },
      { name: "Cookie", format: "authjs.session-token=<TOKEN>", mandatory: true, description: "Cookie sesi login ibu" }
    ],
    requestParams: [
      { field: "childId", dataType: "String (UUID)", mandatory: true, description: "ID anak" },
      { field: "date", dataType: "String (ISO)", mandatory: true, description: "Tanggal pengukuran (YYYY-MM-DD)" },
      { field: "weightKg", dataType: "Number", mandatory: true, description: "Berat badan (kg)" },
      { field: "heightCm", dataType: "Number", mandatory: true, description: "Tinggi badan (cm)" },
      { field: "headCircumCm", dataType: "Number", mandatory: false, description: "Lingkar kepala (cm)" },
      { field: "notes", dataType: "String", mandatory: false, description: "Catatan khusus pemeriksaan" }
    ],
    responseFields: [
      { field: "measurement", dataType: "Object", description: "Rekaman data pertumbuhan yang tersimpan" }
    ],
    requestCurl: `curl -X POST "http://localhost:3000/api/tracker/growth" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..." \\
  -d '{
    "childId": "c10e8400-e29b-41d4-a716-446655440001",
    "date": "2026-10-02",
    "weightKg": 32.0,
    "heightCm": 131.5,
    "notes": "Pemeriksaan berkala di Posyandu Melati"
  }'`,
    responseSample: {
      measurement: {
        id: "grow-uuid-2",
        childId: "c10e8400-e29b-41d4-a716-446655440001",
        weightKg: 32.0,
        heightCm: 131.5,
        bmi: 18.5,
        nutritionalStatus: "Gizi Baik (Normal)",
        measuredAt: "2026-10-02T00:00:00.000Z"
      }
    }
  },
  {
    id: "nutrition-calculate",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Kalkulator Nutrisi & Kandungan Gula",
    description: "Menghitung estimasi kalori, makronutrisi (karbohidrat, protein, lemak, serat), dan kandungan gula dari nama makanan atau komposisi bahan.",
    httpMethod: "POST",
    path: "/api/nutrition/calculate",
    host: "http://localhost:3000",
    authRequired: "None (Public)",
    headers: [
      { name: "Content-Type", format: "application/json", mandatory: true, description: "application/json" }
    ],
    requestParams: [
      { field: "foodName", dataType: "String", mandatory: true, description: "Nama makanan atau minuman" },
      { field: "portionGram", dataType: "Number", mandatory: true, description: "Berat porsi dalam gram atau mililiter" },
      { field: "ingredients", dataType: "Array of String", mandatory: false, description: "Daftar bahan komposisi (opsional)" }
    ],
    responseFields: [
      { field: "nutrition.calories", dataType: "Number", description: "Total kalori (kkal)" },
      { field: "nutrition.carbsGram", dataType: "Number", description: "Karbohidrat (g)" },
      { field: "nutrition.proteinGram", dataType: "Number", description: "Protein (g)" },
      { field: "nutrition.fatGram", dataType: "Number", description: "Lemak (g)" },
      { field: "nutrition.sugarGram", dataType: "Number", description: "Gula (g)" },
      { field: "nutrition.sugarLevel", dataType: "String", description: "RENDAH | SEDANG | TINGGI" }
    ],
    requestCurl: `curl -X POST "http://localhost:3000/api/nutrition/calculate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "foodName": "Pecel Sayur Saus Kacang",
    "portionGram": 200,
    "ingredients": ["Kangkung", "Tauge", "Kacang Panjang", "Saus Kacang"]
  }'`,
    responseSample: {
      nutrition: {
        foodName: "Pecel Sayur Saus Kacang",
        portionGram: 200,
        calories: 185,
        carbsGram: 18.0,
        proteinGram: 7.5,
        fatGram: 9.0,
        fiberGram: 5.2,
        sugarGram: 4.0,
        sugarLevel: "RENDAH"
      }
    }
  },
  {
    id: "food-diary-get",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Diary Makan Harian Per Slot Waktu",
    description: "Mengambil daftar makanan yang dikonsumsi anak pada tanggal tertentu yang dikelompokkan berdasarkan slot waktu (SARAPAN, MAKAN_SIANG, MAKAN_MALAM, CAMILAN).",
    httpMethod: "GET",
    path: "/api/food-diary?childId={childId}&date={YYYY-MM-DD}",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      { name: "Cookie", format: "authjs.session-token=<TOKEN>", mandatory: true, description: "Cookie sesi login ibu" }
    ],
    responseFields: [
      { field: "diary", dataType: "Object", description: "Objek terkelompok per slot makan" },
      { field: "totals.caloriesKkal", dataType: "Number", description: "Total kalori harian" },
      { field: "totals.sugarGram", dataType: "Number", description: "Total asupan gula harian" }
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/food-diary?childId=c10e8400-e29b-41d4-a716-446655440001&date=2026-10-02" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..."`,
    responseSample: {
      diary: {
        SARAPAN: [
          { id: "fd-1", foodName: "Oatmeal Pisang", portionDescription: "1 mangkok", caloriesKkal: 180, sugarGram: 5.0 }
        ],
        MAKAN_SIANG: [
          { id: "fd-2", foodName: "Sayur Asem & Nasi Merah", portionDescription: "1 porsi", caloriesKkal: 280, sugarGram: 3.5 }
        ],
        MAKAN_MALAM: [],
        CAMILAN: [
          { id: "fd-3", foodName: "Buah Apel Potong", portionDescription: "1 buah", caloriesKkal: 65, sugarGram: 13.0 }
        ]
      },
      totals: {
        caloriesKkal: 525,
        sugarGram: 21.5
      }
    }
  },
  {
    id: "food-diary-post",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Catat Diary Konsumsi Makanan",
    description: "Mencatat menu makanan yang dikonsumsi anak ke dalam salah satu slot waktu makan untuk memantau asupan nutrisi harian.",
    httpMethod: "POST",
    path: "/api/food-diary",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      { name: "Content-Type", format: "application/json", mandatory: true, description: "application/json" },
      { name: "Cookie", format: "authjs.session-token=<TOKEN>", mandatory: true, description: "Cookie sesi login ibu" }
    ],
    requestParams: [
      { field: "childId", dataType: "String (UUID)", mandatory: true, description: "ID anak" },
      { field: "date", dataType: "String (ISO)", mandatory: true, description: "Tanggal konsumsi (YYYY-MM-DD)" },
      { field: "mealSlot", dataType: "String", mandatory: true, description: "'SARAPAN' | 'MAKAN_SIANG' | 'MAKAN_MALAM' | 'CAMILAN'" },
      { field: "foodName", dataType: "String", mandatory: true, description: "Nama makanan atau minuman" },
      { field: "portionDescription", dataType: "String", mandatory: false, description: "Ukuran porsi" },
      { field: "caloriesKkal", dataType: "Number", mandatory: false, description: "Estimasi kalori" },
      { field: "sugarGram", dataType: "Number", mandatory: false, description: "Kandungan gula (g)" }
    ],
    responseFields: [
      { field: "log", dataType: "Object", description: "Rekaman makanan yang baru tersimpan" }
    ],
    requestCurl: `curl -X POST "http://localhost:3000/api/food-diary" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..." \\
  -d '{
    "childId": "c10e8400-e29b-41d4-a716-446655440001",
    "date": "2026-10-02",
    "mealSlot": "MAKAN_SIANG",
    "foodName": "Sayur Asem & Tempe Bakar",
    "portionDescription": "1 mangkok sedang",
    "caloriesKkal": 220,
    "sugarGram": 3.0
  }'`,
    responseSample: {
      log: {
        id: "fd-new-1",
        childId: "c10e8400-e29b-41d4-a716-446655440001",
        mealSlot: "MAKAN_SIANG",
        foodName: "Sayur Asem & Tempe Bakar",
        caloriesKkal: 220,
        sugarGram: 3.0,
        date: "2026-10-02"
      }
    }
  },
  {
    id: "recipes-get",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Daftar Resep Tradisional Sehat",
    description: "Katalog menu masakan nusantara rendah indeks glikemik, tinggi serat, dan aman untuk pencegahan diabetes pada anak (Sayur Asem, Pepes Ikan Mas, Pecel Sayur).",
    httpMethod: "GET",
    path: "/api/recipes?category=makanan&search=asem",
    host: "http://localhost:3000",
    authRequired: "None (Public)",
    headers: [
      { name: "Content-Type", format: "application/json", mandatory: true, description: "application/json" }
    ],
    responseFields: [
      { field: "recipes", dataType: "Array of Object", description: "Daftar resep tradisional" },
      { field: "recipes[].caloriesKkal", dataType: "Number", description: "Kalori per porsi" },
      { field: "recipes[].sugarGram", dataType: "Number", description: "Gram gula per porsi" }
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/recipes?category=makanan" \\
  -H "Content-Type: application/json"`,
    responseSample: {
      recipes: [
        {
          id: "sayur-asem",
          slug: "sayur-asem",
          title: "Sayur Asem Tradisional",
          category: "makanan",
          description: "Sayur kuah asam segar kaya serat dengan labu siam, jagung manis, dan kacang panjang.",
          caloriesKkal: 85,
          carbsGram: 16.0,
          proteinGram: 3.5,
          fatGram: 1.0,
          fiberGram: 4.5,
          sugarGram: 2.5
        }
      ]
    }
  },
  {
    id: "recipes-detail",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Detail Resep Tradisional & Bahan",
    description: "Mengambil daftar lengkap takaran bahan, langkah instruksi memasak higienis, dan profil gizi per porsi hidangan tradisional.",
    httpMethod: "GET",
    path: "/api/recipes/{id}",
    host: "http://localhost:3000",
    authRequired: "None (Public)",
    headers: [
      { name: "Content-Type", format: "application/json", mandatory: true, description: "application/json" }
    ],
    responseFields: [
      { field: "recipe.ingredients", dataType: "Array of String", description: "Daftar komposisi bahan" },
      { field: "recipe.instructions", dataType: "Array of String", description: "Langkah-langkah memasak" }
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/recipes/sayur-asem" \\
  -H "Content-Type: application/json"`,
    responseSample: {
      recipe: {
        id: "sayur-asem",
        slug: "sayur-asem",
        title: "Sayur Asem Tradisional",
        caloriesKkal: 85,
        ingredients: [
          "1 buah labu siam, potong dadu",
          "1 buah jagung manis, potong melintang",
          "4 helai kacang panjang",
          "1 genggam daun melinjo segar",
          "2 buah asam jawa muda",
          "Air secukupnya"
        ],
        instructions: [
          "Didihkan air bersama asam jawa dan bumbu iris halus.",
          "Masukkan jagung manis terlebih dahulu hingga agak lunak.",
          "Tambahkan labu siam dan kacang panjang, masak dengan api sedang.",
          "Terakhir masukkan daun melinjo, matikan kompor dan sajikan hangat."
        ]
      }
    }
  },
  {
    id: "reminders-get",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Daftar Pengingat Rutinitas Sehat",
    description: "Mengambil daftar jam pengingat harian yang diatur ibu (Sarapan Sehat, Minum Air Putih, Aktivitas Fisik, Jam Tidur).",
    httpMethod: "GET",
    path: "/api/reminders?childId={childId}",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      { name: "Cookie", format: "authjs.session-token=<TOKEN>", mandatory: true, description: "Cookie sesi login ibu" }
    ],
    responseFields: [
      { field: "reminders", dataType: "Array of Object", description: "Daftar pengingat aktif dan nonaktif" }
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/reminders?childId=c10e8400-e29b-41d4-a716-446655440001" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..."`,
    responseSample: {
      reminders: [
        {
          id: "rem-1",
          type: "SARAPAN",
          title: "Sarapan Pagi Bergizi",
          time: "06:30",
          isActive: true
        },
        {
          id: "rem-2",
          type: "MINUM_AIR",
          title: "Minum Air Putih Siang",
          time: "12:00",
          isActive: true
        }
      ]
    }
  },
  {
    id: "reminders-post",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Tambah Pengingat Baru",
    description: "Menambahkan alarm pengingat kebiasaan sehat baru untuk anak.",
    httpMethod: "POST",
    path: "/api/reminders",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      { name: "Content-Type", format: "application/json", mandatory: true, description: "application/json" },
      { name: "Cookie", format: "authjs.session-token=<TOKEN>", mandatory: true, description: "Cookie sesi login ibu" }
    ],
    requestParams: [
      { field: "childId", dataType: "String (UUID)", mandatory: true, description: "ID anak" },
      { field: "type", dataType: "String", mandatory: true, description: "'SARAPAN' | 'MINUM_AIR' | 'AKTIVITAS_FISIK' | 'TIDUR' | 'LAINNYA'" },
      { field: "title", dataType: "String", mandatory: true, description: "Judul pengingat" },
      { field: "time", dataType: "String", mandatory: true, description: "Format jam 24 jam (HH:mm)" }
    ],
    responseFields: [
      { field: "reminder", dataType: "Object", description: "Objek pengingat yang tersimpan" }
    ],
    requestCurl: `curl -X POST "http://localhost:3000/api/reminders" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..." \\
  -d '{
    "childId": "c10e8400-e29b-41d4-a716-446655440001",
    "type": "AKTIVITAS_FISIK",
    "title": "Waktunya Bermain Sepeda di Taman",
    "time": "16:00"
  }'`,
    responseSample: {
      reminder: {
        id: "rem-new-1",
        childId: "c10e8400-e29b-41d4-a716-446655440001",
        type: "AKTIVITAS_FISIK",
        title: "Waktunya Bermain Sepeda di Taman",
        time: "16:00",
        isActive: true
      }
    }
  },
  {
    id: "reminders-patch",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Toggle Status Pengingat",
    description: "Mengaktifkan atau menonaktifkan saklar alarm pengingat tertentu tanpa menghapus data.",
    httpMethod: "PATCH",
    path: "/api/reminders/{id}",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      { name: "Content-Type", format: "application/json", mandatory: true, description: "application/json" },
      { name: "Cookie", format: "authjs.session-token=<TOKEN>", mandatory: true, description: "Cookie sesi login ibu" }
    ],
    requestParams: [
      { field: "isActive", dataType: "Boolean", mandatory: false, description: "Status hidup/mati saklar pengingat" },
      { field: "time", dataType: "String", mandatory: false, description: "Jam baru (HH:mm)" }
    ],
    responseFields: [
      { field: "reminder", dataType: "Object", description: "Status pengingat setelah diubah" }
    ],
    requestCurl: `curl -X PATCH "http://localhost:3000/api/reminders/rem-1" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..." \\
  -d '{
    "isActive": false
  }'`,
    responseSample: {
      reminder: {
        id: "rem-1",
        isActive: false
      }
    }
  },
  {
    id: "education-articles-get",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Pustaka Edukasi (Artikel / Makanan / Video)",
    description: "Mengambil materi edukasi pencegahan diabetes yang dikelompokkan ke dalam tab Artikel, Makanan Sehat, dan Video Tutorial.",
    httpMethod: "GET",
    path: "/api/education/articles?category=artikel",
    host: "http://localhost:3000",
    authRequired: "None (Public)",
    headers: [
      { name: "Content-Type", format: "application/json", mandatory: true, description: "application/json" }
    ],
    responseFields: [
      { field: "meta", dataType: "Object", description: "Informasi paginasi" },
      { field: "data", dataType: "Array of Object", description: "Daftar artikel materi edukasi" }
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/education/articles?category=artikel" \\
  -H "Content-Type: application/json"`,
    responseSample: {
      meta: { page: 1, limit: 10, total: 3, totalPages: 1 },
      data: [
        {
          id: "edu-1",
          slug: "apa-itu-diabetes-pada-anak",
          title: "Apa itu Diabetes pada Anak?",
          category: "artikel",
          readTimeMinutes: 3,
          summary: "Mengenal tanda-tanda awal dan perbedaan diabetes tipe 1 serta tipe 2 pada usia sekolah."
        }
      ]
    }
  },
  {
    id: "education-articles-detail",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Detail Materi Edukasi & Video",
    description: "Mengambil konten teks lengkap artikel edukasi atau tautan video tutorial pencegahan diabetes berdasarkan ID atau slug.",
    httpMethod: "GET",
    path: "/api/education/articles/{id}",
    host: "http://localhost:3000",
    authRequired: "None (Public)",
    headers: [
      { name: "Content-Type", format: "application/json", mandatory: true, description: "application/json" }
    ],
    responseFields: [
      { field: "article.title", dataType: "String", description: "Judul artikel" },
      { field: "article.content", dataType: "String (Markdown)", description: "Isi teks materi edukasi" },
      { field: "article.videoUrl", dataType: "String (URL)", description: "Tautan video jika bertipe video" }
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/education/articles/apa-itu-diabetes-pada-anak" \\
  -H "Content-Type: application/json"`,
    responseSample: {
      article: {
        id: "edu-1",
        slug: "apa-itu-diabetes-pada-anak",
        title: "Apa itu Diabetes pada Anak?",
        category: "artikel",
        content: "Diabetes pada anak dapat berupa tipe 1 (autoimun) atau tipe 2 yang dipicu oleh pola makan tinggi gula...",
        readTimeMinutes: 3
      }
    }
  },
  {
    id: "consultations-specialists",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Direktori Tenaga Medis Mitra",
    description: "Mengambil daftar tenaga medis profesional mitra platform (Bidan, Ahli Gizi / Dietisien, Dokter Spesialis Anak) beserta pengalaman dan rating.",
    httpMethod: "GET",
    path: "/api/consultations/specialists?type=AHLI_GIZI",
    host: "http://localhost:3000",
    authRequired: "None (Public)",
    headers: [
      { name: "Content-Type", format: "application/json", mandatory: true, description: "application/json" }
    ],
    responseFields: [
      { field: "specialists", dataType: "Array of Object", description: "Profil tenaga medis profesional" }
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/consultations/specialists" \\
  -H "Content-Type: application/json"`,
    responseSample: {
      specialists: [
        {
          id: "spec-gizi-1",
          name: "Nurul Aini, S.Gz, RD",
          title: "Nutrisionis Pediatrik Klinis",
          type: "AHLI_GIZI",
          rating: 4.95,
          experienceYears: 6,
          available: true
        }
      ]
    }
  },
  {
    id: "consultations-get",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Riwayat Sesi Konsultasi Ibu",
    description: "Mengambil daftar tiket konsultasi medis yang telah diajukan ibu beserta statusnya (ACTIVE, PENDING, COMPLETED).",
    httpMethod: "GET",
    path: "/api/consultations",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      { name: "Cookie", format: "authjs.session-token=<TOKEN>", mandatory: true, description: "Cookie sesi login ibu" }
    ],
    responseFields: [
      { field: "consultations", dataType: "Array of Object", description: "Daftar tiket telekonsultasi" }
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/consultations" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..."`,
    responseSample: {
      consultations: [
        {
          id: "cons-1",
          specialistType: "AHLI_GIZI",
          specialistName: "Nurul Aini, S.Gz, RD",
          topic: "Konsultasi Diet Gula Balita",
          status: "ACTIVE",
          createdAt: "2026-10-02T00:10:00.000Z"
        }
      ]
    }
  },
  {
    id: "consultations-post",
    category: "PARENT",
    categoryTitle: "ROLE: PARENT / GUARDIAN",
    title: "Ajukan Sesi Telekonsultasi Tenaga Medis",
    description: "Membuat pengajuan sesi konsultasi daring baru dengan Bidan, Ahli Gizi, atau Dokter Spesialis Anak.",
    httpMethod: "POST",
    path: "/api/consultations",
    host: "http://localhost:3000",
    authRequired: "Guardian Session",
    headers: [
      { name: "Content-Type", format: "application/json", mandatory: true, description: "application/json" },
      { name: "Cookie", format: "authjs.session-token=<TOKEN>", mandatory: true, description: "Cookie sesi login ibu" }
    ],
    requestParams: [
      { field: "specialistType", dataType: "String", mandatory: true, description: "'BIDAN' | 'AHLI_GIZI' | 'DOKTER'" },
      { field: "specialistName", dataType: "String", mandatory: true, description: "Nama profesional yang dipilih" },
      { field: "topic", dataType: "String", mandatory: true, description: "Keluhan atau topik konsultasi" },
      { field: "notes", dataType: "String", mandatory: false, description: "Catatan riwayat kondisi anak" }
    ],
    responseFields: [
      { field: "consultation", dataType: "Object", description: "Sesi konsultasi yang berhasil dibuat" }
    ],
    requestCurl: `curl -X POST "http://localhost:3000/api/consultations" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: authjs.session-token=eyJhbGciOi..." \\
  -d '{
    "specialistType": "AHLI_GIZI",
    "specialistName": "Nurul Aini, S.Gz, RD",
    "topic": "Konsultasi Penurunan Porsi Gula Balita",
    "notes": "Anak terbiasa minum teh manis kemasan 3 kotak per hari"
  }'`,
    responseSample: {
      consultation: {
        id: "cons-new-1",
        specialistType: "AHLI_GIZI",
        specialistName: "Nurul Aini, S.Gz, RD",
        topic: "Konsultasi Penurunan Porsi Gula Balita",
        status: "ACTIVE",
        createdAt: "2026-10-02T00:15:00.000Z"
      }
    }
  },

    // ==========================================
  // ROLE: ADMINISTRATOR (WAJIB LOGIN)
  // ==========================================
  {
    id: "admin-metrics",
    category: "ADMIN",
    categoryTitle: "ROLE: ADMINISTRATOR (WAJIB LOGIN)",
    title: "Ringkasan Metrik & Analitik Platform",
    description:
      "Mengambil statistik agregasi seluruh sistem: total pengguna, total anak, agregat konsumsi air & durasi olahraga, sebaran kategori makanan (balanced, sweet, fried), sesi chat AI, dan log aktivitas terkini.",
    httpMethod: "GET",
    path: "/api/admin/metrics",
    host: "http://localhost:3000",
    authRequired: "Admin Login (Role: ADMIN)",
    infoBox: {
      type: "warning",
      title: "Hak Akses Administrator Wajib",
      text: "Endpoint ini dilindungi oleh otentikasi sesi ganda: Sesi harus terdaftar DAN memiliki atribut role == 'ADMIN'. Mengembalikan HTTP 401 jika belum login, dan HTTP 403 Forbidden jika akun bertipe GUARDIAN biasa.",
    },
    headers: [
      {
        name: "Cookie",
        format: "authjs.session-token=<ADMIN_TOKEN>",
        mandatory: true,
        description: "Cookie sesi user dengan role ADMIN.",
      },
    ],
    responseFields: [
      {
        field: "metrics.totalGuardians",
        dataType: "Integer",
        description: "Total jumlah akun orang tua terdaftar.",
      },
      {
        field: "metrics.totalChildren",
        dataType: "Integer",
        description: "Total jumlah profil anak di platform.",
      },
      {
        field: "metrics.foodToneDistribution",
        dataType: "Object",
        description: "Sebaran jumlah log makanan: balanced, sweet, fried, unknown.",
      },
      {
        field: "recentActivity",
        dataType: "Array of Object",
        description: "10 catatan aktivitas dan progres harian terbaru pengguna.",
      },
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/admin/metrics" \\
  -H "Cookie: authjs.session-token=<ADMIN_SESSION_TOKEN>"`,
    responseSample: {
      metrics: {
        totalGuardians: 12,
        totalChildren: 15,
        totalWaterGlasses: 120,
        totalActivityMinutes: 450,
        totalXpEarned: 1200,
        averageWaterGlasses: 6.2,
        averageActivityMinutes: 28.5,
        averageStreak: 3.4,
        totalChatSessions: 34,
        totalChatMessages: 112,
        foodToneDistribution: {
          balanced: 45,
          sweet: 12,
          fried: 8,
          unknown: 2,
        },
      },
      recentActivity: [
        {
          id: "p1a2-rec",
          childName: "Budi",
          date: "2026-10-01",
          waterGlasses: 6,
          activityMinutes: 30,
          xp: 50,
          streak: 3,
        },
      ],
      system: {
        aiModel: "gpt-4o-mini",
        databaseStatus: "connected",
        timestamp: "2026-10-01T23:50:00.000Z",
      },
    },
    errorSample: {
      status: 403,
      body: {
        error: {
          message: "Akses ditolak. Halaman ini khusus untuk Administrator.",
        },
      },
    },
  },
  {
    id: "admin-export",
    category: "ADMIN",
    categoryTitle: "ROLE: ADMINISTRATOR (WAJIB LOGIN)",
    title: "Ekspor Dataset Riset Anonim (CSV / JSON)",
    description:
      "Mengunduh dataset perilaku hidup sehat anak yang telah dianonimkan (Participant ID terenkripsi SHA-256, misal P-001-XXXX) untuk analisis riset akademis.",
    httpMethod: "GET",
    path: "/api/admin/export",
    host: "http://localhost:3000",
    authRequired: "Admin Login (Role: ADMIN)",
    infoBox: {
      type: "warning",
      title: "Kepatuhan Privasi Data Riset",
      text: "Seluruh nama anak dan data sensitif dianonimkan otomatis menggunakan hash kriptografis SHA-256 satu arah sebelum diunduh.",
    },
    headers: [
      {
        name: "Cookie",
        format: "authjs.session-token=<ADMIN_TOKEN>",
        mandatory: true,
        description: "Cookie sesi role ADMIN.",
      },
    ],
    requestParams: [
      {
        field: "format",
        dataType: "String ('csv' | 'json')",
        mandatory: false,
        description: "Format unduhan file attachment (default: 'csv').",
      },
    ],
    responseFields: [
      {
        field: "participant_id",
        dataType: "String",
        description: "Identifier anonim partisipan (contoh: 'P-001-A7B2').",
      },
      {
        field: "record_date",
        dataType: "String (YYYY-MM-DD)",
        description: "Tanggal data observasi.",
      },
      {
        field: "water_glasses",
        dataType: "Integer",
        description: "Jumlah gelas air.",
      },
      {
        field: "balanced_food_count",
        dataType: "Integer",
        description: "Jumlah asupan makanan bernutrisi seimbang.",
      },
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/admin/export?format=json" \\
  -H "Cookie: authjs.session-token=<ADMIN_SESSION_TOKEN>"`,
    responseSample: [
      {
        participant_id: "P-001-A7B2",
        record_date: "2026-10-01",
        water_glasses: 6,
        activity_minutes: 30,
        xp_earned: 50,
        active_streak: 3,
        balanced_food_count: 2,
        sweet_food_count: 1,
        fried_food_count: 0,
        unknown_food_count: 0,
        lifetime_chat_messages: 8,
      },
    ],
    errorSample: {
      status: 403,
      body: {
        error: {
          message: "Akses ditolak. Halaman ini khusus untuk Administrator.",
        },
      },
    },
  },
  {
    id: "admin-content-get",
    category: "ADMIN",
    categoryTitle: "ROLE: ADMINISTRATOR (WAJIB LOGIN)",
    title: "Daftar Konten Edukasi CMS",
    description:
      "Mengambil seluruh item tantangan, kuis gizi (dengan options ter-parse), dan menu rekomendasi aktif maupun nonaktif untuk dashboard pengelola.",
    httpMethod: "GET",
    path: "/api/admin/content",
    host: "http://localhost:3000",
    authRequired: "Admin Login (Role: ADMIN)",
    headers: [
      {
        name: "Cookie",
        format: "authjs.session-token=<ADMIN_TOKEN>",
        mandatory: true,
        description: "Cookie sesi role ADMIN.",
      },
    ],
    responseFields: [
      {
        field: "challenges",
        dataType: "Array of Object",
        description: "Daftar semua tantangan harian di database.",
      },
      {
        field: "quizzes",
        dataType: "Array of Object",
        description: "Daftar semua kuis dengan array pilihan jawaban yang sudah diparsing.",
      },
      {
        field: "menus",
        dataType: "Array of Object",
        description: "Daftar menu rekomendasi makanan bergizi.",
      },
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/admin/content" \\
  -H "Cookie: authjs.session-token=<ADMIN_SESSION_TOKEN>"`,
    responseSample: {
      challenges: [
        {
          id: "c1-uuid",
          title: "Misi Warna Piring",
          description: "Makan satu buah atau sayur hari ini.",
          xp: 30,
          isActive: true,
        },
      ],
      quizzes: [
        {
          id: "q1-uuid",
          question: "Minuman apa yang paling baik diminum setiap hari?",
          options: ["Air Putih", "Minuman Bersoda", "Sirup"],
          answer: "Air Putih",
          xp: 20,
          isActive: true,
        },
      ],
      menus: [
        {
          id: "m1-uuid",
          title: "Sarapan Ceria",
          note: "Nasi, telur dadar sayur, buah pepaya.",
          orderIndex: 1,
        },
      ],
    },
  },
  {
    id: "admin-content-post",
    category: "ADMIN",
    categoryTitle: "ROLE: ADMINISTRATOR (WAJIB LOGIN)",
    title: "Buat / Toggle Status Konten CMS",
    description:
      "Membuat tantangan baru, kuis baru, menu rekomendasi baru, atau mengubah status aktif tantangan/kuis (menonaktifkan item lainnya jika ada yang diaktifkan).",
    httpMethod: "POST",
    path: "/api/admin/content",
    host: "http://localhost:3000",
    authRequired: "Admin Login (Role: ADMIN)",
    headers: [
      {
        name: "Content-Type",
        format: "application/json",
        mandatory: true,
        description: "application/json",
      },
      {
        name: "Cookie",
        format: "authjs.session-token=<ADMIN_TOKEN>",
        mandatory: true,
        description: "Cookie sesi role ADMIN.",
      },
    ],
    requestParams: [
      {
        field: "type",
        dataType: "String",
        mandatory: true,
        description: "Tipe aksi: 'challenge' | 'quiz' | 'menu' | 'toggle'.",
      },
      {
        field: "title / question",
        dataType: "String",
        mandatory: true,
        description: "Judul tantangan / menu, atau teks pertanyaan kuis.",
      },
      {
        field: "options",
        dataType: "Array of String",
        mandatory: false,
        description: "Pilihan opsi jika type=='quiz' (2-5 opsi).",
      },
      {
        field: "answer",
        dataType: "String",
        mandatory: false,
        description: "Kunci jawaban benar jika type=='quiz'.",
      },
    ],
    responseFields: [
      {
        field: "success",
        dataType: "Boolean",
        description: "Status sukses pembuatan atau update konten (true).",
      },
    ],
    requestCurl: `curl -X POST "http://localhost:3000/api/admin/content" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: authjs.session-token=<ADMIN_SESSION_TOKEN>" \\
  -d '{
    "type": "challenge",
    "title": "Misi Langkah Ceria",
    "description": "Jalan santai atau bermain bola selama 20 menit sore ini.",
    "xp": 25,
    "isActive": false
  }'`,
    responseSample: {
      success: true,
      item: {
        id: "c2-uuid",
        title: "Misi Langkah Ceria",
        description: "Jalan santai atau bermain bola selama 20 menit sore ini.",
        xp: 25,
        isActive: false,
      },
    },
  },
  {
    id: "admin-bot-config-get",
    category: "ADMIN",
    categoryTitle: "ROLE: ADMINISTRATOR (WAJIB LOGIN)",
    title: "Konfigurasi Model Bot AI",
    description:
      "Mengambil parameter operasional model bot AI yang aktif (provider, model name, base URL, API key yang disamarkan, system prompt, temperature, max tokens).",
    httpMethod: "GET",
    path: "/api/admin/bot-config",
    host: "http://localhost:3000",
    authRequired: "Admin Login (Role: ADMIN)",
    headers: [
      {
        name: "Cookie",
        format: "authjs.session-token=<ADMIN_TOKEN>",
        mandatory: true,
        description: "Cookie sesi role ADMIN.",
      },
    ],
    responseFields: [
      {
        field: "config.model",
        dataType: "String",
        description: "Model AI yang digunakan (misal: 'gpt-4o-mini').",
      },
      {
        field: "config.maskedApiKey",
        dataType: "String",
        description: "Kunci API yang disamarkan demi keamanan (misal: 'sk-proj-••••••••4aBc').",
      },
      {
        field: "config.systemPrompt",
        dataType: "String",
        description: "Instruksi sistem persona asisten Si Cehat.",
      },
      {
        field: "config.temperature",
        dataType: "Float",
        description: "Parameter keacakan respon (0.0 - 2.0).",
      },
    ],
    requestCurl: `curl -X GET "http://localhost:3000/api/admin/bot-config" \\
  -H "Cookie: authjs.session-token=<ADMIN_SESSION_TOKEN>"`,
    responseSample: {
      config: {
        provider: "openai",
        model: "gpt-4o-mini",
        baseUrl: "https://api.openai.com/v1",
        maskedApiKey: "sk-proj-••••••••4aBc",
        isApiKeySet: true,
        systemPrompt: "Kamu adalah Si Cehat, asisten edukasi kesehatan untuk anak...",
        temperature: 0.5,
        maxTokens: 300,
        isDbOverride: true,
      },
    },
  },
  {
    id: "admin-bot-config-put",
    category: "ADMIN",
    categoryTitle: "ROLE: ADMINISTRATOR (WAJIB LOGIN)",
    title: "Perbarui Konfigurasi Model Bot AI",
    description:
      "Memperbarui parameter model AI, system prompt, atau API key secara real-time di database tanpa merestart server aplikasi.",
    httpMethod: "PUT",
    path: "/api/admin/bot-config",
    host: "http://localhost:3000",
    authRequired: "Admin Login (Role: ADMIN)",
    headers: [
      {
        name: "Content-Type",
        format: "application/json",
        mandatory: true,
        description: "application/json",
      },
      {
        name: "Cookie",
        format: "authjs.session-token=<ADMIN_TOKEN>",
        mandatory: true,
        description: "Cookie sesi role ADMIN.",
      },
    ],
    requestParams: [
      {
        field: "model",
        dataType: "String",
        mandatory: true,
        description: "Nama model OpenAI (default: 'gpt-4o-mini').",
      },
      {
        field: "systemPrompt",
        dataType: "String",
        mandatory: true,
        description: "Prompt persona sistem (minimal 10 karakter).",
      },
      {
        field: "apiKey",
        dataType: "String",
        mandatory: false,
        description: "Kunci API baru. Jika dikosongkan, tetap memakai kunci aktif saat ini.",
      },
      {
        field: "temperature",
        dataType: "Float",
        mandatory: false,
        description: "Nilai temperature 0.0 - 2.0.",
      },
    ],
    responseFields: [
      {
        field: "success",
        dataType: "Boolean",
        description: "Status sukses pembaruan (true).",
      },
      {
        field: "config",
        dataType: "Object",
        description: "Data konfigurasi baru yang telah disimpan.",
      },
    ],
    requestCurl: `curl -X PUT "http://localhost:3000/api/admin/bot-config" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: authjs.session-token=<ADMIN_SESSION_TOKEN>" \\
  -d '{
    "provider": "openai",
    "model": "gpt-4o-mini",
    "systemPrompt": "Kamu adalah Si Cehat, asisten edukasi kesehatan ramah untuk anak.",
    "temperature": 0.5,
    "maxTokens": 300
  }'`,
    responseSample: {
      success: true,
      config: {
        provider: "openai",
        model: "gpt-4o-mini",
        baseUrl: "https://api.openai.com/v1",
        maskedApiKey: "sk-proj-••••••••4aBc",
        isApiKeySet: true,
        systemPrompt: "Kamu adalah Si Cehat, asisten edukasi kesehatan ramah untuk anak.",
        temperature: 0.5,
        maxTokens: 300,
        isDbOverride: true,
      },
    },
  },
  {
    id: "admin-bot-config-test",
    category: "ADMIN",
    categoryTitle: "ROLE: ADMINISTRATOR (WAJIB LOGIN)",
    title: "Uji Konektivitas & Respon Bot AI",
    description:
      "Melakukan uji coba pemanggilan inferensi AI langsung ke upstream endpoint untuk memverifikasi keabsahan API key dan mengukur latensi round-trip (milidetik).",
    httpMethod: "POST",
    path: "/api/admin/bot-config/test",
    host: "http://localhost:3000",
    authRequired: "Admin Login (Role: ADMIN)",
    headers: [
      {
        name: "Content-Type",
        format: "application/json",
        mandatory: true,
        description: "application/json",
      },
      {
        name: "Cookie",
        format: "authjs.session-token=<ADMIN_TOKEN>",
        mandatory: true,
        description: "Cookie sesi role ADMIN.",
      },
    ],
    requestParams: [
      {
        field: "testPrompt",
        dataType: "String",
        mandatory: false,
        description: "Pertanyaan tes untuk model AI.",
      },
      {
        field: "temperature",
        dataType: "Float",
        mandatory: false,
        description: "Temperature override untuk pengujian.",
      },
    ],
    responseFields: [
      {
        field: "success",
        dataType: "Boolean",
        description: "Status sukses koneksi.",
      },
      {
        field: "latencyMs",
        dataType: "Integer",
        description: "Waktu respon jaringan dalam milidetik.",
      },
      {
        field: "reply",
        dataType: "String",
        description: "Jawaban langsung dari model AI.",
      },
    ],
    requestCurl: `curl -X POST "http://localhost:3000/api/admin/bot-config/test" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: authjs.session-token=<ADMIN_SESSION_TOKEN>" \\
  -d '{
    "testPrompt": "Kenapa kita harus membatasi minum minuman yang manis?"
  }'`,
    responseSample: {
      success: true,
      isMock: false,
      latencyMs: 382,
      model: "gpt-4o-mini",
      reply:
        "Minuman manis mengandung banyak gula sederhana yang membuat kadar gula cepat melonjak lalu anjlok, sehingga kita mudah lelah dan mengantuk!",
    },
  },
];

export default function BcaStyleApiDocsPage() {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(BCA_ENDPOINTS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [requestFormat, setRequestFormat] = useState<"curl" | "fetch" | "python">("curl");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const getImplementationSnippet = (ep: BcaStyleEndpoint, format: "curl" | "fetch" | "python"): string => {
    if (format === "curl") {
      return ep.requestCurl;
    }

    if (format === "fetch") {
      const curlMatch = ep.requestCurl.match(/-d '([\s\S]*?)'/);
      const bodyStr = curlMatch ? curlMatch[1].trim() : null;

      let headersCode = "";
      if (ep.headers.length > 0) {
        headersCode = "    headers: {\n";
        ep.headers.forEach((h) => {
          headersCode += `      "${h.name}": "${h.format.replace(/<ADMIN_TOKEN>|<TOKEN>/g, "SESSION_TOKEN")}",\n`;
        });
        headersCode += "    },\n";
      }

      let bodyCode = "";
      if (bodyStr) {
        bodyCode = `    body: JSON.stringify(${bodyStr.replace(/\n/g, "\n    ")}),\n`;
      }

      return `// JavaScript / TypeScript (fetch)
async function sendRequest() {
  const response = await fetch("${ep.path}", {
    method: "${ep.httpMethod}",
${headersCode}${bodyCode}  });

  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }

  const data = await response.json();
  console.log("Success:", data);
  return data;
}

sendRequest();`;
    }

    if (format === "python") {
      const curlMatch = ep.requestCurl.match(/-d '([\s\S]*?)'/);
      const bodyStr = curlMatch ? curlMatch[1].trim() : null;

      let pyHeaders = "headers = {\n";
      ep.headers.forEach((h) => {
        pyHeaders += `    "${h.name}": "${h.format.replace(/<ADMIN_TOKEN>|<TOKEN>/g, "SESSION_TOKEN")}",\n`;
      });
      pyHeaders += "}\n";

      let pyPayload = "";
      if (bodyStr) {
        const pythonized = bodyStr.replace(/true/g, "True").replace(/false/g, "False");
        pyPayload = `payload = ${pythonized}\n\n`;
      }

      const jsonArg = bodyStr ? ", json=payload" : "";
      const methodLower = ep.httpMethod.toLowerCase();

      return `# Python (requests)
import requests

url = "http://localhost:3000${ep.path}"
${pyHeaders}
${pyPayload}response = requests.${methodLower}(url, headers=headers${jsonArg})
print(response.status_code)
print(response.json())`;
    }

    return ep.requestCurl;
  };

  const filteredEndpoints = useMemo(() => {
    if (!searchQuery.trim()) return BCA_ENDPOINTS;
    const q = searchQuery.toLowerCase();
    return BCA_ENDPOINTS.filter(
      (ep) =>
        ep.title.toLowerCase().includes(q) ||
        ep.path.toLowerCase().includes(q) ||
        ep.categoryTitle.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeEndpoint = useMemo(() => {
    return BCA_ENDPOINTS.find((ep) => ep.id === selectedEndpointId) || BCA_ENDPOINTS[0];
  }, [selectedEndpointId]);

  return (
    <div className="min-h-screen bg-[#F5F9FA] text-[#212529] font-sans antialiased flex flex-col">
      {/* Top Navbar in authentic BCA Developer Portal Theme */}
      <header className="sticky top-0 z-50 w-full h-[76px] bg-white border-b border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.06)] flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-3 group">
            {/* Authentic Corporate Vector Brandmark */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#005CAA] to-[#003870] flex items-center justify-center shadow-sm group-hover:scale-102 transition-transform">
              <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Shield Outline */}
                <path
                  d="M16 3L6 7.5V15.5C6 22.8 10.3 27.5 16 29C21.7 27.5 26 22.8 26 15.5V7.5L16 3Z"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* Organic Sprout & Health Pulse */}
                <path
                  d="M16 9C13 12 11.5 15.2 12.5 18.5C13.2 21 15.5 22.8 16 23.2C16.5 22.8 18.8 21 19.5 18.5C20.5 15.2 19 12 16 9Z"
                  fill="#22C55E"
                />
                <circle cx="16" cy="16" r="2" fill="#FFFFFF" />
              </svg>
            </div>

            {/* Corporate Logotype with Subtitle */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-[#005CAA] text-xl tracking-tight">Si-Cehat</span>
                <span className="font-light text-[#005CAA] text-xl tracking-tight">Developer</span>
              </div>
              <span className="text-[10px] text-[#868E96] font-semibold tracking-wider uppercase mt-1">
                Open API Platform & Sandbox
              </span>
            </div>
          </Link>

        </div>

        {/* Corporate Top Navigation */}
        <nav className="flex items-center space-x-5 text-xs font-semibold">
          <Link
            href="/"
            className="text-[#495057] hover:text-[#005CAA] transition-colors hidden md:inline-block"
          >
            Beranda
          </Link>
          <span className="text-[#005CAA] font-bold border-b-2 border-[#005CAA] pb-1 hidden md:inline-block">
            Dokumentasi API
          </span>
          <Link
            href="/parent/login"
            className="text-[#495057] hover:text-[#005CAA] transition-colors hidden sm:inline-block"
          >
            Area Orang Tua
          </Link>

          {/* BCA Language Switcher Pill */}
          <div className="flex items-center bg-[#F3F4F6] p-0.5 rounded-full border border-[#E5E7EB] text-[11px]">
            <span className="px-2.5 py-0.5 rounded-full bg-white text-[#005CAA] font-bold shadow-xs">
              ID
            </span>
            <span className="px-2.5 py-0.5 text-gray-400 font-medium">
              EN
            </span>
          </div>

          <div className="h-5 w-px bg-[#E2E8F0] hidden sm:block" />

          {/* BCA Signature Blue Portal Button */}
          <Link
            href="/admin/login"
            className="px-5 py-2 rounded-full bg-[#005CAA] hover:bg-[#004785] text-white font-bold transition-all shadow-xs flex items-center gap-1.5 text-xs tracking-wide"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Portal Admin</span>
          </Link>
        </nav>
      </header>

      {/* Main Container: Left Sticky Dark Sidebar + Content Columns */}
      <main className="flex-1 flex w-full">
        {/* ========================================================= */}
        {/* LEFT SIDEBAR: BCA Developer Charcoal Navigation (#212529) */}
        {/* ========================================================= */}
        <section
          id="navigation-sidebar-container"
          className="hidden lg:flex flex-col bg-[#212529] sticky top-[76px] left-0 w-80 h-[calc(100vh-76px)] shrink-0 z-40 border-r border-[#343a40]"
        >
          {/* Search Box */}
          <div className="p-4 border-b border-[#343A40]">
            <div className="relative">
              <input
                id="searchDoc"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari dokumentasi API..."
                className="w-full pl-9 pr-4 py-2 rounded-[12px] bg-white text-[#212529] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#005CAA]"
              />
              <svg
                className="w-4 h-4 text-[#868E96] absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2 text-xs text-[#868E96] hover:text-black font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tree */}
          <div className="flex-1 overflow-y-auto pb-8 scrollbar-thin scrollbar-thumb-gray-600">
            {["ANAK", "PARENT", "ADMIN"].map((catKey) => {
              const items = filteredEndpoints.filter((ep) => ep.category === catKey);
              if (items.length === 0) return null;

              const sectionLabels: Record<string, string> = {
                ANAK: "ROLE: ANAK / EDUKASI",
                PARENT: "ROLE: PARENT / GUARDIAN",
                ADMIN: "ROLE: ADMINISTRATOR (WAJIB LOGIN)",
              };

              return (
                <div key={catKey} className="mt-5">
                  <div className="px-5 mb-2">
                    <p className="uppercase text-white/50 font-bold text-[11px] tracking-wider">
                      {sectionLabels[catKey]}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    {items.map((ep) => {
                      const isActive = selectedEndpointId === ep.id;
                      return (
                        <button
                          key={ep.id}
                          onClick={() => setSelectedEndpointId(ep.id)}
                          className={`w-full text-left px-5 py-2.5 text-xs transition-colors flex items-center justify-between group border-l-3 ${
                            isActive
                              ? "bg-[#005CAA]/25 text-[#58a6ff] border-[#005CAA] font-bold"
                              : "text-white/80 hover:bg-[#2c3238] hover:text-white border-transparent"
                          }`}
                        >
                          <span className="truncate pr-2">{ep.title}</span>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              ep.httpMethod === "GET"
                                ? "bg-emerald-900/60 text-emerald-300"
                                : ep.httpMethod === "POST"
                                ? "bg-blue-900/60 text-blue-300"
                                : ep.httpMethod === "PUT"
                                ? "bg-amber-900/60 text-amber-300"
                                : ep.httpMethod === "PATCH"
                                ? "bg-purple-900/60 text-purple-300"
                                : "bg-rose-900/60 text-rose-300"
                            }`}
                          >
                            {ep.httpMethod}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="w-full h-[0.5px] bg-[#343a40] mt-3" />
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* CENTER & RIGHT CONTENT: BCA Developer 60/40 Split Layout  */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col lg:flex-row px-4 lg:px-10 py-8 gap-8 min-w-0">
          {/* Left Column: 60% Width Documentation Specifications */}
          <div className="w-full lg:w-3/5 space-y-6">
            {/* Category tag */}
            <div>
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#005CAA]">
                {activeEndpoint.categoryTitle}
              </span>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#212529] mt-1 tracking-tight">
                {activeEndpoint.title}
              </h1>
              <p className="text-xs text-[#6c757d] mt-1 font-mono">
                Endpoint: <span className="font-bold text-[#212529]">{activeEndpoint.path}</span>
              </p>
            </div>

            {/* Description Prose */}
            <p className="text-sm text-[#495057] leading-relaxed">
              {activeEndpoint.description}
            </p>

            {/* BCA Callout Information Box */}
            {activeEndpoint.infoBox && (
              <div
                className={`p-4 rounded-xl text-xs leading-relaxed border ${
                  activeEndpoint.infoBox.type === "warning"
                    ? "bg-[#FFF5F5] border-[#FFA8A8] text-[#C92A2A]"
                    : "bg-[#E7F5FF] border-[#A5D8FF] text-[#1864AB]"
                }`}
              >
                {activeEndpoint.infoBox.title && (
                  <p className="font-bold mb-1">{activeEndpoint.infoBox.title}</p>
                )}
                <p>{activeEndpoint.infoBox.text}</p>
              </div>
            )}

            {/* Section: Request Setting */}
            <div className="space-y-2 pt-2">
              <h2 className="text-base font-bold text-[#212529]">Request Setting</h2>
              <div className="overflow-x-auto bg-white rounded-lg border border-[#DEE2E6]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8F9FA] text-[#495057] font-bold border-b border-[#DEE2E6]">
                    <tr>
                      <th className="py-2.5 px-4 w-1/3">Setting</th>
                      <th className="py-2.5 px-4">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9ECEF] font-mono text-[12px]">
                    <tr>
                      <td className="py-2 px-4 text-[#495057] font-sans">HTTP Method</td>
                      <td className="py-2 px-4 font-bold text-[#005CAA]">{activeEndpoint.httpMethod}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-[#495057] font-sans">Path</td>
                      <td className="py-2 px-4 text-[#212529]">{activeEndpoint.path}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-[#495057] font-sans">Host</td>
                      <td className="py-2 px-4 text-[#212529]">{activeEndpoint.host}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-[#495057] font-sans">Otentikasi / Role</td>
                      <td className="py-2 px-4 font-sans font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            activeEndpoint.authRequired.includes("Admin")
                              ? "bg-rose-100 text-rose-800"
                              : activeEndpoint.authRequired.includes("Guardian")
                              ? "bg-purple-100 text-purple-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {activeEndpoint.authRequired}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section: Request Headers */}
            <div className="space-y-2 pt-2">
              <h2 className="text-base font-bold text-[#212529]">Request Headers</h2>
              <div className="overflow-x-auto bg-white rounded-lg border border-[#DEE2E6]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8F9FA] text-[#495057] font-bold border-b border-[#DEE2E6]">
                    <tr>
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">Format</th>
                      <th className="py-2.5 px-4">Mandatory</th>
                      <th className="py-2.5 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9ECEF]">
                    {activeEndpoint.headers.map((h) => (
                      <tr key={h.name} className="font-mono text-[12px]">
                        <td className="py-2 px-4 font-bold text-[#212529]">{h.name}</td>
                        <td className="py-2 px-4 text-[#005CAA]">{h.format}</td>
                        <td className="py-2 px-4 font-sans text-xs">
                          {h.mandatory ? (
                            <span className="font-bold text-rose-600">Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="py-2 px-4 font-sans text-xs text-[#495057]">{h.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section: Request Body / Parameters */}
            {activeEndpoint.requestParams && activeEndpoint.requestParams.length > 0 && (
              <div className="space-y-2 pt-2">
                <h2 className="text-base font-bold text-[#212529]">Request Body / Parameters</h2>
                <div className="overflow-x-auto bg-white rounded-lg border border-[#DEE2E6]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F8F9FA] text-[#495057] font-bold border-b border-[#DEE2E6]">
                      <tr>
                        <th className="py-2.5 px-4">Field</th>
                        <th className="py-2.5 px-4">Data Type</th>
                        <th className="py-2.5 px-4">Mandatory</th>
                        <th className="py-2.5 px-4">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9ECEF]">
                      {activeEndpoint.requestParams.map((p) => (
                        <tr key={p.field} className="font-mono text-[12px]">
                          <td className="py-2 px-4 font-bold text-[#212529]">{p.field}</td>
                          <td className="py-2 px-4 text-[#005CAA]">{p.dataType}</td>
                          <td className="py-2 px-4 font-sans text-xs">
                            {p.mandatory ? (
                              <span className="font-bold text-rose-600">Yes</span>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </td>
                          <td className="py-2 px-4 font-sans text-xs text-[#495057]">{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section: Response Specification */}
            <div className="space-y-2 pt-2">
              <h2 className="text-base font-bold text-[#212529]">Response Fields</h2>
              <div className="overflow-x-auto bg-white rounded-lg border border-[#DEE2E6]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8F9FA] text-[#495057] font-bold border-b border-[#DEE2E6]">
                    <tr>
                      <th className="py-2.5 px-4">Field</th>
                      <th className="py-2.5 px-4">Data Type</th>
                      <th className="py-2.5 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9ECEF]">
                    {activeEndpoint.responseFields.map((rf) => (
                      <tr key={rf.field} className="font-mono text-[12px]">
                        <td className="py-2 px-4 font-bold text-[#212529]">{rf.field}</td>
                        <td className="py-2 px-4 text-[#005CAA]">{rf.dataType}</td>
                        <td className="py-2 px-4 font-sans text-xs text-[#495057]">{rf.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: 40% Width BCA Developer Style Code Cards (Sticky) */}
          <div className="w-full lg:w-2/5 space-y-6 lg:sticky lg:top-[90px] self-start">
            {/* BCA Developer Style Request Card */}
            <div className="rounded-xl overflow-hidden shadow-sm border border-[#00335E]">
              {/* Blue Header Banner */}
              <div className="bg-[#144E83] text-white px-4 py-2 font-bold text-xs uppercase tracking-wider">
                EXAMPLE
              </div>
              <div className="bg-[#00335E] p-3 flex flex-col space-y-2">
                {/* Format switcher tabs & copy button */}
                <div className="bg-[#0094D5] px-3 py-1.5 rounded-md flex items-center justify-between text-xs text-white font-semibold">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setRequestFormat("curl")}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        requestFormat === "curl"
                          ? "bg-[#00335E] text-white font-bold"
                          : "hover:bg-[#0080bc] text-white/80"
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setRequestFormat("fetch")}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        requestFormat === "fetch"
                          ? "bg-[#00335E] text-white font-bold"
                          : "hover:bg-[#0080bc] text-white/80"
                      }`}
                    >
                      JS (fetch)
                    </button>
                    <button
                      onClick={() => setRequestFormat("python")}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        requestFormat === "python"
                          ? "bg-[#00335E] text-white font-bold"
                          : "hover:bg-[#0080bc] text-white/80"
                      }`}
                    >
                      Python
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      const snippet = getImplementationSnippet(activeEndpoint, requestFormat);
                      copyToClipboard(snippet, `req-${activeEndpoint.id}-${requestFormat}`);
                    }}
                    className="hover:opacity-80 transition-opacity flex items-center gap-1 font-mono text-[11px]"
                    title="Copy Implementation Snippet"
                  >
                    {copiedKey === `req-${activeEndpoint.id}-${requestFormat}` ? (
                      <span className="text-amber-300 font-bold">✓ Copied</span>
                    ) : (
                      <span className="underline">Copy</span>
                    )}
                  </button>
                </div>
                {/* Code body */}
                <pre className="p-3 text-white font-mono text-xs overflow-x-auto max-h-[320px] leading-relaxed whitespace-pre select-all">
                  <code>{getImplementationSnippet(activeEndpoint, requestFormat)}</code>
                </pre>
              </div>
            </div>

            {/* BCA Developer Style Response Card */}
            <div className="rounded-xl overflow-hidden shadow-sm border border-[#DEE2E6]">
              {/* Gray Header Banner */}
              <div className="bg-[#DEE2E6] text-[#212529] px-4 py-2 font-bold text-xs uppercase tracking-wider">
                EXAMPLE
              </div>
              <div className="bg-white p-3 flex flex-col space-y-2">
                {/* Subheader bar with copy button */}
                <div className="bg-[#F8F9FA] border border-[#E9ECEF] px-3 py-1.5 rounded-md flex items-center justify-between text-xs text-[#212529] font-semibold">
                  <div className="flex items-center gap-2">
                    <span>Response</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                      200 OK
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(activeEndpoint.responseSample, null, 2),
                        `res-${activeEndpoint.id}`
                      )
                    }
                    className="hover:text-[#005CAA] transition-colors font-mono text-[11px]"
                    title="Copy Response"
                  >
                    {copiedKey === `res-${activeEndpoint.id}` ? (
                      <span className="text-emerald-600 font-bold">✓ Copied</span>
                    ) : (
                      <span className="underline">Copy</span>
                    )}
                  </button>
                </div>
                {/* Response Code body */}
                <pre className="p-3 bg-[#F8F9FA] rounded-md text-[#212529] font-mono text-xs overflow-x-auto max-h-[320px] leading-relaxed select-all border border-[#E9ECEF]">
                  <code>{JSON.stringify(activeEndpoint.responseSample, null, 2)}</code>
                </pre>
              </div>
            </div>

            {/* Error Response Box (if available) */}
            {activeEndpoint.errorSample && (
              <div className="rounded-xl overflow-hidden shadow-sm border border-[#FFA8A8]">
                <div className="bg-[#FFE3E3] text-[#C92A2A] px-4 py-1.5 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Error Response</span>
                  <span className="font-mono text-[11px]">{activeEndpoint.errorSample.status}</span>
                </div>
                <div className="bg-[#FFF5F5] p-3">
                  <pre className="text-[#C92A2A] font-mono text-xs overflow-x-auto leading-relaxed select-all">
                    <code>{JSON.stringify(activeEndpoint.errorSample.body, null, 2)}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

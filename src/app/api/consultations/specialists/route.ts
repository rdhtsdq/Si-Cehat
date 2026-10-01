import { NextResponse } from "next/server";

export interface Specialist {
  id: string;
  name: string;
  title: string;
  type: "BIDAN" | "AHLI_GIZI" | "DOKTER";
  typeLabel: string;
  rating: number;
  experienceYears: number;
  available: boolean;
  avatarUrl: string;
  focus: string[];
}

const SPECIALISTS: Specialist[] = [
  {
    id: "spec-bidan-1",
    name: "Bidan Siti Nurhaliza, Amd.Keb",
    title: "Bidan Praktik Mandiri",
    type: "BIDAN",
    typeLabel: "Bidan Komunitas & KIA",
    rating: 4.9,
    experienceYears: 8,
    available: true,
    avatarUrl: "/avatars/spec-bidan.png",
    focus: ["Tumbuh Kembang Balita", "Pola Makan Bayi & Batita", "Kesehatan Ibu"],
  },
  {
    id: "spec-gizi-1",
    name: "Nurul Aini, S.Gz, RD",
    title: "Nutrisionis Pediatrik Klinis",
    type: "AHLI_GIZI",
    typeLabel: "Konsultan Diet & Gizi Anak",
    rating: 4.95,
    experienceYears: 6,
    available: true,
    avatarUrl: "/avatars/spec-gizi.png",
    focus: ["Pencegahan Diabetes Anak", "Manajemen Gula Darah", "Porsi Gizi Seimbang"],
  },
  {
    id: "spec-dokter-1",
    name: "dr. Bambang Irawan, Sp.A",
    title: "Spesialis Anak & Endokrinologi Pediatri",
    type: "DOKTER",
    typeLabel: "Dokter Spesialis Anak",
    rating: 4.88,
    experienceYears: 12,
    available: true,
    avatarUrl: "/avatars/spec-dokter.png",
    focus: ["Skrining & Terapi Diabetes Anak", "Obesitas Anak", "Metabolisme Glukosa"],
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  let list = SPECIALISTS;
  if (type) {
    list = list.filter((s) => s.type.toLowerCase() === type.toLowerCase());
  }

  return NextResponse.json({
    specialists: list,
  });
}

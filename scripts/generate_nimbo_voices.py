import os
import asyncio
import edge_tts

# Ultra-natural Microsoft Edge Indonesian Neural Voice for children's coach
VOICE = "id-ID-GadisNeural"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "audio", "nimbo")
os.makedirs(OUTPUT_DIR, exist_ok=True)

PROMPTS = {
    "intro": "Yuk, susun piring sehat bergizi seimbang!",
    "round-1": "Pilih 1 karbohidrat dan 1 lauk protein!",
    "round-2": "Pilih 1 porsi sayuran untuk piringmu!",
    "round-3": "Pilih 1 buah segar yang manis alami!",
    "quiz-intro": "Piringmu lengkap! Yuk jawab 2 kuis kilat ini.",
    "remove-food": "Pilih makanan lain untuk piringmu.",
    "food-nasi-merah": "Hebat! Nasi Merah: Tinggi serat alami, energi tahan lama.",
    "food-kentang-rebus": "Hebat! Kentang Rebus: Karbohidrat alami kaya kalium.",
    "food-jagung-manis": "Hebat! Jagung Manis: Manis alami dan tinggi serat sehat.",
    "food-ikan-bakar": "Hebat! Ikan Bakar: Kaya protein dan omega-3 untuk otak.",
    "food-telur-rebus": "Hebat! Telur Rebus: Protein lengkap pembangun otot.",
    "food-tempe-bacem": "Hebat! Tempe Panggang: Protein nabati kaya kalsium.",
    "food-bayam-bening": "Hebat! Sayur Bayam: Kaya zat besi untuk daya tahan tubuh.",
    "food-wortel-rebus": "Hebat! Wortel Manis: Tinggi vitamin A untuk mata sehat.",
    "food-sayur-sop": "Hebat! Sayur Sop: Aneka sayur segar bervitamin lengkap.",
    "food-pisang-barangan": "Hebat! Pisang: Kaya kalium untuk energimu.",
    "food-pepaya-manis": "Hebat! Pepaya Segar: Kaya vitamin C dan lancarkan cerna.",
    "food-apel-segar": "Hebat! Apel Renyah: Manis segar dan tinggi serat alami.",
    "food-donat-cokelat": "Donat Gula? Tinggi gula dan minyak jenuh. Pilih menu sehat ya!",
    "food-minuman-soda": "Soda Manis? Tinggi gula cair tanpa nutrisi sehat. Pilih menu sehat ya!",
}

async def generate_all():
    print(f"Generating {len(PROMPTS)} Nimbo voice lines using {VOICE}...")
    for key, text in PROMPTS.items():
        out_path = os.path.join(OUTPUT_DIR, f"{key}.mp3")
        communicate = edge_tts.Communicate(text, VOICE, rate="+5%", pitch="+10Hz")
        await communicate.save(out_path)
        print(f"  [OK] {key}.mp3 -> {text[:30]}...")
    print("All voice lines generated successfully in", OUTPUT_DIR)

if __name__ == "__main__":
    asyncio.run(generate_all())

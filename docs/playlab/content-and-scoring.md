# Content Schema & Scoring Rules — Si-Cehat PlayLab

## 1. Content Architecture
To decouple health education content from UI rendering, all game items, round prompts, mascot feedback, and knowledge questions live in external JSON:
- Active File: `src/content/healthy-plate/v1.json`
- Schema Definition: `src/content/types.ts`

### Food Categories
1. **`karbo` (Makanan Pokok):** Makanan pokok kaya karbohidrat kompleks alami (Nasi Beras Merah, Kentang Rebus, Jagung Manis).
2. **`protein` (Lauk Pauk):** Sumber protein hewani dan nabati berkualitas (Ikan Bakar, Telur Rebus, Tempe Panggang).
3. **`sayur` (Sayuran):** Sayuran hijau dan berwarna kaya serat serta mikronutrien (Sayur Bayam, Wortel Manis, Sayur Sop).
4. **`buah` (Buah-buahan):** Buah segar lokal kaya vitamin alami (Pisang Barangan, Pepaya Segar, Apel Renyah).
5. **`distractor` (Camilan Manis/Ultra-diproses):** Makanan tinggi gula rafinasi (Donat Cokelat Gula, Minuman Soda).

---

## 2. Server Scoring Algorithm

Scoring is computed on the backend server (`POST /api/game-sessions/:id/complete`) using `FOOD_ITEMS_MAP` and `KNOWLEDGE_KEY`:

### 2.1 Gameplay Score (0–100)
* Each balanced quadrant filled with healthy food adds **25 points**:
  * Karbohidrat: +25
  * Lauk Pauk: +25
  * Sayuran: +25
  * Buah: +25
* Distractor penalty: -20 points per distractor item placed (floored at 0).
* Maximum score: 100 points.

### 2.2 Knowledge Score (0–100)
* Computed as percentage of correct answers:
  $$\text{Knowledge Score} = \left(\frac{\text{Correct Answers}}{\text{Total Questions}}\right) \times 100$$

### 2.3 Combined Total & Rewards
* **Total Score:** $60\% \times \text{Gameplay} + 40\% \times \text{Knowledge}$
* **Stars:**
  * 3 Stars: Total Score $\ge 80$
  * 2 Stars: Total Score $\ge 55$
  * 1 Star: Total Score $< 55$
* **XP Award:**
  * 3 Stars: +75 XP
  * 2 Stars: +60 XP
  * 1 Star: +45 XP

---

## 3. Feedback Principles
* **Non-shaming:** Distractor foods generate encouraging prompts (e.g. *"Waduh, donat terlalu manis untuk makanan utama! Ganti dengan buah segar ya."*) rather than alarmist or body-shaming warnings.
* **Positive reinforcement:** Completing slots triggers positive affirmations highlighting health benefits (e.g. *"Ikan bakar: Kaya omega-3 untuk kecerdasan otak"*).

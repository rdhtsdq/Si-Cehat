export type AvatarCharacter = "default" | "apple" | "broccoli" | "carrot";
export type AvatarAccessory = "none" | "glasses" | "headphone" | "hat";
export type AvatarState = "idle" | "listening" | "thinking" | "talking" | "happy" | "celebrating" | "confused";

export type AvatarPreference = {
  character: AvatarCharacter;
  accessory: AvatarAccessory;
  orbColor: string;
};

export const avatarStorageKey = "si-cehat-avatar";

export const defaultAvatarPreference: AvatarPreference = {
  character: "default",
  accessory: "none",
  orbColor: "#4f9f7a",
};

export const characters: Array<{
  id: AvatarCharacter;
  name: string;
  description: string;
}> = [
  {
    id: "default",
    name: "Bimbi",
    description: "Si bulat hijau yang penasaran dan suka mendengar.",
  },
  {
    id: "apple",
    name: "Apo",
    description: "Si apel pemberani yang selalu siap mencoba hal baru.",
  },
  {
    id: "broccoli",
    name: "Brok",
    description: "Si brokoli kocak dengan rambut paling heboh.",
  },
  {
    id: "carrot",
    name: "Roro",
    description: "Si wortel lincah yang tidak bisa diam.",
  },
];

export const accessories: Array<{
  id: AvatarAccessory;
  name: string;
}> = [
  { id: "none", name: "Tanpa aksesori" },
  { id: "glasses", name: "Kacamata" },
  { id: "headphone", name: "Headphone" },
  { id: "hat", name: "Topi" },
];

export const suggestedQuestions = [
  "Kenapa kita harus makan sayur?",
  "Boleh minum minuman manis setiap hari?",
  "Buah apa yang baik untuk tubuh?",
  "Kenapa kita harus bergerak dan bermain?",
  "Apa contoh makanan sehat?",
  "Apa makanan Sunda yang sehat?",
];

export function loadAvatarPreference(): AvatarPreference {
  if (typeof window === "undefined") {
    return defaultAvatarPreference;
  }

  const stored = window.localStorage.getItem(avatarStorageKey);
  if (!stored) {
    return defaultAvatarPreference;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<AvatarPreference>;
    return {
      character:
        parsed.character && characters.some((item) => item.id === parsed.character)
          ? parsed.character
          : defaultAvatarPreference.character,
      accessory:
        parsed.accessory && accessories.some((item) => item.id === parsed.accessory)
          ? parsed.accessory
          : defaultAvatarPreference.accessory,
      orbColor: parsed.orbColor || defaultAvatarPreference.orbColor,
    };
  } catch {
    return defaultAvatarPreference;
  }
}

export function saveAvatarPreference(preference: AvatarPreference, childId?: string) {
  window.localStorage.setItem(avatarStorageKey, JSON.stringify(preference));
  syncAvatarWithBackend(preference, childId).catch(() => {
    // Fail silently in background for offline support
  });
}

export async function syncAvatarWithBackend(preference: AvatarPreference, childId?: string) {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId,
        character: preference.character,
        accessory: preference.accessory,
        orbColor: preference.orbColor,
      }),
    });
  } catch {
    // Offline resilience
  }
}


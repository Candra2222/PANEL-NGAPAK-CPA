export const LEAD_SOUND_URL =
  "https://dnkjankypdusganpuezi.supabase.co/storage/v1/object/public/NOTIFIKASI/jokowi-saya-akan-lawan.mp3";

let audio = null;

export function playLeadSound() {
  try {
    if (!audio) audio = new Audio(LEAD_SOUND_URL);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {
    // sound unavailable
  }
}

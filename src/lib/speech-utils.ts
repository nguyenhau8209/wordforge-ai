/**
 * Maps language names to SpeechSynthesis language codes
 * @param language - Language name (e.g., "english", "german", "chinese")
 * @returns SpeechSynthesis language code (e.g., "en-US", "de-DE", "zh-CN")
 */
export function getSpeechLanguageCode(language: string): string {
  const languageMap: Record<string, string> = {
    english: "en-US",
    german: "de-DE",
    chinese: "zh-CN",
    spanish: "es-ES",
    french: "fr-FR",
    japanese: "ja-JP",
    korean: "ko-KR",
    italian: "it-IT",
    portuguese: "pt-BR",
    russian: "ru-RU",
    vietnamese: "vi-VN",
  }

  // Normalize language string (lowercase, trim)
  const normalized = language.toLowerCase().trim()

  // Return mapped code or default to en-US
  return languageMap[normalized] || "en-US"
}

/**
 * SpeechSynthesis configuration constants
 */
export const SPEECH_CONFIG = {
  DEFAULT_RATE: 0.7,
  DEFAULT_PITCH: 1,
  WORD_RATE: 0.8,
} as const


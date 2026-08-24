type UiCopy = {
  eyebrow: string;
  title: string;
  loading: string;
  error: string;
  retry: string;
  correct: string;
  incorrect: string;
};

const translations: Record<string, UiCopy> = {
  en: {
    eyebrow: "SPOILER-SAFE QUIZ",
    title: "Ready for a plot twist?",
    loading: "Preparing a question for this moment…",
    error: "The question could not be prepared. Your video will stay paused while we try again.",
    retry: "Try again",
    correct: "Correct.",
    incorrect: "Not quite."
  },
  fr: {
    eyebrow: "QUIZ SANS SPOILER",
    title: "Prêt pour un rebondissement ?",
    loading: "Préparation d’une question adaptée à ce moment…",
    error: "La question n’a pas pu être préparée. La vidéo reste en pause pendant une nouvelle tentative.",
    retry: "Réessayer",
    correct: "Bonne réponse.",
    incorrect: "Pas tout à fait."
  }
};

export function getUiCopy(locale: string): UiCopy {
  return translations[locale.split("-")[0]] ?? translations.en;
}

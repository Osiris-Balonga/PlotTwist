type UiCopy = {
  open: string;
  close: string;
  eyebrow: string;
  title: string;
  description: string;
  loading: string;
};

const translations: Record<string, UiCopy> = {
  en: {
    open: "Open PlotTwist quiz",
    close: "Close quiz",
    eyebrow: "SPOILER-SAFE QUIZ",
    title: "Ready for a plot twist?",
    description: "Choose a question when you are ready. We will keep it within your viewing progress.",
    loading: "Preparing your first clue…"
  },
  fr: {
    open: "Ouvrir le quiz PlotTwist",
    close: "Fermer le quiz",
    eyebrow: "QUIZ SANS SPOILER",
    title: "Prêt pour un rebondissement ?",
    description: "Une question adaptée à votre progression va apparaître.",
    loading: "Préparation de votre premier indice…"
  }
};

export function getUiCopy(locale: string): UiCopy {
  return translations[locale.split("-")[0]] ?? translations.en;
}

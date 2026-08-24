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
    open: "Open PlotTwist quiz",
    close: "Close quiz",
    eyebrow: "QUIZ SANS SPOILER",
    title: "Ready for a plot twist?",
    description: "Choose a question when you are ready. We will keep it within your viewing progress.",
    loading: "Preparing your first clue…"
  }
};

export function getUiCopy(locale: string): UiCopy {
  return translations[locale.split("-")[0]] ?? translations.en;
}


type UiCopy = {
  eyebrow: string;
  title: string;
  loading: string;
  close: string;
  correct: string;
  incorrect: string;
  correctChoice: string;
  incorrectChoice: string;
};

const translations: Record<string, UiCopy> = {
  en: {
    eyebrow: "SPOILER INCOMING",
    title: "How much of the twist can you predict?",
    loading: "Preparing the spoiler quiz…",
    close: "Close PlotTwist and resume playback",
    correct: "Correct — spoiler confirmed.",
    incorrect: "Wrong answer — here is what happens.",
    correctChoice: "Correct answer",
    incorrectChoice: "Incorrect answer"
  },
  fr: {
    eyebrow: "SPOILER IMMINENT",
    title: "Jusqu’où peux-tu deviner le rebondissement ?",
    loading: "Préparation du quiz spoiler…",
    close: "Fermer PlotTwist et reprendre la lecture",
    correct: "Bonne réponse — spoiler confirmé.",
    incorrect: "Mauvaise réponse — voici ce qui va arriver.",
    correctChoice: "Bonne réponse",
    incorrectChoice: "Mauvaise réponse"
  }
};

export function getUiCopy(locale: string): UiCopy {
  return translations[locale.split("-")[0]] ?? translations.en;
}

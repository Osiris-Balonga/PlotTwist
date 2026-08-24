type UiCopy = {
  eyebrow: string;
  title: string;
  loading: string;
  error: string;
  dailyLimit: string;
  episodeAlreadySpoiled: string;
  rateLimited: string;
  runtimeUnavailable: string;
  retry: string;
  correct: string;
  incorrect: string;
  correctChoice: string;
  incorrectChoice: string;
};

const translations: Record<string, UiCopy> = {
  en: {
    eyebrow: "SPOILER INCOMING",
    title: "How much of the twist can you predict?",
    loading: "Preparing your next spoiler…",
    error: "The spoiler could not be prepared. Playback will resume shortly.",
    dailyLimit: "You have reached today's spoiler limit. Playback will resume shortly.",
    episodeAlreadySpoiled: "This episode has already had its PlotTwist. Playback will resume shortly.",
    rateLimited: "The spoiler service has reached its daily request limit. Playback will resume shortly.",
    runtimeUnavailable: "PlotTwist was reloaded. Refresh this tab to use it again.",
    retry: "Try again",
    correct: "Correct — spoiler confirmed.",
    incorrect: "Wrong answer — here is what happens.",
    correctChoice: "Correct answer",
    incorrectChoice: "Incorrect answer"
  },
  fr: {
    eyebrow: "SPOILER IMMINENT",
    title: "Jusqu’où peux-tu deviner le rebondissement ?",
    loading: "Préparation de ton prochain spoiler…",
    error: "Le spoiler n’a pas pu être préparé. La lecture reprendra dans un instant.",
    dailyLimit: "Tu as atteint la limite de spoilers du jour. La lecture va reprendre.",
    episodeAlreadySpoiled: "Cet épisode a déjà eu son PlotTwist. La lecture va reprendre.",
    rateLimited: "Le service de spoilers a atteint sa limite quotidienne. La lecture va reprendre.",
    runtimeUnavailable: "PlotTwist a été rechargé. Actualise cet onglet pour le réactiver.",
    retry: "Réessayer",
    correct: "Bonne réponse — spoiler confirmé.",
    incorrect: "Mauvaise réponse — voici ce qui va arriver.",
    correctChoice: "Bonne réponse",
    incorrectChoice: "Mauvaise réponse"
  }
};

export function getUiCopy(locale: string): UiCopy {
  return translations[locale.split("-")[0]] ?? translations.en;
}

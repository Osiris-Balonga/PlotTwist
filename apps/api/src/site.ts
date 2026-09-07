const repositoryUrl = "https://github.com/Osiris-Balonga/PlotTwist";

const sharedHead = `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#faf6ee">
  <link rel="icon" type="image/png" href="/assets/plottwist-mark.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@700;800&display=swap" rel="stylesheet">
`;

const homeStyles = `
  :root {
    color-scheme: light;
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
    --canvas: #faf6ee;
    --ink: #17110d;
    --ink-soft: #51483f;
    --muted: #746b61;
    --red: #e8112a;
    --line: #ddd4c5;
    --green: #217a42;
    --green-surface: #e6f5ea;
    --wrong: #b52b25;
    --wrong-surface: #fce9e8;
    --page-x: clamp(1.5rem, 4.6vw, 4.75rem);
    --page-y: clamp(1.35rem, 4vh, 2.75rem);
  }

  * { box-sizing: border-box; }
  html { background: var(--canvas); }
  body { margin: 0; min-width: 320px; background: var(--canvas); color: var(--ink); }
  button, a { font: inherit; }

  .landing {
    display: grid;
    grid-template-columns: minmax(24rem, 45%) 1fr;
    min-height: 100svh;
  }

  .copy-panel {
    z-index: 1;
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: space-between;
    gap: clamp(2.5rem, 8vh, 6rem);
    padding: var(--page-y) var(--page-x);
    background: var(--canvas);
  }

  .brand {
    display: inline-flex;
    width: fit-content;
    align-items: center;
    gap: 0.7rem;
    color: var(--ink);
    text-decoration: none;
  }

  .brand img { width: clamp(2rem, 3.6vh, 2.5rem); height: auto; }
  .brand span { font-family: "Sora", sans-serif; font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; }

  .hero-copy {
    display: flex;
    max-width: 35rem;
    flex-direction: column;
    align-items: flex-start;
    gap: clamp(1rem, 2.1vh, 1.4rem);
  }

  h1 {
    margin: 0;
    font-family: "Sora", sans-serif;
    font-size: clamp(3rem, min(6.2vw - 0.5rem, 10.5vh), 6rem);
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 0.95;
    text-wrap: balance;
  }

  .description {
    max-width: 48ch;
    margin: 0;
    color: var(--ink-soft);
    font-size: clamp(1rem, 0.4vw + 0.75rem, 1.15rem);
    line-height: 1.65;
    text-wrap: pretty;
  }

  .inline-logo { display: inline-block; width: auto; margin-inline: 0.06em; }
  .inline-logo.netflix { height: 0.85em; vertical-align: -0.06em; }
  .inline-logo.prime { height: 1.15em; vertical-align: -0.22em; }

  .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
  .button {
    display: inline-flex;
    min-height: 3.25rem;
    align-items: center;
    gap: 0.65rem;
    padding: 0.8rem 1.35rem;
    border: 1px solid transparent;
    border-radius: 999px;
    color: var(--ink);
    font-weight: 700;
    text-decoration: none;
    transition: transform 160ms ease-out, background-color 160ms ease-out, border-color 160ms ease-out;
  }

  .button-icon { width: 1.2rem; height: 1.2rem; flex: 0 0 auto; object-fit: contain; }
  .button.primary { background: var(--red); color: #fff; }
  .button.secondary { border-color: var(--line); background: #fff; }
  .button.secondary:hover { border-color: #a99d8b; transform: translateY(-2px); }
  .button.is-disabled { cursor: not-allowed; opacity: 0.56; }
  .button:focus-visible, .brand:focus-visible, .footer-link:focus-visible { outline: 3px solid var(--red); outline-offset: 4px; }

  .footer { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 1rem; }
  .footer p { max-width: 54ch; margin: 0; color: var(--muted); font-size: 0.78rem; line-height: 1.55; }
  .footer-link { color: var(--ink-soft); font-size: 0.78rem; text-underline-offset: 0.2em; }

  .visual-panel {
    position: relative;
    min-width: 0;
    overflow: hidden;
    isolation: isolate;
    background: #2a050a url("/assets/hero-background.webp") center / cover no-repeat;
    box-shadow: inset 10px 0 30px -20px rgb(0 0 0 / 45%);
  }

  .visual-panel::after {
    position: absolute;
    z-index: -1;
    inset: 0;
    background: linear-gradient(180deg, transparent 55%, rgb(0 0 0 / 34%));
    content: "";
  }

  .quiz-demo { position: absolute; top: 50%; left: 50%; width: clamp(17rem, 24vw, 21rem); transform: translate(-50%, -50%); }
  .quiz-card {
    position: relative;
    padding: 1.2rem 1.25rem 1.3rem;
    border-radius: 16px;
    background: #fffefb;
    box-shadow: 0 26px 54px -20px rgb(0 0 0 / 58%);
    opacity: 0;
    transform: translateY(14px) scale(0.975);
    transition: opacity 500ms ease-out, transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
    --platform-accent: var(--red);
  }

  .quiz-card.is-visible { opacity: 1; transform: none; }
  .quiz-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.8rem; }
  .quiz-brand { display: flex; align-items: center; gap: 0.45rem; }
  .quiz-brand img { width: 1.05rem; height: 1.05rem; }
  .quiz-tag { color: var(--platform-accent); font-size: 0.66rem; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; }
  .platform-logo { width: auto; max-width: 4.2rem; object-fit: contain; }
  .quiz-alert { margin: 0 0 0.55rem; color: var(--ink-soft); font-size: 0.72rem; line-height: 1.45; }
  .quiz-question { margin: 0 0 0.85rem; font-size: 0.86rem; font-weight: 700; line-height: 1.42; }
  .quiz-options { display: flex; flex-direction: column; gap: 0.45rem; }
  .quiz-option { padding: 0.6rem 0.75rem; border: 1px solid var(--line); border-radius: 10px; background: #fff; font-size: 0.76rem; line-height: 1.35; transition: opacity 300ms ease, color 300ms ease, border-color 300ms ease, background 300ms ease; }
  .quiz-option.is-correct { border-color: #b7dfc1; background: var(--green-surface); color: var(--green); font-weight: 700; }
  .quiz-option.is-wrong { border-color: #efbdb9; background: var(--wrong-surface); color: var(--wrong); font-weight: 700; }
  .quiz-option.is-faded { opacity: 0.46; }
  .quiz-reveal { display: grid; grid-template-rows: 0fr; margin: 0; opacity: 0; transition: grid-template-rows 400ms ease, opacity 350ms ease; }
  .quiz-reveal.is-shown { grid-template-rows: 1fr; margin-bottom: 0.75rem; opacity: 1; }
  .quiz-reveal-inner { min-height: 0; overflow: hidden; }
  .quiz-reveal strong { display: block; margin-bottom: 0.2rem; color: var(--platform-accent); font-size: 0.78rem; }
  .quiz-reveal span { display: block; color: var(--ink-soft); font-size: 0.72rem; line-height: 1.45; }
  .pointer { position: absolute; width: 1.4rem; height: 1.4rem; opacity: 0; filter: drop-shadow(0 3px 5px rgb(0 0 0 / 40%)); pointer-events: none; transition: opacity 250ms ease, top 550ms ease, left 550ms ease, transform 180ms ease; }
  .pointer.is-visible { opacity: 1; }
  .pointer.is-tapping { transform: scale(0.72); }

  .caption { position: absolute; right: clamp(1.5rem, 3.2vw, 3.5rem); bottom: clamp(1.5rem, 4.2vh, 3rem); color: rgb(255 255 255 / 94%); font-size: clamp(0.65rem, 0.5vw + 0.4rem, 0.8rem); font-weight: 700; letter-spacing: 0.14em; line-height: 1.7; text-align: right; text-shadow: 0 2px 14px rgb(0 0 0 / 45%); text-transform: uppercase; }
  .caption-rule { display: inline-block; width: 1.65rem; height: 1px; margin-left: 0.6rem; background: rgb(255 255 255 / 58%); vertical-align: middle; }

  @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  .hero-copy > * { animation: rise 600ms both cubic-bezier(0.22, 1, 0.36, 1); }
  .hero-copy > :nth-child(2) { animation-delay: 80ms; }
  .hero-copy > :nth-child(3) { animation-delay: 160ms; }

  @media (max-width: 860px) {
    .landing { grid-template-columns: 1fr; grid-template-rows: minmax(15rem, 34svh) auto; }
    .visual-panel { order: -1; min-height: 15rem; box-shadow: none; background-position: center 52%; }
    .quiz-demo { display: none; }
    .caption { display: none; }
    .copy-panel { min-height: 66svh; gap: 2.5rem; padding: 1.5rem; }
    h1 { font-size: clamp(3rem, 14vw, 4.5rem); }
  }

  @media (max-width: 480px) {
    .footer { align-items: flex-start; flex-direction: column; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
  }
`;

const privacyStyles = `
  :root { color-scheme: light; font-family: "Inter", ui-sans-serif, system-ui, sans-serif; background: #faf6ee; color: #17110d; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #faf6ee; }
  main { width: min(48rem, calc(100% - 3rem)); margin: 0 auto; padding: clamp(2rem, 7vw, 5rem) 0; }
  a { color: #bd0e22; text-underline-offset: 0.22em; }
  .brand { display: inline-flex; align-items: center; gap: 0.65rem; color: #17110d; font-family: "Sora", sans-serif; font-weight: 800; text-decoration: none; }
  .brand img { width: 2rem; height: 2rem; }
  h1 { margin: 4rem 0 1.5rem; font-family: "Sora", sans-serif; font-size: clamp(2.8rem, 8vw, 5.5rem); letter-spacing: -0.04em; line-height: 0.98; text-wrap: balance; }
  h2 { margin: 2.5rem 0 0.65rem; font-family: "Sora", sans-serif; font-size: 1.15rem; }
  p { max-width: 70ch; color: #51483f; font-size: 1rem; line-height: 1.75; text-wrap: pretty; }
  strong { color: #17110d; }
  footer { margin-top: 4rem; padding-top: 1.25rem; border-top: 1px solid #ddd4c5; color: #746b61; font-size: 0.85rem; }
`;

function document(title: string, description: string, styles: string, body: string, script = ""): string {
  return `<!doctype html>
<html lang="en">
  <head>
    ${sharedHead}
    <title>${title}</title>
    <meta name="description" content="${description}">
    <style>${styles}</style>
  </head>
  <body>${body}${script}</body>
</html>`;
}

const homeScript = `<script>
(() => {
  const card = document.querySelector("[data-quiz-card]");
  const platformLogo = document.querySelector("[data-platform-logo]");
  const alert = document.querySelector("[data-alert]");
  const question = document.querySelector("[data-question]");
  const reveal = document.querySelector("[data-reveal]");
  const revealTitle = document.querySelector("[data-reveal-title]");
  const revealText = document.querySelector("[data-reveal-text]");
  const options = document.querySelector("[data-options]");
  const pointer = document.querySelector("[data-pointer]");
  if (!card || !platformLogo || !alert || !question || !reveal || !revealTitle || !revealText || !options || !pointer) return;

  const quizzes = [
    { accent: "#e8112a", logo: "/assets/netflix-wordmark.webp", logoAlt: "Netflix", logoHeight: "0.78rem", alert: "Warning: this question reveals a key moment from season 1.", question: "Who destroys the Demogorgon using her psychic powers?", choices: ["Eleven", "Mike Wheeler", "Jim Hopper"], correct: 0, picked: 1, revealTitle: "Wrong answer — here's what happens next.", revealText: "Eleven destroys the Demogorgon using her psychic powers." },
    { accent: "#146eb4", logo: "/assets/prime-video-wordmark.webp", logoAlt: "Prime Video", logoHeight: "1.15rem", alert: "Warning: this question reveals a main character's death in the season 1 finale.", question: "Madelyn Stillwell is killed in the finale. How does she die?", choices: ["She's stabbed by The Deep.", "She's killed by Homelander's laser eyes.", "She's shot by Billy Butcher."], correct: 2, picked: 2, revealTitle: "Correct answer — here's what happens next.", revealText: "She's shot by Billy Butcher." }
  ];

  const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  const render = (quiz) => {
    card.style.setProperty("--platform-accent", quiz.accent);
    platformLogo.src = quiz.logo;
    platformLogo.alt = quiz.logoAlt;
    platformLogo.style.height = quiz.logoHeight;
    alert.textContent = quiz.alert;
    question.textContent = quiz.question;
    revealTitle.textContent = quiz.revealTitle;
    revealText.textContent = quiz.revealText;
    reveal.classList.remove("is-shown");
    options.replaceChildren(...quiz.choices.map((choice) => {
      const option = document.createElement("div");
      option.className = "quiz-option";
      option.textContent = choice;
      return option;
    }));
  };

  const answer = (quiz) => {
    [...options.children].forEach((option, index) => option.classList.add(index === quiz.correct ? "is-correct" : index === quiz.picked ? "is-wrong" : "is-faded"));
    reveal.classList.add("is-shown");
  };

  const play = async (quiz) => {
    render(quiz);
    card.classList.add("is-visible");
    await wait(1450);
    const picked = options.children[quiz.picked];
    const cardBounds = card.getBoundingClientRect();
    const pickedBounds = picked.getBoundingClientRect();
    pointer.style.top = (pickedBounds.top - cardBounds.top + pickedBounds.height / 2 - 11) + "px";
    pointer.style.left = (pickedBounds.right - cardBounds.left - 24) + "px";
    pointer.classList.add("is-visible");
    await wait(650);
    pointer.classList.add("is-tapping");
    await wait(200);
    answer(quiz);
    pointer.classList.remove("is-visible", "is-tapping");
    await wait(3300);
    card.classList.remove("is-visible");
    await wait(600);
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    render(quizzes[0]);
    card.classList.add("is-visible");
    answer(quizzes[0]);
    return;
  }

  (async () => {
    let index = 0;
    while (true) {
      await play(quizzes[index % quizzes.length]);
      index += 1;
    }
  })();
})();
</script>`;

export function renderHomePage(): string {
  return document(
    "PlotTwist — Interactive spoiler quizzes",
    "Interactive spoiler quizzes that interrupt Netflix and Prime Video at exactly the wrong moment.",
    homeStyles,
    `<main class="landing">
      <section class="copy-panel" aria-labelledby="hero-title">
        <a class="brand" href="/" aria-label="PlotTwist home"><img src="/assets/plottwist-mark.png" alt=""><span>PlotTwist</span></a>
        <div class="hero-copy">
          <h1 id="hero-title">PlotTwist</h1>
          <p class="description">Interactive spoiler quizzes that interrupt <img class="inline-logo netflix" src="/assets/netflix-wordmark.webp" alt="Netflix"> and <img class="inline-logo prime" src="/assets/prime-video-wordmark.webp" alt="Prime Video"> at exactly the wrong moment. The question spoils the setup. Your answer reveals the rest.</p>
          <div class="actions">
            <span class="button primary is-disabled" aria-disabled="true" title="Coming soon to the Chrome Web Store"><img class="button-icon" src="/assets/chrome.svg" alt=""> Get the extension</span>
            <a class="button secondary" href="${repositoryUrl}"><img class="button-icon" src="/assets/github.svg" alt=""> View source</a>
          </div>
        </div>
        <footer class="footer"><p>PlotTwist is an independent project and is not affiliated with Netflix or Amazon.</p><a class="footer-link" href="/privacy">Privacy</a></footer>
      </section>

      <section class="visual-panel" aria-label="Animated preview of a PlotTwist spoiler quiz">
        <div class="quiz-demo">
          <div class="quiz-card" data-quiz-card>
            <svg class="pointer" data-pointer aria-hidden="true" viewBox="0 0 24 24"><path d="M4 2l14 8.2-6.1 1.4-1.4 6.1L4 2Z" fill="#17110d" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>
            <div class="quiz-head"><div class="quiz-brand"><img src="/assets/plottwist-mark.png" alt=""><span class="quiz-tag">Spoiler incoming</span></div><img class="platform-logo" data-platform-logo src="/assets/netflix-wordmark.webp" alt="Netflix"></div>
            <p class="quiz-alert" data-alert></p>
            <p class="quiz-question" data-question></p>
            <div class="quiz-reveal" data-reveal><div class="quiz-reveal-inner"><strong data-reveal-title></strong><span data-reveal-text></span></div></div>
            <div class="quiz-options" data-options></div>
          </div>
        </div>
        <div class="caption"><div>Good shows<span class="caption-rule"></span></div><div>deserve worse timing</div></div>
      </section>
    </main>`,
    homeScript
  );
}

export function renderPrivacyPage(): string {
  return document(
    "Privacy policy — PlotTwist",
    "How PlotTwist processes viewing context and extension data.",
    privacyStyles,
    `<main>
      <a class="brand" href="/"><img src="/assets/plottwist-mark.png" alt=""><span>PlotTwist</span></a>
      <h1>Privacy policy</h1>
      <p><strong>Last updated:</strong> September 7, 2026.</p>
      <h2>What PlotTwist processes</h2>
      <p>When a supported video is actively playing, the extension processes the platform name, content title or identifier, episode metadata, playback position, and browser locale. It also creates a random installation identifier used to enforce quiz limits. PlotTwist does not read account passwords, payment details, messages, or unrelated browsing history.</p>
      <h2>Why this data is used</h2>
      <p>The data is sent to the PlotTwist API only to generate a context-aware spoiler quiz, return it in the user's language, cache it locally, and prevent repeated or excessive quiz generation.</p>
      <h2>AI processing and retention</h2>
      <p>Quiz context is forwarded to the configured language-model provider for generation. PlotTwist does not sell personal data and does not maintain user profiles. The extension stores quiz and delivery state locally in Chrome. The API keeps only short-lived operational rate-limit state in memory and may produce standard hosting logs.</p>
      <h2>Controls</h2>
      <p>Removing the extension deletes its Chrome-managed local data. Users can also clear extension storage from Chrome settings. Do not install PlotTwist if you do not consent to intentional spoilers or the processing described above.</p>
      <h2>Contact</h2>
      <p>Questions and deletion requests can be opened through the <a href="${repositoryUrl}/issues">public issue tracker</a>.</p>
      <footer>This policy will be updated when the extension's data practices change.</footer>
    </main>`
  );
}

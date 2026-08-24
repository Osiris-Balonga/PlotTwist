import type { Platform } from "../../shared/viewing-context";
import { getUiCopy } from "./copy";
import type { Quiz } from "../../shared/quiz";

const ROOT_ID = "plottwist-extension-root";

export function mountOverlay(platform: Platform, locale: string, requestQuiz: () => Promise<{ quiz?: Quiz; error?: string }>): void {
  if (document.getElementById(ROOT_ID)) return;

  const copy = getUiCopy(locale);
  const host = document.createElement("div");
  host.id = ROOT_ID;
  host.dataset.platform = platform;
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .shell { --pt-accent: ${platform === "netflix" ? "oklch(0.56 0.21 27)" : "oklch(0.70 0.13 215)"}; --pt-bg: oklch(0.16 0.012 250 / .98); --pt-surface: oklch(0.22 0.015 250); --pt-ink: oklch(0.97 0.005 250); --pt-muted: oklch(0.76 0.02 250); position: fixed; right: 24px; bottom: 28px; z-index: 2147483000; font-family: ${platform === "netflix" ? '"Netflix Sans", system-ui, sans-serif' : '"Amazon Ember", system-ui, sans-serif'}; color: var(--pt-ink); -webkit-font-smoothing: antialiased; }
      button { font: inherit; cursor: pointer; }
      .trigger { width: 44px; height: 44px; border: 0; border-radius: 999px; background: var(--pt-accent); color: white; box-shadow: 0 5px 8px oklch(0 0 0 / .28); transition-property: transform, box-shadow, opacity; transition-duration: 180ms; transition-timing-function: cubic-bezier(.2,0,0,1); }
      .trigger:hover { transform: translateY(-2px); box-shadow: 0 8px 8px oklch(0 0 0 / .28); }
      .trigger:active { transform: scale(.96); }
      .trigger:focus-visible, .close:focus-visible { outline: 3px solid white; outline-offset: 3px; }
      .panel { width: min(344px, calc(100vw - 32px)); margin-bottom: 12px; padding: 18px; border-radius: 16px; background: var(--pt-bg); box-shadow: 0 8px 8px oklch(0 0 0 / .28); opacity: 0; transform: translateY(8px) scale(.98); pointer-events: none; transition-property: transform, opacity; transition-duration: 190ms; transition-timing-function: cubic-bezier(.2,0,0,1); }
      .shell[data-open="true"] .panel { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
      .topline { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .eyebrow { margin: 0; color: var(--pt-accent); font-size: 11px; font-weight: 700; letter-spacing: .08em; }
      .close { width: 40px; height: 40px; border: 0; border-radius: 999px; background: transparent; color: var(--pt-ink); font-size: 22px; line-height: 1; transition-property: background-color, transform; transition-duration: 160ms; }
      .close:hover { background: oklch(1 0 0 / .1); }.close:active { transform: scale(.96); }
      h2 { margin: 12px 0 8px; font-size: 21px; line-height: 1.2; letter-spacing: -.02em; text-wrap: balance; }
      p { margin: 0; color: var(--pt-muted); font-size: 14px; line-height: 1.5; text-wrap: pretty; }
      .skeleton { height: 40px; margin-top: 18px; border-radius: 10px; background: linear-gradient(90deg, var(--pt-surface), oklch(0.29 0.015 250), var(--pt-surface)); background-size: 200% 100%; animation: shimmer 1.4s linear infinite; }
      @keyframes shimmer { to { background-position: -200% 0; } }
      @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition-duration: .01ms !important; } }
    </style>
    <div class="shell" data-open="false">
      <section class="panel" aria-label="PlotTwist quiz" aria-hidden="true">
        <div class="topline"><p class="eyebrow">${copy.eyebrow}</p><button class="close" type="button" aria-label="${copy.close}">×</button></div>
        <h2>${copy.title}</h2><p class="content">${copy.description}</p><button class="load" type="button">Start quiz</button>
      </section>
      <button class="trigger" type="button" aria-label="${copy.open}">✦</button>
    </div>`;

  const shell = shadow.querySelector<HTMLElement>(".shell")!;
  const panel = shadow.querySelector<HTMLElement>(".panel")!;
  const setOpen = (open: boolean) => { shell.dataset.open = String(open); panel.setAttribute("aria-hidden", String(!open)); };
  shadow.querySelector<HTMLButtonElement>(".trigger")!.addEventListener("click", () => setOpen(shell.dataset.open !== "true"));
  shadow.querySelector<HTMLButtonElement>(".close")!.addEventListener("click", () => setOpen(false));
  shadow.querySelector<HTMLButtonElement>(".load")!.addEventListener("click", async (event) => { const button = event.currentTarget as HTMLButtonElement; button.disabled = true; button.textContent = copy.loading; const result = await requestQuiz(); const content = shadow.querySelector<HTMLElement>(".content")!; if (!result.quiz) { content.textContent = result.error ?? "Unable to prepare a quiz."; button.disabled = false; return; } const quiz = result.quiz; content.textContent = `${quiz.hint}\n\n${quiz.question}`; button.remove(); quiz.choices.forEach((choice, index) => { const option = document.createElement("button"); option.className = "trigger"; option.textContent = choice; option.onclick = () => { content.textContent = `${index === quiz.correctChoiceIndex ? "Correct." : "Not quite."} ${quiz.reveal}`; option.parentElement?.querySelectorAll("button.trigger").forEach((item) => item.remove()); }; panel.append(option); }); });
  document.body.append(host);
}

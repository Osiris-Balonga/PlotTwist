import type { Quiz } from "../../shared/quiz";
import type { Platform } from "../../shared/viewing-context";
import { ERROR_DISMISS_MS, MAX_QUIZ_REQUEST_ATTEMPTS, REVEAL_DURATION_MS } from "../config";
import { getUiCopy } from "./copy";

const ROOT_ID = "plottwist-extension-root";

type QuizResult = { quiz?: Quiz; error?: string };

export function mountOverlay(
  platform: Platform,
  locale: string,
  requestQuiz: () => Promise<QuizResult>,
  onComplete: () => void
): void {
  if (document.getElementById(ROOT_ID)) return;

  const copy = getUiCopy(locale);
  const host = document.createElement("div");
  host.id = ROOT_ID;
  host.dataset.platform = platform;
  const shadow = host.attachShadow({ mode: "open" });
  const iconUrl = chrome.runtime.getURL("icons/icon-32.png");

  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      *, *::before, *::after { box-sizing: border-box; }
      .backdrop {
        --accent: #e50914;
        --backdrop: rgb(0 0 0 / 78%);
        --choice: #272727;
        --choice-hover: #353535;
        --muted: #b8b8b8;
        --panel: #181818;
        --success: #32a866;
        --danger: #e24444;
        --panel-radius: 4px;
        --choice-radius: 2px;
        --panel-padding: 28px;
        position: fixed;
        inset: 0;
        z-index: 2147483000;
        display: grid;
        place-items: center;
        padding: 20px;
        background: var(--backdrop);
        color: #fff;
        font-family: "Netflix Sans", "Helvetica Neue", "Segoe UI", sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .backdrop[data-platform="prime"] {
        --accent: #00a8e1;
        --backdrop: rgb(0 5 13 / 82%);
        --choice: #18283a;
        --choice-hover: #223b53;
        --muted: #b5c7d9;
        --panel: #0f1b2a;
        --success: #39b979;
        --danger: #f05656;
        --panel-radius: 10px;
        --choice-radius: 6px;
        --panel-padding: 30px;
        font-family: "Amazon Ember", Arial, sans-serif;
      }
      .panel {
        width: min(500px, 100%);
        max-height: min(680px, calc(100vh - 40px));
        overflow: auto;
        padding: var(--panel-padding);
        border-radius: var(--panel-radius);
        background: var(--panel);
        box-shadow: 0 8px 24px rgb(0 0 0 / 48%);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }
      .brand img { width: 28px; height: 28px; border-radius: 7px; }
      .backdrop[data-platform="prime"] .brand { gap: 12px; margin-bottom: 12px; }
      .backdrop[data-platform="prime"] .brand img { width: 30px; height: 30px; border-radius: 8px; }
      .eyebrow {
        margin: 0;
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: .06em;
      }
      h2 {
        margin: 0;
        font-size: 24px;
        line-height: 1.2;
        letter-spacing: -.02em;
        text-wrap: balance;
      }
      .body { min-width: 0; margin-top: 18px; }
      .hint, .question, .reveal, .status {
        overflow-wrap: anywhere;
        text-wrap: pretty;
      }
      .hint {
        margin: 0 0 10px;
        color: var(--muted);
        font-size: 15px;
        line-height: 1.45;
      }
      .question {
        margin: 0;
        color: #fff;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.45;
      }
      .status {
        margin: 0;
        color: var(--muted);
        font-size: 15px;
        line-height: 1.5;
      }
      .choices { display: grid; gap: 10px; margin-top: 20px; }
      .choice, .retry {
        min-height: 48px;
        border: 0;
        border-radius: var(--choice-radius);
        background: var(--choice);
        color: inherit;
        font: 600 16px/1.35 inherit;
        cursor: pointer;
        transition-property: background-color, box-shadow, opacity, transform;
        transition-duration: 180ms;
        transition-timing-function: cubic-bezier(.2, 0, 0, 1);
      }
      .choice { padding: 12px 14px; text-align: start; }
      .retry { margin-top: 18px; padding: 12px 18px; }
      .choice:hover, .retry:hover { background: var(--choice-hover); }
      .choice:active, .retry:active { transform: scale(.96); }
      .choice:focus-visible, .retry:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 3px;
      }
      .choice:disabled { cursor: default; opacity: .62; }
      .choice[data-selected="true"] {
        box-shadow: inset 0 0 0 2px var(--accent);
        opacity: 1;
      }
      .choice[data-result="correct"] {
        background: color-mix(in srgb, var(--success) 30%, var(--choice));
        box-shadow: inset 0 0 0 2px var(--success);
        opacity: 1;
      }
      .choice[data-result="incorrect"] {
        background: color-mix(in srgb, var(--danger) 34%, var(--choice));
        box-shadow: inset 0 0 0 2px var(--danger);
        opacity: 1;
      }
      .feedback {
        margin: 0 0 8px;
        color: var(--accent);
        font-size: 18px;
        font-weight: 700;
      }
      .feedback[data-result="correct"] { color: var(--success); }
      .feedback[data-result="incorrect"] { color: var(--danger); }
      .reveal {
        margin: 0;
        color: #fff;
        font-size: 16px;
        line-height: 1.55;
        opacity: 0;
        transform: translateY(6px);
        transition-property: opacity, transform;
        transition-duration: 220ms;
        transition-timing-function: cubic-bezier(.2, 0, 0, 1);
      }
      .reveal[data-visible="true"] { opacity: 1; transform: translateY(0); }
      @media (max-width: 520px) {
        .backdrop { padding: 12px; }
        .panel { max-height: calc(100vh - 24px); padding: 22px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .choice, .retry, .reveal { transition-duration: .01ms; }
      }
    </style>
    <section class="backdrop" data-platform="${platform}" role="dialog" aria-modal="true" aria-labelledby="plottwist-title">
      <div class="panel">
        <div class="brand"><img src="${iconUrl}" alt=""><p class="eyebrow">${copy.eyebrow}</p></div>
        <h2 id="plottwist-title">${copy.title}</h2>
        <div class="body"></div>
        <div class="choices"></div>
      </div>
    </section>`;

  document.body.append(host);
  const body = shadow.querySelector<HTMLElement>(".body")!;
  const choices = shadow.querySelector<HTMLElement>(".choices")!;
  const backdrop = shadow.querySelector<HTMLElement>(".backdrop")!;
  const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  let answered = false;
  let closed = false;
  let requestAttempts = 0;

  const finish = () => {
    if (closed) return;
    closed = true;
    backdrop.removeEventListener("keydown", keepFocusInside);
    host.remove();
    previouslyFocused?.focus();
    onComplete();
  };

  const focusableElements = (): HTMLButtonElement[] => [...shadow.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
  const keepFocusInside = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = focusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const activeIndex = focusable.indexOf(shadow.activeElement as HTMLButtonElement);
    const nextIndex = event.shiftKey
      ? (activeIndex <= 0 ? focusable.length - 1 : activeIndex - 1)
      : (activeIndex === focusable.length - 1 ? 0 : activeIndex + 1);
    event.preventDefault();
    focusable[nextIndex].focus();
  };
  backdrop.addEventListener("keydown", keepFocusInside);

  const showLoading = () => {
    body.innerHTML = `<p class="status" role="status" aria-live="polite"></p>`;
    body.querySelector<HTMLElement>(".status")!.textContent = copy.loading;
    choices.replaceChildren();
  };

  const loadQuiz = async () => {
    requestAttempts += 1;
    showLoading();
    const result = await requestQuiz();
    if (!result.quiz) {
      body.innerHTML = `<p class="status" role="alert"></p>`;
      const errorCopy = result.error === "daily_limit_reached"
        ? copy.dailyLimit
        : result.error === "episode_already_spoiled"
          ? copy.episodeAlreadySpoiled
          : result.error === "rate_limited"
            ? copy.rateLimited
            : result.error === "runtime_unavailable"
              ? copy.runtimeUnavailable
              : copy.error;
      body.querySelector<HTMLElement>(".status")!.textContent = errorCopy;
      const canRetry = result.error === "unavailable" && requestAttempts < MAX_QUIZ_REQUEST_ATTEMPTS;
      if (!canRetry) {
        choices.replaceChildren();
        window.setTimeout(finish, ERROR_DISMISS_MS);
        return;
      }
      const retry = document.createElement("button");
      retry.className = "retry";
      retry.textContent = copy.retry;
      retry.addEventListener("click", () => void loadQuiz(), { once: true });
      choices.replaceChildren(retry);
      retry.focus();
      return;
    }

    const quiz = result.quiz;
    body.innerHTML = `<p class="hint"></p><p class="question"></p>`;
    body.querySelector<HTMLElement>(".hint")!.textContent = quiz.hint;
    body.querySelector<HTMLElement>(".question")!.textContent = quiz.question;
    choices.replaceChildren();

    quiz.choices.forEach((choice, index) => {
      const option = document.createElement("button");
      option.className = "choice";
      option.textContent = choice;
      option.addEventListener("click", () => {
        if (answered) return;
        answered = true;
        const buttons = [...shadow.querySelectorAll<HTMLButtonElement>(".choice")];
        for (const [buttonIndex, button] of buttons.entries()) {
          button.disabled = true;
          if (buttonIndex === quiz.correctChoiceIndex) {
            button.dataset.result = "correct";
            button.setAttribute("aria-label", `${quiz.choices[buttonIndex]} — ${copy.correctChoice}`);
          }
        }
        option.dataset.selected = "true";
        const isCorrect = index === quiz.correctChoiceIndex;
        if (!isCorrect) {
          option.dataset.result = "incorrect";
          option.setAttribute("aria-label", `${choice} — ${copy.incorrectChoice}`);
        }
        const feedback = isCorrect ? copy.correct : copy.incorrect;
        body.innerHTML = `<p class="feedback" role="status"></p><p class="reveal"></p>`;
        const feedbackElement = body.querySelector<HTMLElement>(".feedback")!;
        feedbackElement.dataset.result = isCorrect ? "correct" : "incorrect";
        feedbackElement.textContent = feedback;
        const reveal = body.querySelector<HTMLElement>(".reveal")!;
        reveal.textContent = quiz.reveal;
        window.setTimeout(() => { reveal.dataset.visible = "true"; }, 120);
        window.setTimeout(finish, REVEAL_DURATION_MS);
      });
      choices.append(option);
    });
    choices.querySelector<HTMLButtonElement>(".choice")?.focus();
  };

  void loadQuiz();
}

import type { Quiz } from "../../shared/quiz";
import type { Platform } from "../../shared/viewing-context";
import { SKELETON_DURATION_MS } from "../config";
import { getUiCopy } from "./copy";

const ROOT_ID = "plottwist-extension-root";

export function mountOverlay(
  platform: Platform,
  locale: string,
  quiz: Quiz,
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
        --success: #2f9e5f;
        --danger: #ce3535;
        --skeleton-base: #292929;
        --skeleton-shine: #3a3a3a;
        --close-bg: rgb(24 24 24 / 92%);
        --close-hover: #343434;
        --scroll-thumb: #5b5b5b;
        --scroll-thumb-hover: #777;
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
        --success: #319c68;
        --danger: #d84747;
        --skeleton-base: #18283a;
        --skeleton-shine: #29435c;
        --close-bg: rgb(24 40 58 / 94%);
        --close-hover: #2b4964;
        --scroll-thumb: #31516d;
        --scroll-thumb-hover: #44769b;
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
        scrollbar-color: var(--scroll-thumb) transparent;
        scrollbar-width: thin;
      }
      .panel::-webkit-scrollbar { width: 8px; }
      .panel::-webkit-scrollbar-track { background: transparent; }
      .panel::-webkit-scrollbar-thumb {
        border: 2px solid var(--panel);
        border-radius: 999px;
        background: var(--scroll-thumb);
      }
      .panel::-webkit-scrollbar-thumb:hover { background: var(--scroll-thumb-hover); }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }
      .brand img {
        width: 28px;
        height: 28px;
        border-radius: 7px;
        outline: 1px solid rgb(255 255 255 / 10%);
        outline-offset: -1px;
      }
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
      .hint, .question, .reveal {
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
      .choices { display: grid; gap: 10px; margin-top: 20px; }
      .choice {
        min-height: 48px;
        padding: 12px 14px;
        border: 0;
        border-radius: var(--choice-radius);
        background: var(--choice);
        color: inherit;
        font: 600 16px/1.35 inherit;
        text-align: start;
        cursor: pointer;
        transition-property: background-color, opacity, transform;
        transition-duration: 180ms;
        transition-timing-function: cubic-bezier(.2, 0, 0, 1);
      }
      .choice:hover { background: var(--choice-hover); }
      .choice:active { transform: scale(.96); }
      .choice:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 3px;
      }
      .choice:disabled:not([data-result]) { cursor: default; opacity: .5; }
      .choice[data-result="correct"] {
        background: color-mix(in srgb, var(--success) 62%, var(--choice));
        opacity: 1;
      }
      .choice[data-result="incorrect"] {
        background: color-mix(in srgb, var(--danger) 66%, var(--choice));
        opacity: 1;
      }
      .feedback {
        margin: 0 0 8px;
        color: var(--accent);
        font-size: 18px;
        font-weight: 700;
      }
      .feedback[data-result="correct"] { color: #58c584; }
      .feedback[data-result="incorrect"] { color: #f06a6a; }
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
      .close-overlay {
        position: fixed;
        top: max(22px, env(safe-area-inset-top));
        right: max(22px, env(safe-area-inset-right));
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: var(--close-bg);
        box-shadow: 0 2px 8px rgb(0 0 0 / 38%);
        color: #fff;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: scale(.25);
        filter: blur(4px);
        transition-property: background-color, opacity, transform, filter;
        transition-duration: 180ms;
        transition-timing-function: cubic-bezier(.2, 0, 0, 1);
      }
      .close-overlay[data-visible="true"] {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: scale(1);
        filter: blur(0);
      }
      .close-overlay:hover { background: var(--close-hover); }
      .close-overlay:active { transform: scale(.96); }
      .close-overlay:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
      .close-overlay svg { width: 22px; height: 22px; }
      .skeleton-stack { display: grid; gap: 9px; }
      .skeleton-block {
        display: block;
        height: 13px;
        border-radius: max(2px, calc(var(--choice-radius) - 2px));
        background: linear-gradient(90deg, var(--skeleton-base) 0%, var(--skeleton-shine) 48%, var(--skeleton-base) 100%);
        background-size: 220% 100%;
        animation: skeleton-wave 800ms ease-in-out infinite;
      }
      .skeleton-block[data-width="hint"] { width: 58%; }
      .skeleton-block[data-width="question"] { width: 96%; height: 17px; }
      .skeleton-block[data-width="question-short"] { width: 72%; height: 17px; }
      .skeleton-choice { height: 48px; border-radius: var(--choice-radius); }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      @keyframes skeleton-wave {
        from { background-position: 100% 0; }
        to { background-position: -120% 0; }
      }
      @media (max-width: 520px) {
        .backdrop { padding: 12px; }
        .panel { max-height: calc(100vh - 24px); padding: 22px; }
        .close-overlay {
          top: max(14px, env(safe-area-inset-top));
          right: max(14px, env(safe-area-inset-right));
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .choice, .reveal, .close-overlay { transition-duration: .01ms; }
        .skeleton-block { animation: none; background: var(--skeleton-base); }
      }
    </style>
    <section class="backdrop" data-platform="${platform}" role="dialog" aria-modal="true" aria-labelledby="plottwist-title" tabindex="-1">
      <button class="close-overlay" type="button" aria-label="${copy.close}" aria-hidden="true" disabled>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" />
        </svg>
      </button>
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
  const closeButton = shadow.querySelector<HTMLButtonElement>(".close-overlay")!;
  const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  let answered = false;
  let closed = false;

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
      backdrop.focus({ preventScroll: true });
      return;
    }
    const activeIndex = focusable.indexOf(shadow.activeElement as HTMLButtonElement);
    const nextIndex = event.shiftKey
      ? (activeIndex <= 0 ? focusable.length - 1 : activeIndex - 1)
      : (activeIndex === focusable.length - 1 ? 0 : activeIndex + 1);
    event.preventDefault();
    focusable[nextIndex].focus();
  };
  const finish = () => {
    if (closed) return;
    closed = true;
    backdrop.removeEventListener("keydown", keepFocusInside);
    host.remove();
    previouslyFocused?.focus();
    onComplete();
  };

  backdrop.addEventListener("keydown", keepFocusInside);
  closeButton.addEventListener("click", finish);
  backdrop.focus({ preventScroll: true });

  const showSkeleton = () => {
    body.innerHTML = `
      <div class="skeleton-stack" aria-hidden="true">
        <span class="skeleton-block" data-width="hint"></span>
        <span class="skeleton-block" data-width="question"></span>
        <span class="skeleton-block" data-width="question-short"></span>
      </div>
      <p class="sr-only" role="status" aria-live="polite"></p>`;
    body.querySelector<HTMLElement>(".sr-only")!.textContent = copy.loading;
    choices.innerHTML = `
      <span class="skeleton-block skeleton-choice" aria-hidden="true"></span>
      <span class="skeleton-block skeleton-choice" aria-hidden="true"></span>
      <span class="skeleton-block skeleton-choice" aria-hidden="true"></span>`;
  };

  const renderQuiz = () => {
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

        const isCorrect = index === quiz.correctChoiceIndex;
        if (!isCorrect) {
          option.dataset.result = "incorrect";
          option.setAttribute("aria-label", `${choice} — ${copy.incorrectChoice}`);
        }
        backdrop.focus({ preventScroll: true });
        body.innerHTML = `<p class="feedback" role="status"></p><p class="reveal"></p>`;
        const feedbackElement = body.querySelector<HTMLElement>(".feedback")!;
        feedbackElement.dataset.result = isCorrect ? "correct" : "incorrect";
        feedbackElement.textContent = isCorrect ? copy.correct : copy.incorrect;
        const reveal = body.querySelector<HTMLElement>(".reveal")!;
        reveal.textContent = quiz.reveal;
        closeButton.disabled = false;
        closeButton.setAttribute("aria-hidden", "false");
        window.setTimeout(() => {
          reveal.dataset.visible = "true";
          closeButton.dataset.visible = "true";
          closeButton.focus({ preventScroll: true });
        }, 120);
      });
      choices.append(option);
    });
  };

  showSkeleton();
  window.setTimeout(renderQuiz, SKELETON_DURATION_MS);
}

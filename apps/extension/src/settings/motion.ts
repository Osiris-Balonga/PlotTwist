const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
const running = new WeakMap<HTMLDetailsElement, Animation>();
export function reveal(element: HTMLElement): void {
  if (reducedMotion.matches) return;
  element.getAnimations().forEach((animation) => animation.cancel());
  element.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 200, easing });
}

export function setDisclosureOpen(details: HTMLDetailsElement, open: boolean): void {
  const summary = details.querySelector("summary")!;
  const start = details.getBoundingClientRect().height;
  running.get(details)?.cancel();
  details.dataset.expanded = String(open);
  delete details.dataset.animating;
  if (reducedMotion.matches) { details.open = open; return; }
  details.open = true;
  const end = open ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height;
  details.dataset.animating = "true";
  const animation = details.animate([{ height: `${start}px` }, { height: `${end}px` }], { duration: 280, easing });
  running.set(details, animation);
  animation.onfinish = () => {
    details.open = open;
    delete details.dataset.animating;
    running.delete(details);
  };
}

export function initializeDisclosures(): void {
  document.querySelectorAll<HTMLDetailsElement>(".disclosure").forEach((details) => {
    details.dataset.expanded = String(details.open);
    details.querySelector("summary")!.addEventListener("click", (event) => {
      event.preventDefault();
      setDisclosureOpen(details, details.dataset.expanded !== "true");
    });
  });
}

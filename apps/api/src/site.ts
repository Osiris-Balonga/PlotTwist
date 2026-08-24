const repositoryUrl = "https://github.com/Osiris-Balonga/PlotTwist";

const styles = `
  :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #08090b; color: #f5f5f5; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 20% 0%, #301016 0, transparent 36rem), #08090b; }
  main { width: min(760px, calc(100% - 40px)); margin: 0 auto; padding: 72px 0; }
  .mark { display: inline-grid; place-items: center; width: 48px; height: 48px; border-radius: 13px; background: #e50914; font-size: 26px; font-weight: 900; transform: rotate(-4deg); }
  h1 { margin: 28px 0 12px; font-size: clamp(3rem, 11vw, 6.5rem); line-height: .88; letter-spacing: -.075em; }
  h2 { margin-top: 42px; font-size: 1.25rem; }
  .lead { max-width: 620px; color: #c9c9ce; font-size: 1.18rem; line-height: 1.65; }
  .warning { display: inline-block; margin-top: 18px; padding: 8px 12px; border: 1px solid #53252a; border-radius: 999px; color: #ffb4bb; background: #1f0d10; font-size: .84rem; }
  a { color: #67d8ff; text-underline-offset: 4px; }
  nav { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 36px; }
  section, .policy { color: #c9c9ce; line-height: 1.7; }
  strong { color: #f5f5f5; }
  footer { margin-top: 56px; padding-top: 22px; border-top: 1px solid #27282d; color: #898a91; font-size: .9rem; }
`;

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#08090b">
    <title>${title}</title>
    <style>${styles}</style>
  </head>
  <body><main>${body}</main></body>
</html>`;
}

export function renderHomePage(): string {
  return page("PlotTwist — Spoilers, on purpose", `
    <div class="mark" aria-hidden="true">P</div>
    <h1>PlotTwist</h1>
    <p class="lead">Interactive spoiler quizzes that interrupt Netflix and Prime Video at exactly the wrong moment. The question spoils the setup. Your answer reveals the rest.</p>
    <span class="warning">Contains intentional spoilers</span>
    <nav>
      <a href="${repositoryUrl}">Source code</a>
      <a href="/privacy">Privacy policy</a>
      <a href="/health">API status</a>
    </nav>
    <footer>PlotTwist is an independent project and is not affiliated with Netflix or Amazon.</footer>
  `);
}

export function renderPrivacyPage(): string {
  return page("Privacy policy — PlotTwist", `
    <a href="/">← PlotTwist</a>
    <h1 style="font-size:clamp(2.6rem,8vw,4.8rem)">Privacy policy</h1>
    <div class="policy">
      <p><strong>Last updated:</strong> August 24, 2026.</p>
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
    </div>
    <footer>This policy will be updated when the extension's data practices change.</footer>
  `);
}

import type { ManifestV3Export } from "@crxjs/vite-plugin";

const DEFAULT_API_URL = "http://localhost:8787/v1/quiz";

function apiHostPermission(apiUrl: string): string {
  const url = new URL(apiUrl);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || url.hash || (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))) {
    throw new Error("VITE_API_URL must use HTTPS, or HTTP on localhost, without embedded credentials.");
  }
  return `${url.origin}/*`;
}

export function createManifest(apiUrl = DEFAULT_API_URL): ManifestV3Export {
  return {
  manifest_version: 3,
  name: "PlotTwist",
  version: "0.1.0",
  description: "Interactive spoiler quizzes for Netflix and Prime Video.",
  icons: {
    16: "icons/icon-16.png",
    32: "icons/icon-32.png",
    48: "icons/icon-48.png",
    128: "icons/icon-128.png"
  },
  action: {
    default_title: "PlotTwist",
    default_popup: "popup.html",
    default_icon: {
      16: "icons/icon-16.png",
      32: "icons/icon-32.png"
    }
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module"
  },
  permissions: ["storage"],
  options_ui: { page: "options.html", open_in_tab: true },
  host_permissions: ["https://*.netflix.com/*", "https://*.primevideo.com/*", apiHostPermission(apiUrl)],
  content_scripts: [
    {
      matches: ["https://*.netflix.com/*", "https://*.primevideo.com/*"],
      js: ["src/content/index.ts"],
      run_at: "document_idle"
    }
  ],
  web_accessible_resources: [
    {
      resources: ["icons/*.png"],
      matches: ["https://*.netflix.com/*", "https://*.primevideo.com/*"]
    }
  ]
  };
}

export default createManifest();

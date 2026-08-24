import type { ManifestV3Export } from "@crxjs/vite-plugin";

const manifest: ManifestV3Export = {
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
  host_permissions: ["https://*.netflix.com/*", "https://*.primevideo.com/*", "http://localhost:8787/*"],
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

export default manifest;

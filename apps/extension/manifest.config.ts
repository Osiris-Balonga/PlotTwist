import type { ManifestV3Export } from "@crxjs/vite-plugin";

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "PlotTwist",
  version: "0.1.0",
  description: "Spoiler-aware interactive quizzes for streaming platforms.",
  action: {
    default_title: "PlotTwist"
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module"
  },
  permissions: ["storage"],
  host_permissions: ["https://*.netflix.com/*", "https://*.primevideo.com/*"],
  content_scripts: [
    {
      matches: ["https://*.netflix.com/*", "https://*.primevideo.com/*"],
      js: ["src/content/index.ts"],
      run_at: "document_idle"
    }
  ]
};

export default manifest;


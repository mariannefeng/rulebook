import { defineConfig, normalizePath } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { createRequire } from "module";
import { execSync } from "child_process";

const require = createRequire(import.meta.url);

const pdfjsDistPath = path.dirname(require.resolve("pdfjs-dist/package.json"));
const wasmDir = normalizePath(path.join(pdfjsDistPath, "wasm"));
console.log(pdfjsDistPath, wasmDir);

function getBuildInfo() {
  const version =
    (typeof process.env.npm_package_version === "string" &&
      process.env.npm_package_version) ||
    "0.0.0";
  let sha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (!sha) {
    try {
      sha = execSync("git rev-parse --short HEAD").toString().trim();
    } catch {
      sha = "unknown";
    }
  } else {
    sha = sha.slice(0, 7);
  }
  return {
    __APP_VERSION__: JSON.stringify(version),
    __GIT_SHA__: JSON.stringify(sha),
  };
}

export default defineConfig({
  define: getBuildInfo(),
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: wasmDir,
          dest: "",
        },
      ],
    }),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => {
              return (
                url.pathname.includes("/games/") &&
                url.pathname.includes("/rules")
              );
            },
            handler: "CacheFirst",
            options: {
              cacheName: "pdf-cache",
              expiration: {
                maxEntries: 50, // Limit number of cached PDFs
                maxAgeSeconds: 60 * 60 * 24 * 100, // 100 days
              },
            },
          },
        ],
      },
      manifest: {
        name: "Rulebook",
        short_name: "Rulebook",
        description: "Search and find all board game rulebooks",
        theme_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});

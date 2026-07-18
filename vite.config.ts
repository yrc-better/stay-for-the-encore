/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

function staticMetadata(publicSiteUrl: string | undefined): Plugin {
  return {
    name: "static-metadata",
    transformIndexHtml(html) {
      if (!publicSiteUrl) {
        return html;
      }

      const siteUrl = new URL(publicSiteUrl).href;
      const socialImageUrl = new URL("og.png", siteUrl).href;
      return html
        .replaceAll("__SITE_URL__", siteUrl)
        .replaceAll("__OG_IMAGE_URL__", socialImageUrl);
    },
  };
}

export default defineConfig(async ({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const base = environment.VITE_BASE_PATH?.trim() || "/";
  const plugins = [
    react(),
    staticMetadata(environment.VITE_PUBLIC_SITE_URL?.trim()),
    sites(),
  ];

  if (!process.env.VITEST) {
    process.env.WRANGLER_WRITE_LOGS ??= "false";
    process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
    process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

    const { cloudflare } = await import("@cloudflare/vite-plugin");
    plugins.push(
      cloudflare({
        viteEnvironment: { name: "server" },
        config: {
          compatibility_date: "2026-05-22",
          main: "./worker/index.ts",
          d1_databases: hostingConfig.d1
            ? [
                {
                  binding: hostingConfig.d1,
                  database_name: "site-creator-d1",
                  database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
                },
              ]
            : [],
          assets: {
            binding: "ASSETS",
            not_found_handling: "single-page-application",
            run_worker_first: true,
          },
        },
      }),
    );
  }

  return {
    base,
    plugins,
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
      globals: true,
    },
  };
});

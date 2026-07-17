/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sites } from "./build/sites-vite-plugin";

export default defineConfig(async ({ command, isPreview }) => {
  const plugins = [react(), sites()];

  if (command === "build" || isPreview) {
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
    plugins,
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
      globals: true,
    },
  };
});

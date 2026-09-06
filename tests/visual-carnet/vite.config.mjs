import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const project = resolve(root, "../..");
export default defineConfig({
  root,
  publicDir: resolve(project, "public"),
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: [
      { find: "next/link", replacement: resolve(root, "next-link.tsx") },
      { find: "next/navigation", replacement: resolve(root, "next-navigation.ts") },
      { find: "next/image", replacement: resolve(root, "next-image.tsx") },
      { find: "@", replacement: project },
    ],
  },
  server: { host: "127.0.0.1", port: 4179, strictPort: true, fs: { allow: [project] } },
});

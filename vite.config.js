import { defineConfig } from "vite";
import { resolve } from "path";
import dotenv from "dotenv";

export default defineConfig(({ mode }) => {
  const envPath = `.env.${mode}`;
  dotenv.config({ path: envPath });

  return {
    publicDir: resolve(__dirname, "public"),
    root: resolve(__dirname, "src/popup"),
    build: {
      outDir: "../../dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, "src/popup/popup.html"),
          background: resolve(__dirname, "src/background/background.js"),
          content: resolve(__dirname, "src/content/content.js"),
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: "[name][extname]",
        },
      },
    },
    plugins: [
      {
        name: "copy-manifest",
        writeBundle: async () => {
          const fs = await import("fs/promises");
          await fs.copyFile("manifest.json", "dist/manifest.json");
        },
      },
    ],
    define: {
      "import.meta.env": {
        VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID,
        VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
        VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        VITE_FIREBASE_MESSAGING_SENDER_ID:
          process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
        VITE_FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID,
      },
    },
  };
});

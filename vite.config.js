import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "recruitment-dev-routes",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const path = (req.url || "").split("?")[0];
          if (path === "/apply" || path === "/admin") req.url = "/recruitment.html";
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        recruitment: "recruitment.html",
      },
    },
  },
  server: {
    port: 5000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});

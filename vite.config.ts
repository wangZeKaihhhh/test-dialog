import { defineConfig, loadEnv, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import UnoCSS from "unocss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const config: UserConfig = {
    server: {
      proxy: {
        /**
         * 文件上传
         */
        "/upload": {
          target: env.VITE_FETCH,
          changeOrigin: true,
        },
      },
    },
    plugins: [UnoCSS(), react()],
    resolve: {
      alias: {
        "@": resolve("./src"),
      },
    },
  };
  return config;
});

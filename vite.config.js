import {fileURLToPath, URL} from "node:url";

import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    server: {
        proxy: {
            "/session": {
                target: "http://localhost:3003",
                changeOrigin: true,
                secure: false,
            },
            "/items": {
                target: "http://localhost:3003",
                changeOrigin: true,
                secure: false,
            },
            "/ws": {
                target: "http://localhost:3003",
                changeOrigin: true,
                ws: true,
                secure: false,
            },
        },
    },
});

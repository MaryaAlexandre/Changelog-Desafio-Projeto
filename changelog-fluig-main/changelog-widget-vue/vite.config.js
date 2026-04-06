import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
            '/fluigapi': {
                target: 'https://strategiconsultoria176588.fluig.cloudtotvs.com.br:2450',
                changeOrigin: true,
                secure: true,
                rewrite: function (path) {
                    return path.replace(/^\/fluigapi/, '')
                }
            }
        }
    },
    build: {
        outDir: '../wcm/widget/widget_marya/src/main/webapp/resources/js/app-vue',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                entryFileNames: `[name].js`,
                chunkFileNames: `[name].js`,
                assetFileNames: `[name].[ext]`
            }
        }
    }
})
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// 빌드 후 manifest.json 및 아이콘을 dist에 복사하는 플러그인
function copyExtensionFiles() {
    return {
        name: 'copy-extension-files',
        closeBundle() {
            const distDir = resolve(__dirname, 'dist');
            const iconsDir = resolve(distDir, 'icons');

            // manifest.json 복사
            copyFileSync(resolve(__dirname, 'manifest.json'), resolve(distDir, 'manifest.json'));

            // 아이콘 복사
            if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
            const iconSizes = ['icon-16.png', 'icon-48.png', 'icon-128.png'];
            for (const icon of iconSizes) {
                const src = resolve(__dirname, 'public/icons', icon);
                if (existsSync(src)) {
                    copyFileSync(src, resolve(iconsDir, icon));
                }
            }
        },
    };
}

export default defineConfig({
    plugins: [react(), tailwindcss(), copyExtensionFiles()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                popup: resolve(__dirname, 'popup.html'),
                options: resolve(__dirname, 'options.html'),
                'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
    },
});

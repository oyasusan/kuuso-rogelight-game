import { defineConfig } from 'vite';

export default defineConfig({
  // 相対パスでビルドし、任意の静的ホスティングに置けるようにする
  base: './',
  server: {
    host: true,
    watch: {
      // SD カード（FAT 系ファイルシステム）では inotify によるファイル監視が
      // 効かないため、ポーリングで変更を検知する
      usePolling: true,
      interval: 500,
    },
  },
});

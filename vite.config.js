import { defineConfig } from 'vite';

export default defineConfig({
  // 相対パスでビルドし、任意の静的ホスティングに置けるようにする
  base: './',
  server: {
    host: true,
  },
});

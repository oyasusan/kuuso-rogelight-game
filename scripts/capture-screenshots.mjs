// 「遊び方」画面用のスクリーンショットを実機同様のブラウザ操作で自動撮影するスクリプト。
// UI を変更したら `node scripts/capture-screenshots.mjs` で撮り直す。
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = path.join(ROOT, 'src/assets/screenshots');
const PORT = 5183;
const BASE_URL = `http://localhost:${PORT}/?debug=1`;

function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      fetch(url)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() > deadline) {
            reject(new Error('vite dev server did not start in time'));
          } else {
            setTimeout(tryOnce, 300);
          }
        });
    };
    tryOnce();
  });
}

async function main() {
  const vite = spawn(
    'node',
    ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'],
    { cwd: ROOT, stdio: 'pipe' },
  );
  vite.stderr.on('data', (d) => process.stderr.write(d));

  try {
    await waitForServer(`http://localhost:${PORT}/`, 20000);

    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 414, height: 896 },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('[browser]', msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForFunction(() => window.__phaserGame?.scene.getScene('HomeScene')?.sys.isActive());
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');

    // 1. タイトル画面（キャラ・ステージ選択）
    await canvas.screenshot({ path: path.join(OUT_DIR, 'home.png') });
    console.log('captured home.png');

    // 2. ライブ開始 → 少し待って観客・敵が出揃った状態にする
    await page.evaluate(() => window.__phaserGame.scene.getScene('HomeScene').startGame());
    await page.waitForFunction(() => window.__phaserGame.scene.getScene('GameScene')?.sys.isActive());
    await page.waitForTimeout(1200);

    // 仮想パッドをドラッグ操作して表示させつつプレイヤーを動かす
    const dragStart = { x: 90, y: 700 };
    const dragEnd = { x: 145, y: 640 };
    await page.mouse.move(dragStart.x, dragStart.y);
    await page.mouse.down();
    await page.mouse.move(dragEnd.x, dragEnd.y, { steps: 8 });
    await page.waitForTimeout(150);
    await canvas.screenshot({ path: path.join(OUT_DIR, 'gameplay.png') });
    console.log('captured gameplay.png');
    await page.mouse.up();

    // 3. レベルアップ演出（3 択強化パネル）をちょうど 1 回分だけ発生させる
    await page.evaluate(() => {
      const scene = window.__phaserGame.scene.getScene('GameScene');
      scene.levelSystem.gainExp(scene.levelSystem.expToNext);
    });
    await page.waitForTimeout(400);
    await canvas.screenshot({ path: path.join(OUT_DIR, 'levelup.png') });
    console.log('captured levelup.png');

    // 選択して再開してから、そのままライブを強制終了してリザルトへ
    await page.keyboard.press('Digit1');
    await page.waitForTimeout(200);
    await page.evaluate(() => window.__phaserGame.scene.getScene('GameScene').endLive());
    await page.waitForFunction(() => window.__phaserGame.scene.getScene('ResultScene')?.sys.isActive());
    await page.waitForTimeout(400);
    await canvas.screenshot({ path: path.join(OUT_DIR, 'result.png') });
    console.log('captured result.png');

    await browser.close();
  } finally {
    vite.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { DEPTH, UI_CONFIG } from '../constants.js';
import audioSystem from '../systems/AudioSystem.js';

/**
 * どの画面でも同じ見た目・同じ挙動で使う「戻る」ボタン。
 * プレーンテキストの案内文だけだとタップ可能に見えないため、枠線つきの
 * ボタンとして描画し「押せる場所」であることを一目でわかるようにする。
 * @param {Phaser.Scene} scene
 * @param {object} options
 * @param {number} options.x
 * @param {number} options.y
 * @param {string} [options.label]
 * @param {() => void} options.onClick
 * @returns {Phaser.GameObjects.Rectangle}
 */
export function createBackButton(scene, { x, y, label = '← 戻る', onClick }) {
  const width = 150;
  const height = 40;

  const rect = scene.add
    .rectangle(x, y, width, height, 0x1a1a33)
    .setStrokeStyle(2, 0x888899)
    .setScrollFactor(0)
    .setDepth(DEPTH.UI)
    .setInteractive({ useHandCursor: true });
  scene.add
    .text(x, y, label, {
      fontFamily: UI_CONFIG.FONT_FAMILY,
      fontSize: '16px',
      color: '#ccccee',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(DEPTH.UI);

  rect.on('pointerdown', () => {
    audioSystem.unlock();
    audioSystem.playSelect();
    onClick();
  });

  return rect;
}

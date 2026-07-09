import Phaser from 'phaser';
import { GAME, UI_CONFIG } from '../constants.js';

/**
 * タイトル画面。
 * スペースキーまたはクリック / タップでライブ開始。
 */
export default class HomeScene extends Phaser.Scene {
  constructor() {
    super('HomeScene');
  }

  create() {
    const centerX = GAME.WIDTH / 2;

    this.add
      .text(centerX, 150, '100秒アイドルライブ', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '52px',
        color: '#ff99cc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 225, '100秒で最高のライブを完成させよう', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '20px',
        color: UI_CONFIG.TEXT_COLOR,
      })
      .setOrigin(0.5);

    this.add
      .text(
        centerX,
        320,
        '移動: WASD / 矢印キー\n歌は自動で発動。観客のそばでパフォーマンスして\n会場の熱狂を連鎖させよう！',
        {
          fontFamily: UI_CONFIG.FONT_FAMILY,
          fontSize: '18px',
          color: '#aaaacc',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    const startText = this.add
      .text(centerX, 430, 'スペースキー / クリックでスタート', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '24px',
        color: UI_CONFIG.ACCENT_COLOR,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown-SPACE', () => this.startGame());
    this.input.once('pointerdown', () => this.startGame());
  }

  startGame() {
    this.scene.start('GameScene');
  }
}

import Phaser from 'phaser';
import { GAME, PERMA_CONFIG, UI_CONFIG } from '../constants.js';
import audioSystem from '../systems/AudioSystem.js';
import saveSystem from '../systems/SaveSystem.js';

/**
 * リザルト画面。
 * ライブ終了時の成績（平均 Heat・熱狂人数・最大コンボ・最終スコア）を表示する。
 */
export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  /**
   * @param {object} data GameScene から渡される成績
   * @param {number} data.averageHeat
   * @param {number} data.frenzyCount
   * @param {number} data.audienceCount
   * @param {number} data.maxCombo
   * @param {number} data.score
   */
  init(data) {
    this.result = data;
  }

  create() {
    audioSystem.playResultFanfare();
    // 歓声をゆっくりフェードアウトさせる
    audioSystem.setCheerTier(0, 3);

    // スコアに応じてファン（永久強化の通貨）を獲得する
    const fansEarned = Math.round(this.result.score / PERMA_CONFIG.SCORE_PER_FAN);
    saveSystem.addFans(fansEarned);

    const centerX = this.scale.width / 2;

    this.add
      .text(centerX, 90, 'ライブ終了！', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '44px',
        color: '#ff99cc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const lines = [
      `平均Heat: ${this.result.averageHeat.toFixed(1)}`,
      `熱狂人数: ${this.result.frenzyCount} / ${this.result.audienceCount} 人`,
      `最大コンボ: ${this.result.maxCombo}`,
    ];
    this.add
      .text(centerX, 220, lines.join('\n'), {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '24px',
        color: UI_CONFIG.TEXT_COLOR,
        align: 'center',
        lineSpacing: 14,
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 340, `SCORE ${this.result.score}`, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '40px',
        color: UI_CONFIG.ACCENT_COLOR,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(
        centerX,
        400,
        `獲得ファン +${fansEarned} 人（所持 ${saveSystem.data.fans} 人）`,
        {
          fontFamily: UI_CONFIG.FONT_FAMILY,
          fontSize: '20px',
          color: '#ff99cc',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(centerX, 460, 'タップ / スペースキーで永久強化へ', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '20px',
        color: '#aaaacc',
      })
      .setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => this.goToUpgrade());
    this.input.once('pointerdown', () => this.goToUpgrade());
  }

  /** RFP のフロー（リザルト → 永久強化 → タイトル）に従って遷移する */
  goToUpgrade() {
    this.scene.start('PermanentUpgradeScene');
  }
}

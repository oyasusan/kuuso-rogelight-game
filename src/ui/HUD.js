import { DEPTH, GAME, UI_CONFIG } from '../constants.js';

/**
 * 画面上部の HUD。
 * 残り時間・レベル・経験値・平均 Heat・熱狂人数を表示する。
 */
export default class HUD {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;

    // 背景バー
    scene.add
      .rectangle(0, 0, GAME.WIDTH, UI_CONFIG.HUD_HEIGHT, 0x000000, 0.55)
      .setOrigin(0)
      .setDepth(DEPTH.UI);

    const style = {
      fontFamily: UI_CONFIG.FONT_FAMILY,
      fontSize: '18px',
      color: UI_CONFIG.TEXT_COLOR,
    };
    const y = UI_CONFIG.HUD_HEIGHT / 2;

    this.timeText = this.createText(80, y, style);
    this.levelText = this.createText(260, y, style);
    this.expText = this.createText(420, y, style);
    this.heatText = this.createText(620, y, style);
    this.frenzyText = this.createText(830, y, style);

    // コンボは画面右上（HUD バー下）に別枠で表示
    this.comboText = scene.add
      .text(GAME.WIDTH - 24, UI_CONFIG.HUD_HEIGHT + 16, '', {
        ...style,
        fontSize: '22px',
        color: UI_CONFIG.ACCENT_COLOR,
      })
      .setOrigin(1, 0)
      .setDepth(DEPTH.UI);
  }

  /** 中央揃えの HUD テキストを 1 つ作る */
  createText(x, y, style) {
    return this.scene.add
      .text(x, y, '', style)
      .setOrigin(0.5)
      .setDepth(DEPTH.UI);
  }

  /**
   * 表示を更新する。
   * @param {object} stats
   * @param {number} stats.remainingSec
   * @param {number} stats.level
   * @param {number} stats.exp
   * @param {number} stats.expToNext
   * @param {number} stats.averageHeat
   * @param {number} stats.frenzyCount
   * @param {number} stats.audienceCount
   * @param {number} stats.combo
   */
  update(stats) {
    this.timeText.setText(`残り ${stats.remainingSec} 秒`);
    this.levelText.setText(`Lv ${stats.level}`);
    this.expText.setText(`EXP ${stats.exp}/${stats.expToNext}`);
    this.heatText.setText(`平均Heat ${stats.averageHeat.toFixed(1)}`);
    this.frenzyText.setText(`熱狂 ${stats.frenzyCount}/${stats.audienceCount}`);
    this.comboText.setText(stats.combo >= 2 ? `${stats.combo} COMBO!` : '');
  }
}

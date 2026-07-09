import { DEPTH, UI_CONFIG } from '../constants.js';

/** 横幅がこれ未満なら、5 項目を 1 段に収めず 2 段組にする */
const NARROW_THRESHOLD = 700;

/**
 * 画面上部の HUD。
 * 残り時間・レベル・経験値・平均 Heat・熱狂人数を表示する。
 *
 * 横幅が十分あれば 1 段に横並び（PC）、狭い場合は 2 段組（スマホ縦画面）にする。
 */
export default class HUD {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;
    const width = scene.scale.width;
    const isNarrow = width < NARROW_THRESHOLD;
    const barHeight = isNarrow ? UI_CONFIG.HUD_HEIGHT * 2 : UI_CONFIG.HUD_HEIGHT;
    this.barHeight = barHeight;

    // 背景バー（ワールドがスクロールしても画面に固定表示する）
    scene.add
      .rectangle(0, 0, width, barHeight, 0x000000, 0.55)
      .setOrigin(0)
      .setDepth(DEPTH.UI)
      .setScrollFactor(0);

    const style = {
      fontFamily: UI_CONFIG.FONT_FAMILY,
      fontSize: isNarrow ? '14px' : '18px',
      color: UI_CONFIG.TEXT_COLOR,
    };

    if (isNarrow) {
      // 2 段組: 1 段目に時間/Lv/EXP、2 段目に Heat/熱狂を均等配置する
      const row1Y = UI_CONFIG.HUD_HEIGHT / 2;
      const row2Y = UI_CONFIG.HUD_HEIGHT + UI_CONFIG.HUD_HEIGHT / 2;
      this.timeText = this.createText(width * (1 / 6), row1Y, style);
      this.levelText = this.createText(width * (3 / 6), row1Y, style);
      this.expText = this.createText(width * (5 / 6), row1Y, style);
      this.heatText = this.createText(width * (1 / 3), row2Y, style);
      this.frenzyText = this.createText(width * (2 / 3), row2Y, style);
    } else {
      const y = UI_CONFIG.HUD_HEIGHT / 2;
      this.timeText = this.createText(80, y, style);
      this.levelText = this.createText(260, y, style);
      this.expText = this.createText(420, y, style);
      this.heatText = this.createText(620, y, style);
      this.frenzyText = this.createText(830, y, style);
    }

    // コンボは画面右上（HUD バー下）に別枠で表示
    this.comboText = scene.add
      .text(width - 24, barHeight + 16, '', {
        ...style,
        fontSize: '22px',
        color: UI_CONFIG.ACCENT_COLOR,
      })
      .setOrigin(1, 0)
      .setDepth(DEPTH.UI)
      .setScrollFactor(0);

    // 取得済みスキルは画面左下に表示
    this.skillsText = scene.add
      .text(12, scene.scale.height - 10, '', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '14px',
        color: '#ccccee',
      })
      .setOrigin(0, 1)
      .setDepth(DEPTH.UI)
      .setScrollFactor(0);
  }

  /** スキル取得状況の表示を更新する（アップグレード選択時に呼ぶ） */
  setSkills(summaryText) {
    this.skillsText.setText(summaryText);
  }

  /** 中央揃えの HUD テキストを 1 つ作る */
  createText(x, y, style) {
    return this.scene.add
      .text(x, y, '', style)
      .setOrigin(0.5)
      .setDepth(DEPTH.UI)
      .setScrollFactor(0);
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

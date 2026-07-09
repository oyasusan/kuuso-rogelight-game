import Phaser from 'phaser';
import { GAME, PERMA_CONFIG, UI_CONFIG } from '../constants.js';
import audioSystem from '../systems/AudioSystem.js';
import saveSystem from '../systems/SaveSystem.js';

/** 行の見た目 */
const ROW = {
  WIDTH: 720,
  HEIGHT: 74,
  GAP: 14,
  COLOR: 0x1a1a33,
  BUTTON_COLOR: 0x2d2d55,
  BUTTON_DISABLED: 0x22222e,
};

/**
 * 永久強化画面。
 * ライブで獲得したファンを消費して、ラン間で持ち越す強化を購入する。
 * リザルトの後、およびタイトルから遷移する。
 */
export default class PermanentUpgradeScene extends Phaser.Scene {
  constructor() {
    super('PermanentUpgradeScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(GAME.BACKGROUND_COLOR);
    const centerX = GAME.WIDTH / 2;

    this.add
      .text(centerX, 44, '永久強化', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '34px',
        color: '#ff99cc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.fansText = this.add
      .text(centerX, 84, '', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '18px',
        color: UI_CONFIG.ACCENT_COLOR,
      })
      .setOrigin(0.5);

    /** 各行の表示更新関数 */
    this.rowRefreshers = PERMA_CONFIG.UPGRADES.map((upgrade, index) =>
      this.createRow(upgrade, centerX, 150 + index * (ROW.HEIGHT + ROW.GAP)),
    );
    this.refresh();

    const backText = this.add
      .text(centerX, GAME.HEIGHT - 32, 'スペースキー / クリックでタイトルへ', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '18px',
        color: '#aaaacc',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    backText.on('pointerdown', () => this.backToTitle());
    this.input.keyboard.once('keydown-SPACE', () => this.backToTitle());
  }

  /**
   * 強化 1 種類分の行（説明＋購入ボタン）を作る。
   * @returns {Function} 表示更新関数
   */
  createRow(upgrade, centerX, y) {
    this.add
      .rectangle(centerX, y, ROW.WIDTH, ROW.HEIGHT, ROW.COLOR)
      .setStrokeStyle(1, 0x444466);

    const left = centerX - ROW.WIDTH / 2;
    this.add.text(left + 20, y - 24, upgrade.name, {
      fontFamily: UI_CONFIG.FONT_FAMILY,
      fontSize: '19px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.add.text(left + 20, y + 4, upgrade.description, {
      fontFamily: UI_CONFIG.FONT_FAMILY,
      fontSize: '14px',
      color: '#bbbbdd',
    });

    const rankText = this.add
      .text(centerX + 130, y, '', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color: '#ccccee',
      })
      .setOrigin(0.5);

    const button = this.add
      .rectangle(centerX + ROW.WIDTH / 2 - 80, y, 130, 44, ROW.BUTTON_COLOR)
      .setStrokeStyle(1, 0xffdd66)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add
      .text(button.x, button.y, '', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '15px',
        color: UI_CONFIG.ACCENT_COLOR,
      })
      .setOrigin(0.5);

    button.on('pointerdown', () => this.buy(upgrade));

    return () => {
      const rank = saveSystem.getRank(upgrade.id);
      const isMax = rank >= upgrade.maxRank;
      const cost = upgrade.baseCost * (rank + 1);
      const canBuy = !isMax && saveSystem.data.fans >= cost;

      rankText.setText(`Lv ${rank}/${upgrade.maxRank}`);
      buttonText.setText(isMax ? 'MAX' : `${cost} ファン`);
      button.setFillStyle(canBuy ? ROW.BUTTON_COLOR : ROW.BUTTON_DISABLED);
      button.setStrokeStyle(1, canBuy ? 0xffdd66 : 0x555566);
      buttonText.setColor(canBuy ? UI_CONFIG.ACCENT_COLOR : '#777788');
    };
  }

  /** 購入処理。ファンが足りない・MAX のときは何もしない */
  buy(upgrade) {
    const rank = saveSystem.getRank(upgrade.id);
    const cost = upgrade.baseCost * (rank + 1);
    if (rank >= upgrade.maxRank || saveSystem.data.fans < cost) {
      return;
    }
    saveSystem.addFans(-cost);
    saveSystem.addRank(upgrade.id);
    audioSystem.playLevelUp();
    this.refresh();
  }

  /** 所持ファンと全行の表示を更新する */
  refresh() {
    this.fansText.setText(`所持ファン: ${saveSystem.data.fans} 人`);
    for (const refreshRow of this.rowRefreshers) {
      refreshRow();
    }
  }

  backToTitle() {
    audioSystem.playSelect();
    this.scene.start('HomeScene');
  }
}

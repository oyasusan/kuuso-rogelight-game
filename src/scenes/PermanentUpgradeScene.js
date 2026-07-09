import Phaser from 'phaser';
import { GAME, PERMA_CONFIG, UI_CONFIG } from '../constants.js';
import audioSystem from '../systems/AudioSystem.js';
import saveSystem from '../systems/SaveSystem.js';

/** 行の見た目 */
const ROW = {
  WIDTH: 760,
  HEIGHT: 56,
  GAP: 8,
  TOP_Y: 150,
  COLOR: 0x1a1a33,
  BUTTON_COLOR: 0x2d2d55,
  BUTTON_DISABLED: 0x22222e,
};

/** タブの定義。category は PERMA_CONFIG.UPGRADES の各項目の category と対応する */
const TABS = [
  { category: 'stat', label: 'ステータス強化' },
  { category: 'character', label: 'キャラクター解放' },
  { category: 'stage', label: '会場解放' },
];

/**
 * 永久強化画面。
 * ライブで獲得したファンを消費して、ラン間で持ち越す強化・キャラクター/会場の
 * 解放を購入する。項目数が多いため、カテゴリごとにタブで切り替えて表示する。
 * リザルトの後、およびタイトルから遷移する。
 */
export default class PermanentUpgradeScene extends Phaser.Scene {
  constructor() {
    super('PermanentUpgradeScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(GAME.BACKGROUND_COLOR);
    const centerX = GAME.WIDTH / 2;
    this.centerX = centerX;
    this.activeCategory = TABS[0].category;
    /** 現在のタブで表示中の行（タブ切り替え時にまとめて破棄する） */
    this.rowObjects = [];
    this.rowRefreshers = [];

    this.add
      .text(centerX, 36, '永久強化', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '30px',
        color: '#ff99cc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.fansText = this.add
      .text(centerX, 68, '', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color: UI_CONFIG.ACCENT_COLOR,
      })
      .setOrigin(0.5);

    this.tabButtons = TABS.map((tab, index) =>
      this.createTabButton(tab, centerX + (index - 1) * 200, 100),
    );

    this.showCategory(this.activeCategory);

    const backText = this.add
      .text(centerX, GAME.HEIGHT - 28, 'スペースキー / クリックでタイトルへ', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color: '#aaaacc',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    backText.on('pointerdown', () => this.backToTitle());
    this.input.keyboard.once('keydown-SPACE', () => this.backToTitle());
  }

  /** タブボタンを 1 つ作る */
  createTabButton(tab, x, y) {
    const rect = this.add
      .rectangle(x, y, 190, 34, 0x1a1a33)
      .setStrokeStyle(1, 0x444466)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(x, y, tab.label, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '15px',
        color: '#ccccee',
      })
      .setOrigin(0.5);
    rect.on('pointerdown', () => {
      audioSystem.unlock();
      audioSystem.playSelect();
      this.showCategory(tab.category);
    });
    return { category: tab.category, rect, label };
  }

  /** タブの見た目とカテゴリごとの行を切り替える */
  showCategory(category) {
    this.activeCategory = category;

    for (const { category: tabCategory, rect, label } of this.tabButtons) {
      const isActive = tabCategory === category;
      rect.setFillStyle(isActive ? 0x2d2d55 : 0x1a1a33);
      rect.setStrokeStyle(1, isActive ? 0xffdd66 : 0x444466);
      label.setColor(isActive ? UI_CONFIG.ACCENT_COLOR : '#ccccee');
    }

    // 前のタブの行をまとめて破棄してから作り直す
    for (const object of this.rowObjects) {
      object.destroy();
    }
    this.rowObjects = [];

    const upgrades = PERMA_CONFIG.UPGRADES.filter(
      (u) => u.category === category,
    );
    this.rowRefreshers = upgrades.map((upgrade, index) =>
      this.createRow(
        upgrade,
        this.centerX,
        ROW.TOP_Y + index * (ROW.HEIGHT + ROW.GAP),
      ),
    );
    this.refresh();
  }

  /**
   * 強化 1 種類分の行（説明＋購入ボタン）を作る。
   * @returns {Function} 表示更新関数
   */
  createRow(upgrade, centerX, y) {
    const track = (object) => {
      this.rowObjects.push(object);
      return object;
    };

    track(
      this.add
        .rectangle(centerX, y, ROW.WIDTH, ROW.HEIGHT, ROW.COLOR)
        .setStrokeStyle(1, 0x444466),
    );

    const left = centerX - ROW.WIDTH / 2;
    track(
      this.add.text(left + 18, y - 17, upgrade.name, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      }),
    );
    track(
      this.add.text(left + 18, y + 4, upgrade.description, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '12px',
        color: '#bbbbdd',
      }),
    );

    const rankText = track(
      this.add
        .text(centerX + 140, y, '', {
          fontFamily: UI_CONFIG.FONT_FAMILY,
          fontSize: '14px',
          color: '#ccccee',
        })
        .setOrigin(0.5),
    );

    const button = track(
      this.add
        .rectangle(centerX + ROW.WIDTH / 2 - 75, y, 120, 40, ROW.BUTTON_COLOR)
        .setStrokeStyle(1, 0xffdd66)
        .setInteractive({ useHandCursor: true }),
    );
    const buttonText = track(
      this.add
        .text(button.x, button.y, '', {
          fontFamily: UI_CONFIG.FONT_FAMILY,
          fontSize: '14px',
          color: UI_CONFIG.ACCENT_COLOR,
        })
        .setOrigin(0.5),
    );

    button.on('pointerdown', () => this.buy(upgrade));

    return () => {
      const rank = saveSystem.getRank(upgrade.id);
      const isMax = rank >= upgrade.maxRank;
      const cost = upgrade.baseCost * (rank + 1);
      const canBuy = !isMax && saveSystem.data.fans >= cost;

      rankText.setText(
        upgrade.maxRank === 1
          ? isMax
            ? '解放済み'
            : '未解放'
          : `Lv ${rank}/${upgrade.maxRank}`,
      );
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

  /** 所持ファンと現在のタブの全行の表示を更新する */
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

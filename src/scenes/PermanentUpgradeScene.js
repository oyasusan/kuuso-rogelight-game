import Phaser from 'phaser';
import { DEPTH, GAME, PERMA_CONFIG, UI_CONFIG } from '../constants.js';
import audioSystem from '../systems/AudioSystem.js';
import saveSystem from '../systems/SaveSystem.js';
import { enableVerticalScroll } from '../ui/scrollHelper.js';
import { createBackButton } from '../ui/BackButton.js';

/** 行の見た目（狭い画面では ROW_NARROW を使い、ランク表示とボタンを 2 段目に落とす） */
const ROW = {
  MAX_WIDTH: 760,
  HEIGHT: 56,
  GAP: 8,
  TOP_Y: 150,
  COLOR: 0x1a1a33,
  BUTTON_COLOR: 0x2d2d55,
  BUTTON_DISABLED: 0x22222e,
};
const ROW_NARROW_HEIGHT = 84;
/** 横幅がこれ未満なら「狭い画面」向けレイアウト（2 段組の行）に切り替える */
const NARROW_THRESHOLD = 560;

/** タブの定義。category は PERMA_CONFIG.UPGRADES の各項目の category と対応する */
const TABS = [
  { category: 'stat', label: 'ステータス強化', shortLabel: 'ステータス' },
  { category: 'character', label: 'キャラクター解放', shortLabel: 'キャラ' },
  { category: 'stage', label: '会場解放', shortLabel: '会場' },
];

/**
 * 永久強化画面。
 * ライブで獲得したファンを消費して、ラン間で持ち越す強化・キャラクター/会場の
 * 解放を購入する。項目数が多いため、カテゴリごとにタブで切り替えて表示する。
 * リザルトの後、およびタイトルから遷移する。
 *
 * 横幅に応じて行の中身を横並び（PC）/ 2 段組（スマホ縦画面）に切り替える
 * レスポンシブ構成。固定座標ではなく this.scale.width/height を毎回読む。
 */
export default class PermanentUpgradeScene extends Phaser.Scene {
  constructor() {
    super('PermanentUpgradeScene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    this.centerX = centerX;
    this.rowWidth = Math.min(ROW.MAX_WIDTH, width - 40);
    this.isNarrow = this.rowWidth < NARROW_THRESHOLD;
    this.activeCategory = TABS[0].category;
    /** 現在のタブで表示中の行（タブ切り替え時にまとめて破棄する） */
    this.rowObjects = [];
    this.rowRefreshers = [];

    this.cameras.main.setBackgroundColor(GAME.BACKGROUND_COLOR);

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

    const tabGap = 8;
    const tabWidth = Math.min(190, Math.floor((this.rowWidth - tabGap * 2) / 3));
    const tabPitch = tabWidth + tabGap;
    this.tabButtons = TABS.map((tab, index) =>
      this.createTabButton(
        tab,
        centerX + (index - 1) * tabPitch,
        100,
        tabWidth,
      ),
    );

    this.showCategory(this.activeCategory);

    // 戻る導線は画面下端に固定表示する（スクロールしても常に押せるように）
    const footerHeight = 44;
    const footerY = height - footerHeight / 2;
    this.add
      .rectangle(centerX, footerY, width, footerHeight, 0x06060e, 0.85)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI);
    createBackButton(this, {
      x: centerX,
      y: footerY,
      onClick: () => this.backToTitle(),
    });
    this.input.keyboard.once('keydown-SPACE', () => this.backToTitle());

    // 画面に収まらない場合はドラッグ／ホイールでスクロールできるようにする
    // （タブの中で最も行数が多いカテゴリを基準に、固定フッターの余白も足す）
    const rowHeight = this.isNarrow ? ROW_NARROW_HEIGHT : ROW.HEIGHT;
    const rowPitch = rowHeight + ROW.GAP;
    const maxRowCount = Math.max(
      ...TABS.map(
        (tab) =>
          PERMA_CONFIG.UPGRADES.filter((u) => u.category === tab.category)
            .length,
      ),
    );
    const contentBottom =
      ROW.TOP_Y + (maxRowCount - 1) * rowPitch + rowHeight / 2 + 20;
    enableVerticalScroll(this, contentBottom + footerHeight + 10);
  }

  /** タブボタンを 1 つ作る */
  createTabButton(tab, x, y, width) {
    const rect = this.add
      .rectangle(x, y, width, 34, 0x1a1a33)
      .setStrokeStyle(1, 0x444466)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(x, y, this.isNarrow ? tab.shortLabel : tab.label, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: this.isNarrow ? '13px' : '15px',
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

    const rowHeight = this.isNarrow ? ROW_NARROW_HEIGHT : ROW.HEIGHT;
    const rowPitch = rowHeight + ROW.GAP;
    const upgrades = PERMA_CONFIG.UPGRADES.filter(
      (u) => u.category === category,
    );
    this.rowRefreshers = upgrades.map((upgrade, index) =>
      this.createRow(upgrade, this.centerX, ROW.TOP_Y + index * rowPitch),
    );
    this.refresh();
  }

  /**
   * 強化 1 種類分の行（説明＋購入ボタン）を作る。
   * 横幅が狭い場合は名前/説明を上段、ランクとボタンを下段に分ける 2 段組にする。
   * @returns {Function} 表示更新関数
   */
  createRow(upgrade, centerX, y) {
    const track = (object) => {
      this.rowObjects.push(object);
      return object;
    };
    const { rowWidth, isNarrow } = this;
    const rowHeight = isNarrow ? ROW_NARROW_HEIGHT : ROW.HEIGHT;
    const left = centerX - rowWidth / 2;
    const right = centerX + rowWidth / 2;

    track(
      this.add
        .rectangle(centerX, y, rowWidth, rowHeight, ROW.COLOR)
        .setStrokeStyle(1, 0x444466),
    );

    track(
      this.add.text(left + 16, y - (isNarrow ? 34 : 17), upgrade.name, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
      }),
    );
    track(
      this.add.text(left + 16, y - (isNarrow ? 14 : -4), upgrade.description, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '11px',
        color: '#bbbbdd',
        wordWrap: isNarrow ? { width: rowWidth - 32 } : undefined,
      }),
    );

    const rankText = track(
      isNarrow
        ? this.add
            .text(left + 16, y + 26, '', {
              fontFamily: UI_CONFIG.FONT_FAMILY,
              fontSize: '13px',
              color: '#ccccee',
            })
            .setOrigin(0, 0.5)
        : this.add
            .text(centerX + 140, y, '', {
              fontFamily: UI_CONFIG.FONT_FAMILY,
              fontSize: '14px',
              color: '#ccccee',
            })
            .setOrigin(0.5),
    );

    const buttonWidth = isNarrow ? 108 : 120;
    const buttonX = isNarrow ? right - buttonWidth / 2 - 10 : right - 75;
    const buttonY = isNarrow ? y + 26 : y;
    const button = track(
      this.add
        .rectangle(buttonX, buttonY, buttonWidth, 34, ROW.BUTTON_COLOR)
        .setStrokeStyle(1, 0xffdd66)
        .setInteractive({ useHandCursor: true }),
    );
    const buttonText = track(
      this.add
        .text(button.x, button.y, '', {
          fontFamily: UI_CONFIG.FONT_FAMILY,
          fontSize: '13px',
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

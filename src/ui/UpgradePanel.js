import { DEPTH, UI_CONFIG, UPGRADE_CONFIG } from '../constants.js';

/** カードの見た目（基準値。横幅が足りない画面では縦積みに切り替える） */
const CARD = {
  WIDTH: 260,
  HEIGHT: 190,
  GAP: 30,
  COLOR: 0x1a1a33,
  COLOR_HOVER: 0x2d2d55,
  BORDER_COLOR: 0xffdd66,
};
/** 縦積み時のカードサイズ */
const CARD_STACKED = { HEIGHT: 108, GAP: 12 };

/**
 * レベルアップ時のアップグレード選択パネル（3 択）。
 * 表示中はゲームを停止する（停止処理は GameScene が行う）。
 * クリックまたは数字キー（1〜3）で選択する。
 *
 * 3 枚横並びで収まらない横幅（スマホ縦画面など）では自動的に縦積みにする。
 */
export default class UpgradePanel {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    /** パネルを構成する GameObject（close 時にまとめて破棄） */
    this.objects = [];
    this.keyHandlers = [];
  }

  /**
   * 選択肢を表示する。
   * @param {Array<{label: string, description: string}>} choices
   * @param {(choice: object) => void} onSelect 選択時のコールバック
   */
  open(choices, onSelect) {
    this.close();
    this.isOpen = true;

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // 背景を暗くする（ワールドがスクロールしても画面に固定表示する）
    const overlay = this.scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.65)
      .setOrigin(0)
      .setDepth(DEPTH.OVERLAY)
      .setScrollFactor(0);
    this.objects.push(overlay);

    const n = choices.length;
    const stack = width - 40 < n * CARD.WIDTH + (n - 1) * CARD.GAP;
    const cardWidth = stack ? Math.min(CARD.WIDTH, width - 40) : CARD.WIDTH;
    const cardHeight = stack ? CARD_STACKED.HEIGHT : CARD.HEIGHT;
    const gap = stack ? CARD_STACKED.GAP : CARD.GAP;

    const titleY = stack ? 46 : centerY - 160;
    const title = this.scene.add
      .text(centerX, titleY, 'LEVEL UP! 強化を選ぼう', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: stack ? '22px' : '32px',
        color: UI_CONFIG.ACCENT_COLOR,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.OVERLAY)
      .setScrollFactor(0);
    this.objects.push(title);

    if (stack) {
      const totalHeight = n * cardHeight + (n - 1) * gap;
      const startY = Math.max(titleY + 40, centerY - totalHeight / 2);
      choices.forEach((choice, index) => {
        const y = startY + index * (cardHeight + gap) + cardHeight / 2;
        this.createCard(centerX, y, index, choice, onSelect, cardWidth, cardHeight);
      });
    } else {
      const totalWidth = n * cardWidth + (n - 1) * gap;
      const startX = centerX - totalWidth / 2 + cardWidth / 2;
      choices.forEach((choice, index) => {
        const x = startX + index * (cardWidth + gap);
        this.createCard(x, centerY + 20, index, choice, onSelect, cardWidth, cardHeight);
      });
    }

    // 数字キーでも選択できるようにする
    const keyNames = ['ONE', 'TWO', 'THREE'];
    choices.forEach((choice, index) => {
      if (index >= UPGRADE_CONFIG.CHOICES) {
        return;
      }
      const eventName = `keydown-${keyNames[index]}`;
      const handler = () => this.select(choice, onSelect);
      this.scene.input.keyboard.on(eventName, handler);
      this.keyHandlers.push({ eventName, handler });
    });
  }

  /** カード 1 枚を生成する */
  createCard(x, y, index, choice, onSelect, cardWidth = CARD.WIDTH, cardHeight = CARD.HEIGHT) {
    const card = this.scene.add
      .rectangle(x, y, cardWidth, cardHeight, CARD.COLOR)
      .setStrokeStyle(2, CARD.BORDER_COLOR)
      .setDepth(DEPTH.OVERLAY)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    card.on('pointerover', () => card.setFillStyle(CARD.COLOR_HOVER));
    card.on('pointerout', () => card.setFillStyle(CARD.COLOR));
    card.on('pointerdown', () => this.select(choice, onSelect));

    const keyHint = this.scene.add
      .text(x, y - cardHeight / 2 + 18, `[${index + 1}]`, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '14px',
        color: '#8888aa',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.OVERLAY)
      .setScrollFactor(0);

    const label = this.scene.add
      .text(x, y - cardHeight / 2 + 44, choice.label, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: cardHeight < CARD.HEIGHT ? '18px' : '22px',
        color: UI_CONFIG.TEXT_COLOR,
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: cardWidth - 30 },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.OVERLAY)
      .setScrollFactor(0);

    const description = this.scene.add
      .text(x, y + cardHeight / 2 - 34, choice.description, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: cardHeight < CARD.HEIGHT ? '12px' : '14px',
        color: '#bbbbdd',
        align: 'center',
        lineSpacing: 5,
        wordWrap: { width: cardWidth - 30 },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.OVERLAY)
      .setScrollFactor(0);

    this.objects.push(card, keyHint, label, description);
  }

  /** 選択を確定してパネルを閉じる */
  select(choice, onSelect) {
    if (!this.isOpen) {
      return;
    }
    this.close();
    onSelect(choice);
  }

  /** パネルを閉じて後片付けする */
  close() {
    this.isOpen = false;
    for (const { eventName, handler } of this.keyHandlers) {
      this.scene.input.keyboard.off(eventName, handler);
    }
    this.keyHandlers = [];
    for (const object of this.objects) {
      object.destroy();
    }
    this.objects = [];
  }
}

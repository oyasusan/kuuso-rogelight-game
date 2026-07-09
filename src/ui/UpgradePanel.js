import { DEPTH, GAME, UI_CONFIG, UPGRADE_CONFIG } from '../constants.js';

/** カードの見た目 */
const CARD = {
  WIDTH: 260,
  HEIGHT: 190,
  GAP: 30,
  COLOR: 0x1a1a33,
  COLOR_HOVER: 0x2d2d55,
  BORDER_COLOR: 0xffdd66,
};

/**
 * レベルアップ時のアップグレード選択パネル（3 択）。
 * 表示中はゲームを停止する（停止処理は GameScene が行う）。
 * クリックまたは数字キー（1〜3）で選択する。
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

    const centerX = GAME.WIDTH / 2;
    const centerY = GAME.HEIGHT / 2;

    // 背景を暗くする
    const overlay = this.scene.add
      .rectangle(0, 0, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.65)
      .setOrigin(0)
      .setDepth(DEPTH.OVERLAY);
    this.objects.push(overlay);

    const title = this.scene.add
      .text(centerX, centerY - 160, 'LEVEL UP! 強化を選ぼう', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '32px',
        color: UI_CONFIG.ACCENT_COLOR,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.OVERLAY);
    this.objects.push(title);

    const totalWidth =
      choices.length * CARD.WIDTH + (choices.length - 1) * CARD.GAP;
    const startX = centerX - totalWidth / 2 + CARD.WIDTH / 2;

    choices.forEach((choice, index) => {
      const x = startX + index * (CARD.WIDTH + CARD.GAP);
      this.createCard(x, centerY + 20, index, choice, onSelect);
    });

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
  createCard(x, y, index, choice, onSelect) {
    const card = this.scene.add
      .rectangle(x, y, CARD.WIDTH, CARD.HEIGHT, CARD.COLOR)
      .setStrokeStyle(2, CARD.BORDER_COLOR)
      .setDepth(DEPTH.OVERLAY)
      .setInteractive({ useHandCursor: true });

    card.on('pointerover', () => card.setFillStyle(CARD.COLOR_HOVER));
    card.on('pointerout', () => card.setFillStyle(CARD.COLOR));
    card.on('pointerdown', () => this.select(choice, onSelect));

    const keyHint = this.scene.add
      .text(x, y - CARD.HEIGHT / 2 + 24, `[${index + 1}]`, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color: '#8888aa',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.OVERLAY);

    const label = this.scene.add
      .text(x, y - 25, choice.label, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '22px',
        color: UI_CONFIG.TEXT_COLOR,
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: CARD.WIDTH - 30 },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.OVERLAY);

    const description = this.scene.add
      .text(x, y + 45, choice.description, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '14px',
        color: '#bbbbdd',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: CARD.WIDTH - 30 },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.OVERLAY);

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

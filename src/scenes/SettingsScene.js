import Phaser from 'phaser';
import { DEPTH, GAME, UI_CONFIG } from '../constants.js';
import audioSystem from '../systems/AudioSystem.js';
import saveSystem from '../systems/SaveSystem.js';

/** ボタンの見た目 */
const BUTTON = {
  COLOR: 0x1a1a33,
  BORDER: 0xffdd66,
  DANGER_BORDER: 0xff5566,
};

/**
 * 設定画面。
 * 現状は永久強化（所持ファン・全ランク）のリセットのみを提供する。
 * 取り消せない操作のため、実行前に確認ダイアログを挟む。
 *
 * 固定座標ではなく this.scale.width/height から組み立てるレスポンシブ構成。
 */
export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super('SettingsScene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    this.width = width;
    this.height = height;
    const centerX = width / 2;
    const boxWidth = Math.min(640, width - 40);

    this.cameras.main.setBackgroundColor(GAME.BACKGROUND_COLOR);

    this.add
      .text(centerX, 50, '設定', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '34px',
        color: '#ff99cc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .rectangle(centerX, 210, boxWidth, 190, BUTTON.COLOR)
      .setStrokeStyle(1, 0x444466);

    const boxLeft = centerX - boxWidth / 2;
    this.add.text(boxLeft + 20, 142, '永久強化をリセット', {
      fontFamily: UI_CONFIG.FONT_FAMILY,
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.add.text(
      boxLeft + 20,
      172,
      '所持ファンと、購入した永久強化のランク・解放をすべて 0 に戻します。\nキャラクター・ステージの選択も初期状態（すず / 小箱）に戻ります。この操作は取り消せません。',
      {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '14px',
        color: '#bbbbdd',
        lineSpacing: 6,
        wordWrap: { width: boxWidth - 40 },
      },
    );

    this.createButton(centerX, 310, 220, 44, 'リセットする', BUTTON.DANGER_BORDER, () =>
      this.confirmReset(),
    );

    const backText = this.add
      .text(centerX, height - 32, 'タップ / スペースキーでタイトルへ', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '18px',
        color: '#aaaacc',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    backText.on('pointerdown', () => this.backToTitle());
    this.spaceKeyHandler = () => this.backToTitle();
    this.input.keyboard.on('keydown-SPACE', this.spaceKeyHandler);
  }

  /** シンプルな矩形ボタンを作る */
  createButton(x, y, width, height, label, borderColor, onClick) {
    const rect = this.add
      .rectangle(x, y, width, height, BUTTON.COLOR)
      .setStrokeStyle(2, borderColor)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '17px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    rect.on('pointerdown', () => {
      audioSystem.unlock();
      audioSystem.playSelect();
      onClick();
    });
    return rect;
  }

  /** 取り消せない操作のため、実行前に確認ダイアログを挟む */
  confirmReset() {
    // 確認中はタイトルへ戻るショートカットを無効化する（誤操作防止）
    this.input.keyboard.off('keydown-SPACE', this.spaceKeyHandler);

    const { width, height } = this;
    const overlay = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0)
      .setDepth(DEPTH.OVERLAY)
      .setInteractive();

    const centerX = width / 2;
    const centerY = height / 2;

    const objects = [overlay];
    objects.push(
      this.add
        .text(centerX, centerY - 60, '本当に永久強化をリセットしますか？', {
          fontFamily: UI_CONFIG.FONT_FAMILY,
          fontSize: '22px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.OVERLAY),
    );
    objects.push(
      this.add
        .text(centerX, centerY - 20, 'ファン・全ランク・解放状況が 0 に戻ります（取り消せません）', {
          fontFamily: UI_CONFIG.FONT_FAMILY,
          fontSize: '14px',
          color: '#ffaaaa',
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.OVERLAY),
    );

    const cleanup = () => {
      for (const object of objects) {
        object.destroy();
      }
      this.input.keyboard.on('keydown-SPACE', this.spaceKeyHandler);
    };

    const yesButton = this.add
      .rectangle(centerX - 90, centerY + 40, 150, 44, BUTTON.COLOR)
      .setStrokeStyle(2, BUTTON.DANGER_BORDER)
      .setDepth(DEPTH.OVERLAY)
      .setInteractive({ useHandCursor: true });
    const yesLabel = this.add
      .text(yesButton.x, yesButton.y, 'リセットする', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color: '#ff8888',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.OVERLAY);
    yesButton.on('pointerdown', () => {
      saveSystem.resetPermanent();
      audioSystem.playAntiContact();
      cleanup();
      this.showToast('永久強化をリセットしました');
    });
    objects.push(yesButton, yesLabel);

    const cancelButton = this.add
      .rectangle(centerX + 90, centerY + 40, 150, 44, BUTTON.COLOR)
      .setStrokeStyle(2, 0x666688)
      .setDepth(DEPTH.OVERLAY)
      .setInteractive({ useHandCursor: true });
    const cancelLabel = this.add
      .text(cancelButton.x, cancelButton.y, 'キャンセル', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color: '#ccccee',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.OVERLAY);
    cancelButton.on('pointerdown', () => {
      audioSystem.playSelect();
      cleanup();
    });
    objects.push(cancelButton, cancelLabel);
  }

  /** 画面下部に短く表示して消えるメッセージ */
  showToast(message) {
    const text = this.add
      .text(this.width / 2, this.height - 80, message, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color: UI_CONFIG.ACCENT_COLOR,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.OVERLAY);

    this.tweens.add({
      targets: text,
      alpha: 0,
      duration: 1800,
      delay: 800,
      onComplete: () => text.destroy(),
    });
  }

  backToTitle() {
    audioSystem.playSelect();
    this.scene.start('HomeScene');
  }
}

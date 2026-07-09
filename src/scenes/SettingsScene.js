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
 */
export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super('SettingsScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(GAME.BACKGROUND_COLOR);
    const centerX = GAME.WIDTH / 2;

    this.add
      .text(centerX, 60, '設定', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '34px',
        color: '#ff99cc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .rectangle(centerX, 220, 640, 140, BUTTON.COLOR)
      .setStrokeStyle(1, 0x444466);

    this.add.text(centerX - 290, 172, '永久強化をリセット', {
      fontFamily: UI_CONFIG.FONT_FAMILY,
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.add.text(
      centerX - 290,
      202,
      '所持ファンと、購入した永久強化のランクをすべて 0 に戻します。\nキャラクター・ステージの選択は保持されます。この操作は取り消せません。',
      {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '14px',
        color: '#bbbbdd',
        lineSpacing: 6,
      },
    );

    this.createButton(centerX, 268, 220, 44, 'リセットする', BUTTON.DANGER_BORDER, () =>
      this.confirmReset(),
    );

    const backText = this.add
      .text(centerX, GAME.HEIGHT - 32, 'スペースキー / クリックでタイトルへ', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '18px',
        color: '#aaaacc',
      })
      .setOrigin(0.5)
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

    const overlay = this.add
      .rectangle(0, 0, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.7)
      .setOrigin(0)
      .setDepth(DEPTH.OVERLAY)
      .setInteractive();

    const centerX = GAME.WIDTH / 2;
    const centerY = GAME.HEIGHT / 2;

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
        .text(centerX, centerY - 20, 'ファンと全ランクが 0 に戻ります（取り消せません）', {
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
      .text(GAME.WIDTH / 2, GAME.HEIGHT - 80, message, {
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

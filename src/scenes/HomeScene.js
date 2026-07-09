import Phaser from 'phaser';
import { CHARACTERS, GAME, STAGES, UI_CONFIG } from '../constants.js';
import audioSystem from '../systems/AudioSystem.js';
import saveSystem from '../systems/SaveSystem.js';

/** 選択カードの見た目 */
const CARD = {
  COLOR: 0x1a1a33,
  COLOR_SELECTED: 0x2d2d55,
  BORDER: 0x444466,
  BORDER_SELECTED: 0xffdd66,
};

/**
 * タイトル画面。
 * キャラクターとステージを選択してライブを開始する。永久強化画面へも遷移できる。
 */
export default class HomeScene extends Phaser.Scene {
  constructor() {
    super('HomeScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(GAME.BACKGROUND_COLOR);
    const centerX = GAME.WIDTH / 2;

    this.add
      .text(centerX, 48, '100秒アイドルライブ', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '40px',
        color: '#ff99cc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 88, '100秒で最高のライブを完成させよう（移動: WASD / 矢印キー）', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '15px',
        color: '#aaaacc',
      })
      .setOrigin(0.5);

    // 所持ファン数と永久強化への導線（右上）
    this.add
      .text(GAME.WIDTH - 24, 30, `ファン ${saveSystem.data.fans} 人`, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color: UI_CONFIG.ACCENT_COLOR,
      })
      .setOrigin(1, 0.5);
    this.createButton(GAME.WIDTH - 84, 62, 130, 30, '永久強化', () => {
      audioSystem.unlock();
      audioSystem.playSelect();
      this.scene.start('PermanentUpgradeScene');
    });

    // --- キャラクター選択 ---
    this.add
      .text(centerX, 128, 'キャラクター', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    this.characterCards = CHARACTERS.map((character, index) => {
      const x = centerX + (index - 1) * 230;
      return this.createSelectCard({
        x,
        y: 205,
        width: 210,
        height: 120,
        title: character.name,
        titleColor: character.color,
        description: character.description,
        isSelected: () => saveSystem.data.characterId === character.id,
        onClick: () => {
          saveSystem.data.characterId = character.id;
          saveSystem.persist();
        },
      });
    });

    // --- ステージ選択 ---
    this.add
      .text(centerX, 296, 'ステージ', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    this.stageCards = STAGES.map((stage, index) => {
      const x = centerX + (index - 0.5) * 250;
      return this.createSelectCard({
        x,
        y: 365,
        width: 230,
        height: 90,
        title: stage.name,
        titleColor: 0xffffff,
        description: stage.description,
        isSelected: () => saveSystem.data.stageId === stage.id,
        onClick: () => {
          saveSystem.data.stageId = stage.id;
          saveSystem.persist();
        },
      });
    });

    this.refreshCards();

    // --- スタート ---
    const startText = this.add
      .text(centerX, 480, 'スペースキーでライブ開始！', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '26px',
        color: UI_CONFIG.ACCENT_COLOR,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    startText.on('pointerdown', () => this.startGame());

    this.tweens.add({
      targets: startText,
      alpha: 0.35,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.on('keydown-SPACE', () => this.startGame());
  }

  /**
   * 選択カードを 1 枚作る。
   * @returns {{ refresh: Function }} 選択状態の再描画関数を持つオブジェクト
   */
  createSelectCard({ x, y, width, height, title, titleColor, description, isSelected, onClick }) {
    const rect = this.add
      .rectangle(x, y, width, height, CARD.COLOR)
      .setStrokeStyle(2, CARD.BORDER)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y - height / 2 + 24, title, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setTint(titleColor);

    this.add
      .text(x, y + 14, description, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '13px',
        color: '#bbbbdd',
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5);

    rect.on('pointerdown', () => {
      audioSystem.unlock();
      audioSystem.playSelect();
      onClick();
      this.refreshCards();
    });

    return {
      refresh: () => {
        const selected = isSelected();
        rect.setFillStyle(selected ? CARD.COLOR_SELECTED : CARD.COLOR);
        rect.setStrokeStyle(2, selected ? CARD.BORDER_SELECTED : CARD.BORDER);
      },
    };
  }

  /** すべてのカードの選択ハイライトを更新する */
  refreshCards() {
    for (const card of [...this.characterCards, ...this.stageCards]) {
      card.refresh();
    }
  }

  /** シンプルな矩形ボタンを作る */
  createButton(x, y, width, height, label, onClick) {
    const rect = this.add
      .rectangle(x, y, width, height, CARD.COLOR)
      .setStrokeStyle(1, CARD.BORDER_SELECTED)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '14px',
        color: UI_CONFIG.ACCENT_COLOR,
      })
      .setOrigin(0.5);
    rect.on('pointerdown', onClick);
    return rect;
  }

  startGame() {
    // 最初のユーザー操作のタイミングで AudioContext を生成する
    audioSystem.unlock();
    audioSystem.playStart();
    this.scene.start('GameScene');
  }
}

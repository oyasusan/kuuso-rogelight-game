import Phaser from 'phaser';
import { CHARACTERS, GAME, PERMA_CONFIG, STAGES, UI_CONFIG } from '../constants.js';
import audioSystem from '../systems/AudioSystem.js';
import saveSystem from '../systems/SaveSystem.js';
import { isCharacterUnlocked, isStageUnlocked } from '../systems/RunModifiers.js';

/** 選択カードの見た目 */
const CARD = {
  COLOR: 0x1a1a33,
  COLOR_SELECTED: 0x2d2d55,
  BORDER: 0x444466,
  BORDER_SELECTED: 0xffdd66,
  COLOR_LOCKED: 0x131320,
  BORDER_LOCKED: 0x333344,
};

/** キャラクターカードのグリッド設定（7 人を 4 列×2 行で並べる） */
const CHARACTER_GRID = {
  COLS: 4,
  CARD_WIDTH: 140,
  CARD_HEIGHT: 128,
  COL_PITCH: 148,
  ROW_PITCH: 136,
  TOP_Y: 156,
};

/** ステージカードの見た目（5 会場を横一列で並べる） */
const STAGE_CARD = {
  WIDTH: 172,
  HEIGHT: 78,
  PITCH: 180,
  Y: 416,
};

/** 永久強化の解放コストを取得する（未定義なら null） */
function findUnlockUpgrade(upgradeId) {
  return upgradeId
    ? PERMA_CONFIG.UPGRADES.find((u) => u.id === upgradeId)
    : null;
}

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
      .text(centerX, 28, '100秒アイドルライブ', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '30px',
        color: '#ff99cc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 56, '100秒で最高のライブを完成させよう（移動: WASD / 矢印キー）', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '13px',
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
    this.createButton(GAME.WIDTH - 84, 98, 130, 30, '設定', () => {
      audioSystem.unlock();
      audioSystem.playSelect();
      this.scene.start('SettingsScene');
    });

    // --- キャラクター選択（4列×2行のグリッド。行ごとに中央寄せする） ---
    this.add
      .text(centerX, 82, 'キャラクター', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    this.characterCards = CHARACTERS.map((character, index) => {
      const { COLS, CARD_WIDTH, CARD_HEIGHT, COL_PITCH, ROW_PITCH, TOP_Y } =
        CHARACTER_GRID;
      const row = Math.floor(index / COLS);
      const col = index % COLS;
      const itemsInRow = Math.min(COLS, CHARACTERS.length - row * COLS);
      const x = centerX + (col - (itemsInRow - 1) / 2) * COL_PITCH;
      const y = TOP_Y + row * ROW_PITCH;
      const unlocked = isCharacterUnlocked(character);
      const unlockUpgrade = findUnlockUpgrade(character.unlockUpgradeId);
      return this.createSelectCard({
        x,
        y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        title: character.name,
        titleColor: character.color,
        description: character.description,
        descriptionFontSize: '12px',
        locked: !unlocked,
        lockHint: unlockUpgrade
          ? `🔒 永久強化で解放\n(${unlockUpgrade.baseCost}ファン)`
          : '🔒 未解放',
        isSelected: () => saveSystem.data.characterId === character.id,
        onClick: () => {
          saveSystem.data.characterId = character.id;
          saveSystem.persist();
        },
      });
    });

    // --- ステージ選択（5 会場を横一列で並べる） ---
    this.add
      .text(centerX, 368, 'ステージ', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color: '#8888aa',
      })
      .setOrigin(0.5);

    this.stageCards = STAGES.map((stage, index) => {
      const x =
        centerX + (index - (STAGES.length - 1) / 2) * STAGE_CARD.PITCH;
      const unlocked = isStageUnlocked(stage);
      const unlockUpgrade = findUnlockUpgrade(stage.unlockUpgradeId);
      return this.createSelectCard({
        x,
        y: STAGE_CARD.Y,
        width: STAGE_CARD.WIDTH,
        height: STAGE_CARD.HEIGHT,
        title: stage.name,
        titleColor: 0xffffff,
        description: stage.description,
        descriptionFontSize: '11px',
        locked: !unlocked,
        lockHint: unlockUpgrade
          ? `🔒 解放\n(${unlockUpgrade.baseCost}ファン)`
          : '🔒 未解放',
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
      .text(centerX, 496, 'スペースキーでライブ開始！', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '24px',
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
   * locked: true の場合は説明の代わりに lockHint を表示し、選択できないようにする。
   * @returns {{ refresh: Function }} 選択状態の再描画関数を持つオブジェクト
   */
  createSelectCard({
    x,
    y,
    width,
    height,
    title,
    titleColor,
    description,
    descriptionFontSize = '13px',
    locked = false,
    lockHint = '',
    isSelected,
    onClick,
  }) {
    const rect = this.add
      .rectangle(x, y, width, height, locked ? CARD.COLOR_LOCKED : CARD.COLOR)
      .setStrokeStyle(2, locked ? CARD.BORDER_LOCKED : CARD.BORDER);

    const titleText = this.add
      .text(x, y - height / 2 + 20, title, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    if (locked) {
      titleText.setColor('#555566');
    } else {
      titleText.setTint(titleColor);
    }

    this.add
      .text(x, y + 12, locked ? lockHint : description, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: descriptionFontSize,
        color: locked ? '#555566' : '#bbbbdd',
        align: 'center',
        lineSpacing: 3,
      })
      .setOrigin(0.5);

    if (locked) {
      return { refresh: () => {} };
    }

    rect.setInteractive({ useHandCursor: true });
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

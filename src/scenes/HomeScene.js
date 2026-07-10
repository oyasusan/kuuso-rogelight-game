import Phaser from 'phaser';
import { CHARACTERS, DEPTH, GAME, PERMA_CONFIG, STAGES, UI_CONFIG } from '../constants.js';
import audioSystem from '../systems/AudioSystem.js';
import saveSystem from '../systems/SaveSystem.js';
import { isCharacterUnlocked, isStageUnlocked } from '../systems/RunModifiers.js';
import { enableVerticalScroll } from '../ui/scrollHelper.js';

/** 選択カードの見た目 */
const CARD = {
  COLOR: 0x1a1a33,
  COLOR_SELECTED: 0x2d2d55,
  BORDER: 0x444466,
  BORDER_SELECTED: 0xffdd66,
  COLOR_LOCKED: 0x131320,
  BORDER_LOCKED: 0x333344,
};

/** キャラクターカードの基準サイズ（横幅が足りない画面では縮めて列数を確保する） */
const CHARACTER_CARD = { WIDTH: 140, HEIGHT: 124, COL_GAP: 8, ROW_GAP: 8 };
/** ステージカードの基準サイズ（説明は最大 3 行） */
const STAGE_CARD = { WIDTH: 172, HEIGHT: 88, COL_GAP: 8, ROW_GAP: 8 };

/** 永久強化の解放コストを取得する（未定義なら null） */
function findUnlockUpgrade(upgradeId) {
  return upgradeId
    ? PERMA_CONFIG.UPGRADES.find((u) => u.id === upgradeId)
    : null;
}

/**
 * タイトル画面。
 * キャラクターとステージを選択してライブを開始する。永久強化画面へも遷移できる。
 *
 * PC の横長画面・スマホの縦長画面のどちらでも読みやすいよう、固定座標ではなく
 * this.scale.width/height から毎回レイアウトを組み立てるレスポンシブ構成にしている。
 * カードのグリッドは横幅に収まる列数を動的に計算し、収まらなければカード自体を
 * 縮めてでも最低列数を確保する（縦に伸びすぎて画面外にはみ出さないようにするため）。
 */
export default class HomeScene extends Phaser.Scene {
  constructor() {
    super('HomeScene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const margin = 20;
    const availableWidth = width - margin * 2;
    // 右上にファン数・ボタンを固定表示できるだけの余白があるかどうか
    // （狭い画面ではタイトルと重なってしまうため、縦に並べる構成に切り替える）
    const hasTopRightSpace = width >= 700;

    this.cameras.main.setBackgroundColor(GAME.BACKGROUND_COLOR);

    let cursorY = 26;

    this.add
      .text(centerX, cursorY, '100秒ロマンス', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: hasTopRightSpace ? '30px' : '26px',
        color: '#ff99cc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    cursorY += hasTopRightSpace ? 30 : 26;

    this.add
      .text(centerX, cursorY, '移動: WASD / 矢印キー（スマホは画面下の仮想パッド）', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '12px',
        color: '#aaaacc',
        align: 'center',
      })
      .setOrigin(0.5);
    cursorY += 22;

    if (!saveSystem.isAvailable) {
      // プライベートブラウジング等で localStorage が使えない場合、
      // ファンや永久強化がリロードで消えることに気づけるよう明示する
      this.add
        .text(
          centerX,
          cursorY,
          '⚠ この環境ではファン・永久強化を保存できません（プライベートブラウジング等）',
          {
            fontFamily: UI_CONFIG.FONT_FAMILY,
            fontSize: '11px',
            color: '#ff8888',
            align: 'center',
          },
        )
        .setOrigin(0.5);
      cursorY += 18;
    }

    if (hasTopRightSpace) {
      // 横長: 右上に固定表示
      this.add
        .text(width - 24, 30, `ファン ${saveSystem.data.fans} 人`, {
          fontFamily: UI_CONFIG.FONT_FAMILY,
          fontSize: '16px',
          color: UI_CONFIG.ACCENT_COLOR,
        })
        .setOrigin(1, 0.5);
      this.createButton(width - 84, 62, 130, 30, '永久強化', () =>
        this.goTo('PermanentUpgradeScene'),
      );
      this.createButton(width - 84, 98, 130, 30, '設定', () =>
        this.goTo('SettingsScene'),
      );
    } else {
      // 縦長: タイトル下にファン数とボタンを横並びで挿入する
      cursorY += 8;
      this.add
        .text(centerX, cursorY, `ファン ${saveSystem.data.fans} 人`, {
          fontFamily: UI_CONFIG.FONT_FAMILY,
          fontSize: '14px',
          color: UI_CONFIG.ACCENT_COLOR,
        })
        .setOrigin(0.5);
      cursorY += 22;
      this.createButton(centerX - 72, cursorY, 130, 28, '永久強化', () =>
        this.goTo('PermanentUpgradeScene'),
      );
      this.createButton(centerX + 72, cursorY, 130, 28, '設定', () =>
        this.goTo('SettingsScene'),
      );
      cursorY += 22;
    }

    cursorY += 16;
    this.add
      .text(centerX, cursorY, 'キャラクター', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color: '#8888aa',
      })
      .setOrigin(0.5);
    cursorY += 12;

    // 横幅優先で列数を決め、収まらなければカード自体を縮めて最低列数を確保する
    const charCols = hasTopRightSpace ? 4 : Math.min(3, CHARACTERS.length);
    const charCardWidth = Math.min(
      CHARACTER_CARD.WIDTH,
      Math.floor((availableWidth - (charCols - 1) * CHARACTER_CARD.COL_GAP) / charCols),
    );
    const charColPitch = charCardWidth + CHARACTER_CARD.COL_GAP;
    const charRowPitch = CHARACTER_CARD.HEIGHT + CHARACTER_CARD.ROW_GAP;
    const charTopY = cursorY + CHARACTER_CARD.HEIGHT / 2;
    const charGrid = this.buildGrid(CHARACTERS, {
      centerX,
      cols: charCols,
      colPitch: charColPitch,
      rowPitch: charRowPitch,
      topY: charTopY,
      buildCard: (character, x, y) =>
        this.createCharacterCard(character, x, y, charCardWidth),
    });
    this.characterCards = charGrid.cards;
    cursorY = charGrid.bottomY + CHARACTER_CARD.HEIGHT / 2 + 22;

    this.add
      .text(centerX, cursorY, 'ステージ', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '16px',
        color: '#8888aa',
      })
      .setOrigin(0.5);
    cursorY += 12;

    const stageCols = hasTopRightSpace ? 5 : Math.min(2, STAGES.length);
    const stageCardWidth = Math.min(
      STAGE_CARD.WIDTH,
      Math.floor((availableWidth - (stageCols - 1) * STAGE_CARD.COL_GAP) / stageCols),
    );
    const stageColPitch = stageCardWidth + STAGE_CARD.COL_GAP;
    const stageRowPitch = STAGE_CARD.HEIGHT + STAGE_CARD.ROW_GAP;
    const stageTopY = cursorY + STAGE_CARD.HEIGHT / 2;
    const stageGrid = this.buildGrid(STAGES, {
      centerX,
      cols: stageCols,
      colPitch: stageColPitch,
      rowPitch: stageRowPitch,
      topY: stageTopY,
      buildCard: (stage, x, y) => this.createStageCard(stage, x, y, stageCardWidth),
    });
    this.stageCards = stageGrid.cards;
    cursorY = stageGrid.bottomY + STAGE_CARD.HEIGHT / 2 + 30;

    this.refreshCards();

    // スタートボタンは画面下端に固定表示する（スクロールしても常に押せるように）
    const footerHeight = hasTopRightSpace ? 64 : 52;
    const startY = height - footerHeight / 2;
    this.add
      .rectangle(centerX, startY, width, footerHeight, 0x06060e, 0.85)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI);
    const startText = this.add
      .text(centerX, startY, 'タップ / スペースキーでライブ開始！', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: hasTopRightSpace ? '24px' : '20px',
        color: UI_CONFIG.ACCENT_COLOR,
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI)
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

    // 画面に収まらない場合はドラッグ／ホイールでスクロールできるようにする
    // （固定フッターの下に隠れないよう、その高さぶんの余白を追加する）
    enableVerticalScroll(this, cursorY + footerHeight + 10);
  }

  /** 効果音を鳴らしつつ別シーンへ遷移する共通処理 */
  goTo(sceneKey) {
    audioSystem.unlock();
    audioSystem.playSelect();
    this.scene.start(sceneKey);
  }

  /**
   * 項目配列をグリッド状（行ごとに中央寄せ）に並べてカードを生成する。
   * @returns {{ cards: Array, bottomY: number }} bottomY は最終行カードの中心 y 座標
   */
  buildGrid(items, { centerX, cols, colPitch, rowPitch, topY, buildCard }) {
    const cards = items.map((item, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const itemsInRow = Math.min(cols, items.length - row * cols);
      const x = centerX + (col - (itemsInRow - 1) / 2) * colPitch;
      const y = topY + row * rowPitch;
      return buildCard(item, x, y);
    });
    const rows = Math.ceil(items.length / cols);
    const bottomY = topY + (rows - 1) * rowPitch;
    return { cards, bottomY };
  }

  /** キャラクター 1 人ぶんの選択カードを作る */
  createCharacterCard(character, x, y, width) {
    const unlocked = isCharacterUnlocked(character);
    const unlockUpgrade = findUnlockUpgrade(character.unlockUpgradeId);
    return this.createSelectCard({
      x,
      y,
      width,
      height: CHARACTER_CARD.HEIGHT,
      title: character.name,
      titleColor: character.color,
      description: character.description,
      descriptionFontSize: width < 130 ? '11px' : '12px',
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
  }

  /** ステージ 1 会場ぶんの選択カードを作る */
  createStageCard(stage, x, y, width) {
    const unlocked = isStageUnlocked(stage);
    const unlockUpgrade = findUnlockUpgrade(stage.unlockUpgradeId);
    return this.createSelectCard({
      x,
      y,
      width,
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

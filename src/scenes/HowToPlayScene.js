import Phaser from 'phaser';
import { DEPTH, GAME, UI_CONFIG } from '../constants.js';
import audioSystem from '../systems/AudioSystem.js';
import { enableVerticalScroll } from '../ui/scrollHelper.js';
import { createBackButton } from '../ui/BackButton.js';
import homeShot from '../assets/screenshots/home.png';
import gameplayShot from '../assets/screenshots/gameplay.png';
import levelupShot from '../assets/screenshots/levelup.png';
import resultShot from '../assets/screenshots/result.png';

/** 各ステップで使うスクリーンショットの説明内容 */
const STEPS = [
  {
    key: 'howto-home',
    title: '① キャラクターとステージを選ぶ',
    body:
      'タイトル画面でキャラクターとステージを選択。それぞれ個性やクセが異なるので好みの組み合わせを見つけよう。\n「永久強化」でファンを消費して新しいキャラ・ステージや強化を解放できる。',
  },
  {
    key: 'howto-gameplay',
    title: '② 移動して観客を盛り上げる',
    body:
      '操作は移動のみ（WASD / 矢印キー、スマホは画面をドラッグして仮想パッド操作）。パフォーマンスは自動で発動し、観客に近いほど Heat が上がりやすい。\n画面上部の HUD で残り時間・レベル・EXP・平均 Heat・熱狂人数を確認できる。アンチ（敵）に触れると Heat が下がり画面が揺れるので接触に注意。',
  },
  {
    key: 'howto-levelup',
    title: '③ レベルアップで強化を選ぶ',
    body:
      '観客が熱狂すると経験値オーブが出る。拾って経験値が貯まるとレベルアップし、3 択の強化から 1 つを選べる（タップ、または数字キー 1〜3）。',
  },
  {
    key: 'howto-result',
    title: `④ ${GAME.LIVE_DURATION_SEC} 秒後にリザルト`,
    body:
      '制限時間が来るとライブ終了。平均 Heat・熱狂人数・最大コンボからスコアが決まり、スコアに応じて「ファン」を獲得する。ファンは永久強化に使える。',
  },
];

/**
 * 遊び方説明画面。
 * 実際のプレイ画面のスクリーンショットを使い、操作方法とゲームの流れを順番に説明する。
 * 内容が画面に収まらない場合はドラッグ／ホイールで縦スクロールできる（enableVerticalScroll）。
 */
export default class HowToPlayScene extends Phaser.Scene {
  constructor() {
    super('HowToPlayScene');
  }

  preload() {
    this.load.image('howto-home', homeShot);
    this.load.image('howto-gameplay', gameplayShot);
    this.load.image('howto-levelup', levelupShot);
    this.load.image('howto-result', resultShot);
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;

    this.cameras.main.setBackgroundColor(GAME.BACKGROUND_COLOR);

    let cursorY = 44;

    this.add
      .text(centerX, cursorY, '遊び方', {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '32px',
        color: '#ff99cc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    cursorY += 30;

    this.add
      .text(
        centerX,
        cursorY,
        `${GAME.LIVE_DURATION_SEC} 秒間のライブで観客の Heat を上げて熱狂させよう！`,
        {
          fontFamily: UI_CONFIG.FONT_FAMILY,
          fontSize: '14px',
          color: '#bbbbdd',
          align: 'center',
        },
      )
      .setOrigin(0.5);
    cursorY += 40;

    const imageWidth = Math.min(300, width - 60);

    for (const step of STEPS) {
      cursorY = this.createStep(step, centerX, cursorY, imageWidth);
      cursorY += 36;
    }

    cursorY += 8;

    // 戻るボタンは画面下端に固定表示する（スクロールしても常に押せるように）
    const footerHeight = 60;
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
    this.input.keyboard.on('keydown-SPACE', () => this.backToTitle());

    enableVerticalScroll(this, cursorY + footerHeight + 10);
  }

  /**
   * 「タイトル・説明文・スクリーンショット」の 1 ステップぶんを積み上げて描画する。
   * @returns {number} 次の要素を置き始める y 座標
   */
  createStep(step, centerX, startY, imageWidth) {
    let y = startY;

    this.add
      .text(centerX, y, step.title, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '18px',
        color: '#ffdd66',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    y += 26;

    const texture = this.textures.get(step.key).getSourceImage();
    const imageHeight = imageWidth * (texture.height / texture.width);

    this.add
      .rectangle(centerX, y + imageHeight / 2, imageWidth + 8, imageHeight + 8)
      .setStrokeStyle(2, 0x444466);
    this.add
      .image(centerX, y + imageHeight / 2, step.key)
      .setDisplaySize(imageWidth, imageHeight);
    y += imageHeight + 18;

    const bodyText = this.add
      .text(centerX, y, step.body, {
        fontFamily: UI_CONFIG.FONT_FAMILY,
        fontSize: '13px',
        color: '#bbbbdd',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: Math.max(imageWidth, 260), useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);
    y += bodyText.height;

    return y;
  }

  backToTitle() {
    audioSystem.playSelect();
    this.scene.start('HomeScene');
  }
}

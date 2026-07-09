import Phaser from 'phaser';
import HomeScene from './scenes/HomeScene.js';
import GameScene from './scenes/GameScene.js';
import ResultScene from './scenes/ResultScene.js';
import PermanentUpgradeScene from './scenes/PermanentUpgradeScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import { GAME } from './constants.js';

/**
 * ゲームのエントリーポイント。
 * Scale.RESIZE により、キャンバスの論理サイズ自体を実際の画面サイズに合わせる
 * （PC の横長画面はもちろん、スマホの縦画面でも黒帯だらけにならないようにする）。
 * 各シーンは create() 時点の this.scale.width/height を見て、横長・縦長どちらでも
 * 読みやすいレイアウトを組む（詳細は各シーンのコメントを参照）。
 * ワールド（会場のマップサイズ）自体は画面サイズと無関係なので、この変更で
 * ゲームバランスには影響しない。
 */
const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: window.innerWidth || GAME.WIDTH,
  height: window.innerHeight || GAME.HEIGHT,
  backgroundColor: GAME.BACKGROUND_COLOR,
  // ドット絵をにじませない（カメラがスクロールする会場でも輪郭をくっきり保つ）
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
  },
  physics: {
    default: 'arcade',
  },
  scene: [HomeScene, GameScene, ResultScene, PermanentUpgradeScene, SettingsScene],
};

const game = new Phaser.Game(config);

// 画面回転時はキャンバスサイズを更新し、表示中のシーンを作り直してレイアウトを
// 組み直す（回転直後は innerWidth/innerHeight がまだ更新されていないことがある
// ため、少し待ってから読む）
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    game.scale.resize(window.innerWidth, window.innerHeight);
    for (const scene of game.scene.getScenes(true)) {
      // ライブ中（GameScene）はやり直しになってしまうため再構築の対象から外す。
      // HUD 等の位置が回転前のままになるが、進行が消えるよりはましなため
      if (scene.scene.key !== 'GameScene') {
        scene.scene.restart();
      }
    }
  }, 300);
});

import Phaser from 'phaser';
import HomeScene from './scenes/HomeScene.js';
import GameScene from './scenes/GameScene.js';
import ResultScene from './scenes/ResultScene.js';
import { GAME } from './constants.js';

/**
 * ゲームのエントリーポイント。
 * Scale.FIT により、スマホを含む様々な画面サイズに追従する。
 */
const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: GAME.BACKGROUND_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
  },
  scene: [HomeScene, GameScene, ResultScene],
};

new Phaser.Game(config);

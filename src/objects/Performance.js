import Phaser from 'phaser';
import { DEPTH, SONG_CONFIG } from '../constants.js';
import { NoteEffectPool } from './NoteEffect.js';

/**
 * パフォーマンスの基底クラス。
 * 攻撃ボタンは存在せず、GameScene のタイマーから自動で execute() が呼ばれる。
 * Phase2 でダンス・ファンサ・MC をこのクラスを継承して追加する。
 */
export class Performance {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('./Player.js').default} player
   * @param {import('../systems/HeatSystem.js').default} heatSystem
   */
  constructor(scene, player, heatSystem) {
    this.scene = scene;
    this.player = player;
    this.heatSystem = heatSystem;
  }

  /** パフォーマンスを発動する。サブクラスで実装する */
  execute() {
    throw new Error('Performance.execute() はサブクラスで実装してください');
  }
}

/**
 * 通常パフォーマンス「歌」。
 * 一定間隔で自動発動し、半径内の観客の Heat を上げる。
 * Phase2 では同じ半径内のアンチにダメージも与える。
 */
export class SongPerformance extends Performance {
  constructor(scene, player, heatSystem) {
    super(scene, player, heatSystem);

    /** 効果半径（レベルアップ強化で変更できるようプロパティ化） */
    this.radius = SONG_CONFIG.RADIUS;
    /** 与える Heat 量 */
    this.heatGain = SONG_CONFIG.HEAT_GAIN;

    this.notePool = new NoteEffectPool(scene);

    // 効果範囲を示すリング。歌うたびに広がって消える（使い回し）
    this.ring = scene.add
      .circle(0, 0, this.radius)
      .setStrokeStyle(2, 0xff99cc)
      .setDepth(DEPTH.EFFECT)
      .setVisible(false);
  }

  /** 歌を発動し、半径内の観客の Heat を上げる */
  execute() {
    const { x, y } = this.player;
    this.heatSystem.applyHeatInRadius(x, y, this.radius, this.heatGain);
    this.playEffect(x, y);
  }

  /** リングと音符のエフェクトを再生する */
  playEffect(x, y) {
    this.ring.setPosition(x, y);
    this.ring.setScale(0.3);
    this.ring.setAlpha(1);
    this.ring.setVisible(true);
    this.scene.tweens.add({
      targets: this.ring,
      scale: 1,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => this.ring.setVisible(false),
    });

    for (let i = 0; i < SONG_CONFIG.NOTES_PER_CAST; i += 1) {
      const offsetX = Phaser.Math.Between(-30, 30);
      const offsetY = Phaser.Math.Between(-30, 10);
      this.notePool.spawn(x + offsetX, y - 20 + offsetY);
    }
  }
}

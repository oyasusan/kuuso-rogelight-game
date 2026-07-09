import Phaser from 'phaser';
import { DEPTH, SONG_CONFIG } from '../constants.js';

/**
 * 歌パフォーマンスの音符エフェクト 1 個。
 * NoteEffectPool から取得して使う（直接 new しない）。
 */
export class NoteEffect extends Phaser.GameObjects.Text {
  constructor(scene) {
    super(scene, 0, 0, '♪', {
      fontSize: '20px',
      color: '#ffccee',
    });
    this.setDepth(DEPTH.EFFECT);
    this.setOrigin(0.5);
  }

  /**
   * 指定位置から浮かび上がって消えるアニメーションを再生する。
   * 終了後は自動で非アクティブに戻り、プールへ返却される。
   */
  play(x, y) {
    this.setPosition(x, y);
    this.setAlpha(1);
    this.setActive(true);
    this.setVisible(true);

    this.scene.tweens.add({
      targets: this,
      y: y - 40,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.setActive(false);
        this.setVisible(false);
      },
    });
  }
}

/**
 * 音符エフェクトのオブジェクトプール。
 * 毎回 new/destroy せず再利用して GC 負荷を抑える。
 */
export class NoteEffectPool {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.group = scene.add.group({
      classType: NoteEffect,
      maxSize: SONG_CONFIG.NOTE_POOL_SIZE,
    });
  }

  /** プールから 1 個取り出して指定位置で再生する */
  spawn(x, y) {
    const note = this.group.get();
    if (note) {
      note.play(x, y);
    }
  }
}

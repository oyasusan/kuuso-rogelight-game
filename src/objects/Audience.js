import Phaser from 'phaser';
import { AUDIENCE_CONFIG, DEPTH } from '../constants.js';

/** Mood（感情）の種類。現状は表示のみで将来の拡張用 */
export const MOOD = {
  NORMAL: 'normal',
  EXCITED: 'excited',
};

/**
 * 観客 1 人。
 * Heat（熱量）と Mood（感情）を持ち、Heat が最大に達すると熱狂状態になる。
 * Heat の増減は HeatSystem 経由で行うこと（倍率や熱狂判定を一元管理するため）。
 */
export default class Audience extends Phaser.GameObjects.Image {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'audience');
    scene.add.existing(this);
    this.setDepth(DEPTH.AUDIENCE);

    /** 熱量（0〜MAX_HEAT） */
    this.heat = AUDIENCE_CONFIG.INITIAL_HEAT;
    /** 感情（将来の拡張用） */
    this.mood = MOOD.NORMAL;
    /** 熱狂状態かどうか */
    this.isFrenzied = false;

    this.updateAppearance();
  }

  /** 熱狂状態へ移行する。演出として一度だけ弾むアニメーションを行う */
  enterFrenzy() {
    if (this.isFrenzied) {
      return;
    }
    this.isFrenzied = true;
    this.heat = AUDIENCE_CONFIG.MAX_HEAT;
    this.mood = MOOD.EXCITED;
    this.updateAppearance();

    this.scene.tweens.add({
      targets: this,
      scale: 1.5,
      duration: 120,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  /** Heat に応じて色を更新する */
  updateAppearance() {
    if (this.isFrenzied) {
      this.setTint(AUDIENCE_CONFIG.COLOR_FRENZY);
      return;
    }
    const cold = Phaser.Display.Color.ValueToColor(AUDIENCE_CONFIG.COLOR_COLD);
    const hot = Phaser.Display.Color.ValueToColor(AUDIENCE_CONFIG.COLOR_HOT);
    const blended = Phaser.Display.Color.Interpolate.ColorWithColor(
      cold,
      hot,
      AUDIENCE_CONFIG.MAX_HEAT,
      this.heat,
    );
    this.setTint(Phaser.Display.Color.GetColor(blended.r, blended.g, blended.b));
  }
}

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
   * @param {number} [initialHeat] 初期 Heat（永久強化で上がる）
   */
  constructor(scene, x, y, initialHeat = AUDIENCE_CONFIG.INITIAL_HEAT) {
    super(scene, x, y, 'audience');
    scene.add.existing(this);
    this.setDepth(DEPTH.AUDIENCE);

    /** 熱量（0〜MAX_HEAT） */
    this.heat = initialHeat;
    /** 感情（将来の拡張用） */
    this.mood = MOOD.NORMAL;
    /** 熱狂状態かどうか */
    this.isFrenzied = false;

    /** モーションの基準位置（揺れ・ジャンプはここからのオフセット） */
    this.baseX = x;
    this.baseY = y;
    /** 個体ごとに揺れのタイミングをずらす位相 */
    this.motionPhase = Math.random() * Math.PI * 2;

    this.updateAppearance();
  }

  /**
   * Heat に応じたモーション。毎フレーム呼ぶ。
   * 冷めているとほぼ静止、温まると揺れが大きく速くなり、熱狂するとジャンプする。
   * @param {number} timeMs シーンの経過時間（ミリ秒）
   */
  updateMotion(timeMs) {
    const { MOTION, MAX_HEAT } = AUDIENCE_CONFIG;

    if (this.isFrenzied) {
      const jump = Math.abs(Math.sin(timeMs * MOTION.JUMP_FREQ + this.motionPhase));
      this.y = this.baseY - jump * MOTION.JUMP_HEIGHT;
      this.x = this.baseX;
      return;
    }

    const intensity = this.heat / MAX_HEAT; // 0〜1
    const swayFreq = MOTION.SWAY_BASE_FREQ + intensity * MOTION.SWAY_HEAT_FREQ;
    const swayAmp = MOTION.SWAY_BASE_AMP + intensity * MOTION.SWAY_HEAT_AMP;
    this.y = this.baseY + Math.sin(timeMs * swayFreq + this.motionPhase) * swayAmp;
    this.x =
      this.baseX +
      Math.sin(timeMs * MOTION.SWAY_BASE_FREQ * 0.7 + this.motionPhase) *
        intensity *
        2;
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

  /**
   * 熱狂状態を解除する。アンチのプレイヤー接触時のペナルティとして使う。
   * 解除後は再び温め直さないと熱狂に戻らない。
   * @param {number} newHeat 解除後の Heat
   */
  exitFrenzy(newHeat) {
    if (!this.isFrenzied) {
      return;
    }
    this.isFrenzied = false;
    this.mood = MOOD.NORMAL;
    this.heat = Phaser.Math.Clamp(newHeat, 0, AUDIENCE_CONFIG.MAX_HEAT);
    this.updateAppearance();

    this.scene.tweens.add({
      targets: this,
      scale: 0.7,
      duration: 150,
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

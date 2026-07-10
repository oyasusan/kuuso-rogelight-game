import Phaser from 'phaser';
import { DEPTH, JOYSTICK_CONFIG } from '../constants.js';

/**
 * スマホ等タッチデバイス向けの仮想パッド（フローティング仕様）。
 * 画面上をタッチした位置にその場でベース円が出現し、ドラッグすると中心からの
 * 傾き（0〜1）と方向を getVector() で返す。指を離すと消え、次にタッチした
 * 位置へ再び現れる（固定位置ではないため、画面のどこからでも操作を始められる）。
 * Player.js はキーボード入力に加えてこれを読み、値があれば優先して移動に使う。
 */
export default class VirtualJoystick {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;
    /** 現在この仮想パッドを掴んでいるポインタの id（掴んでいなければ null） */
    this.pointerId = null;
    /** 現在の入力ベクトル（x, y とも -1〜1、長さは傾きの割合） */
    this.vector = new Phaser.Math.Vector2(0, 0);

    /** 出現中のベース中心座標（未出現時は無効） */
    this.baseX = 0;
    this.baseY = 0;

    this.base = scene.add
      .circle(
        0,
        0,
        JOYSTICK_CONFIG.BASE_RADIUS,
        JOYSTICK_CONFIG.BASE_COLOR,
        JOYSTICK_CONFIG.BASE_ALPHA,
      )
      .setStrokeStyle(2, JOYSTICK_CONFIG.BASE_COLOR, JOYSTICK_CONFIG.BASE_BORDER_ALPHA)
      .setDepth(DEPTH.UI)
      .setScrollFactor(0)
      .setVisible(false);

    this.knob = scene.add
      .circle(
        0,
        0,
        JOYSTICK_CONFIG.KNOB_RADIUS,
        JOYSTICK_CONFIG.KNOB_COLOR,
        JOYSTICK_CONFIG.KNOB_ALPHA,
      )
      .setDepth(DEPTH.UI)
      .setScrollFactor(0)
      .setVisible(false);

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    scene.input.on('pointerdown', this.onPointerDown);
    scene.input.on('pointermove', this.onPointerMove);
    scene.input.on('pointerup', this.onPointerUp);
    scene.input.on('pointerupoutside', this.onPointerUp);

    // シーン終了時にリスナーを確実に外す（プールされたシーン再利用時の多重登録を防ぐ）
    scene.events.once('shutdown', () => this.destroy());
  }

  /**
   * タッチした位置にベースを出現させて操作を開始する（既に別の指で操作中なら無視）。
   * アップグレード選択中や、ボタンなど他の UI 要素の上をタッチした場合は
   * 誤操作防止のため出現させない
   */
  onPointerDown(pointer) {
    if (this.pointerId !== null || this.scene.isPaused) {
      return;
    }
    if (this.scene.input.hitTestPointer(pointer).length > 0) {
      return;
    }

    this.pointerId = pointer.id;
    this.baseX = pointer.x;
    this.baseY = pointer.y;
    this.base.setPosition(this.baseX, this.baseY).setVisible(true);
    this.knob.setPosition(this.baseX, this.baseY).setVisible(true);
    this.updateFromPointer(pointer);
  }

  /** 操作中のポインタが動いたらノブとベクトルを更新する */
  onPointerMove(pointer) {
    if (pointer.id === this.pointerId) {
      this.updateFromPointer(pointer);
    }
  }

  /** 操作中のポインタが離れたらベースごと消す */
  onPointerUp(pointer) {
    if (pointer.id === this.pointerId) {
      this.pointerId = null;
      this.vector.set(0, 0);
      this.base.setVisible(false);
      this.knob.setVisible(false);
    }
  }

  /** ポインタ位置からノブの表示位置と入力ベクトルを計算する */
  updateFromPointer(pointer) {
    const { BASE_RADIUS, DEAD_ZONE_RATIO } = JOYSTICK_CONFIG;
    const dx = pointer.x - this.baseX;
    const dy = pointer.y - this.baseY;
    const angle = Math.atan2(dy, dx);
    const dist = Math.min(Math.hypot(dx, dy), BASE_RADIUS);

    this.knob.setPosition(
      this.baseX + Math.cos(angle) * dist,
      this.baseY + Math.sin(angle) * dist,
    );

    const ratio = dist / BASE_RADIUS;
    if (ratio < DEAD_ZONE_RATIO) {
      this.vector.set(0, 0);
    } else {
      this.vector.set(Math.cos(angle) * ratio, Math.sin(angle) * ratio);
    }
  }

  /** 現在の入力ベクトルを返す（未操作時は長さ 0） */
  getVector() {
    return this.vector;
  }

  /** イベントリスナーと表示物を破棄する */
  destroy() {
    this.scene.input.off('pointerdown', this.onPointerDown);
    this.scene.input.off('pointermove', this.onPointerMove);
    this.scene.input.off('pointerup', this.onPointerUp);
    this.scene.input.off('pointerupoutside', this.onPointerUp);
    this.base.destroy();
    this.knob.destroy();
  }
}

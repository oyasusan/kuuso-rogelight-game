import Phaser from 'phaser';
import { DEPTH, JOYSTICK_CONFIG } from '../constants.js';

/**
 * スマホ等タッチデバイス向けの仮想パッド。
 * 画面左下に固定表示され（ワールドがスクロールしても動かない）、ベース円の
 * 近くをタッチしてドラッグすると、中心からの傾き（0〜1）と方向を getVector() で返す。
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

    this.baseX = JOYSTICK_CONFIG.X;
    this.baseY = scene.scale.height - JOYSTICK_CONFIG.Y_FROM_BOTTOM;

    this.base = scene.add
      .circle(
        this.baseX,
        this.baseY,
        JOYSTICK_CONFIG.BASE_RADIUS,
        JOYSTICK_CONFIG.BASE_COLOR,
        JOYSTICK_CONFIG.BASE_ALPHA,
      )
      .setStrokeStyle(2, JOYSTICK_CONFIG.BASE_COLOR, JOYSTICK_CONFIG.BASE_BORDER_ALPHA)
      .setDepth(DEPTH.UI)
      .setScrollFactor(0);

    this.knob = scene.add
      .circle(
        this.baseX,
        this.baseY,
        JOYSTICK_CONFIG.KNOB_RADIUS,
        JOYSTICK_CONFIG.KNOB_COLOR,
        JOYSTICK_CONFIG.KNOB_ALPHA,
      )
      .setDepth(DEPTH.UI)
      .setScrollFactor(0);

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

  /** ベース付近をタッチしたら操作を開始する（既に別の指で操作中なら無視） */
  onPointerDown(pointer) {
    if (this.pointerId !== null) {
      return;
    }
    const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.baseX, this.baseY);
    if (dist <= JOYSTICK_CONFIG.BASE_RADIUS * JOYSTICK_CONFIG.GRAB_RADIUS_MULTIPLIER) {
      this.pointerId = pointer.id;
      this.updateFromPointer(pointer);
    }
  }

  /** 操作中のポインタが動いたらノブとベクトルを更新する */
  onPointerMove(pointer) {
    if (pointer.id === this.pointerId) {
      this.updateFromPointer(pointer);
    }
  }

  /** 操作中のポインタが離れたら中央へ戻す */
  onPointerUp(pointer) {
    if (pointer.id === this.pointerId) {
      this.pointerId = null;
      this.vector.set(0, 0);
      this.knob.setPosition(this.baseX, this.baseY);
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

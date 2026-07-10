import Phaser from 'phaser';
import { ANTI_CONFIG, DEPTH } from '../constants.js';

/**
 * アンチ（妨害キャラクター）。
 * 画面外からスポーンしてプレイヤーへ近づき、接触すると会場全体の Heat を下げる。
 * 歌のダメージで HP が尽きると退場する。
 * オブジェクトプール（SpawnSystem のグループ）から取得して使う。
 *
 * ANTI_TYPES の種類ごとに速度・サイズ・HP・Heat 減少量・攻撃方法（接触 / 遠隔パルス）
 * が変わる。見た目は共通のシルエットテクスチャを tint とスケールで変えて表現している。
 */
export default class AntiFan extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, 'anti');
    this.setDepth(DEPTH.ANTI);
    this.hp = ANTI_CONFIG.MAX_HP;
  }

  /**
   * プールから取り出して指定位置に出現させる。
   * @param {number} x
   * @param {number} y
   * @param {typeof import('../constants.js').ANTI_TYPES[number]} type
   */
  spawn(x, y, type) {
    this.type = type.id;
    this.color = type.color;
    this.speed = ANTI_CONFIG.SPEED * type.speedMult;
    this.heatDrainMult = type.heatDrainMult;
    this.maxHp = Math.max(1, Math.round(ANTI_CONFIG.MAX_HP * type.hpMult));
    this.hp = this.maxHp;
    // 撃破時に落とす経験値オーブの経験値量
    this.expValue = type.expValue ?? 0;
    // 接触しても退場しない種類（ボス）の多重ヒット防止用クールタイム
    this.contactCooldownMs = type.contactCooldownMs ?? 0;
    this.contactCooldownUntil = 0;
    // 遠隔パルス攻撃（ジャマー専用）。behavior !== 'pulse' の場合は null のまま
    this.pulseIntervalMs = type.behavior === 'pulse' ? type.pulseIntervalMs : null;
    this.pulseRadius = type.pulseRadius ?? 0;
    this.pulseHeatDrain = type.pulseHeatDrain ?? 0;
    this.nextPulseAt = this.scene.time.now + (this.pulseIntervalMs ?? 0);

    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setTint(this.color);
    this.setScale(type.sizeMult);
    if (this.body) {
      this.body.enable = true;
      // 見た目のドット絵（フードとマントを含む縦長のシルエット）に関わらず、
      // 当たり判定は中心付近に絞ったサイズにする（プールされた body に対して都度設定）。
      // setScale 済みのため、ここでは基準サイズを渡せば自動的にスケール分が反映される
      const size = ANTI_CONFIG.SIZE;
      this.body.setSize(size, size);
      this.body.setOffset((this.width - size) / 2, (this.height - size) / 2);
    }
  }

  /** プレイヤーへ向かって移動する。毎フレーム呼ぶ */
  chase(player) {
    this.scene.physics.moveToObject(this, player, this.speed);
  }

  /**
   * ダメージを受ける。HP が尽きたら退場する。
   * @returns {boolean} 退場したかどうか
   */
  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.despawn();
      return true;
    }
    // 被弾フィードバック: 一瞬白く光る
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.active) {
        this.setTint(this.color);
      }
    });
    return false;
  }

  /** 退場してプールへ戻る */
  despawn() {
    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      this.body.stop();
      this.body.enable = false;
    }
  }
}

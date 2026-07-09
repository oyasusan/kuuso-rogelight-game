import Phaser from 'phaser';
import { ANTI_CONFIG, DEPTH } from '../constants.js';

/**
 * アンチ（妨害キャラクター）。
 * 画面外からスポーンしてプレイヤーへ近づき、接触すると会場全体の Heat を下げる。
 * 歌のダメージで HP が尽きると退場する。
 * オブジェクトプール（SpawnSystem のグループ）から取得して使う。
 */
export default class AntiFan extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, 'anti');
    this.setTint(ANTI_CONFIG.COLOR);
    this.setDepth(DEPTH.ANTI);
    // 四角形テクスチャを 45 度回転させてひし形に見せる
    this.setRotation(Math.PI / 4);

    this.hp = ANTI_CONFIG.MAX_HP;
  }

  /** プールから取り出して指定位置に出現させる */
  spawn(x, y) {
    this.hp = ANTI_CONFIG.MAX_HP;
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setTint(ANTI_CONFIG.COLOR);
    if (this.body) {
      this.body.enable = true;
    }
  }

  /** プレイヤーへ向かって移動する。毎フレーム呼ぶ */
  chase(player) {
    this.scene.physics.moveToObject(this, player, ANTI_CONFIG.SPEED);
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
        this.setTint(ANTI_CONFIG.COLOR);
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

import saveSystem from './SaveSystem.js';
import {
  ANTI_CONFIG,
  AUDIENCE_CONFIG,
  CHARACTERS,
  PERMA_CONFIG,
  PLAYER_CONFIG,
  SONG_CONFIG,
  STAGES,
} from '../constants.js';

/** キャラクターが選択可能かどうか（最初から解放済み、または永久強化で解放済み） */
export function isCharacterUnlocked(character) {
  return (
    character.unlocked ||
    (character.unlockUpgradeId != null &&
      saveSystem.getRank(character.unlockUpgradeId) > 0)
  );
}

/** ステージが選択可能かどうか（最初から解放済み、または永久強化で解放済み） */
export function isStageUnlocked(stage) {
  return (
    stage.unlocked ||
    (stage.unlockUpgradeId != null && saveSystem.getRank(stage.unlockUpgradeId) > 0)
  );
}

/**
 * セーブデータ（選択キャラクター・ステージ・永久強化）から、
 * 今回のラン 1 回分のパラメータを組み立てる。
 * GameScene の開始時に 1 度だけ呼ぶ。
 */
export function buildRunModifiers() {
  const { data } = saveSystem;
  // 保存されている選択が未解放（永久強化リセット直後など）だった場合に備え、
  // 解放済みのものだけを候補にフォールバックする
  const character =
    CHARACTERS.find((c) => c.id === data.characterId && isCharacterUnlocked(c)) ??
    CHARACTERS.find(isCharacterUnlocked) ??
    CHARACTERS[0];
  const stage =
    STAGES.find((s) => s.id === data.stageId && isStageUnlocked(s)) ??
    STAGES.find(isStageUnlocked) ??
    STAGES[0];

  /** 永久強化の効果量（step × 取得ランク） */
  const permaBonus = (upgradeId) => {
    const definition = PERMA_CONFIG.UPGRADES.find((u) => u.id === upgradeId);
    return definition.step * saveSystem.getRank(upgradeId);
  };

  return {
    character,
    stage,
    /** 観客の初期 Heat */
    audienceInitialHeat:
      AUDIENCE_CONFIG.INITIAL_HEAT + permaBonus('initialHeat'),
    /** 歌の Heat 量（キャラクター倍率 → 永久強化の順に適用） */
    songHeatGain: Math.round(
      SONG_CONFIG.HEAT_GAIN * character.songHeatMult + permaBonus('songHeat'),
    ),
    /** 歌の半径 */
    songRadius: SONG_CONFIG.RADIUS * character.songRadiusMult,
    /** 歌のアンチダメージ加算量（護衛訓練による永久強化） */
    songDamageBonus: permaBonus('antiPower'),
    /** プレイヤーの移動速度 */
    playerSpeed:
      PLAYER_CONFIG.SPEED * character.speedMult * (1 + permaBonus('speed')),
    /** アンチ接触時の会場 Heat 減少量（緩和されても 0 より下がらない＝回復はしない） */
    antiHeatDrain: Math.min(0, ANTI_CONFIG.HEAT_DRAIN + permaBonus('antiResist')),
    /** アンチのスポーン間隔（ステージ規模が大きいほど短い） */
    antiSpawnIntervalMs: Math.round(
      ANTI_CONFIG.SPAWN_INTERVAL_MS * stage.antiIntervalMult,
    ),
    /** 1 回のスポーンで出現するアンチ数の倍率（ステージ規模が大きいほど大きい＝ウェーブ化） */
    antiWaveMult: stage.antiWaveMult,
    /**
     * 観客の自然冷却速度（毎秒）。ステージ規模が大きいほど鈍化しやすくなる一方、
     * 永久強化「スタミナ強化」で緩和できる。下限を設けて 0 以下にはしない
     */
    audienceHeatDecayPerSec: Math.max(
      0.5,
      AUDIENCE_CONFIG.HEAT_DECAY_PER_SEC * stage.heatDecayMult -
        permaBonus('heatStamina'),
    ),
  };
}

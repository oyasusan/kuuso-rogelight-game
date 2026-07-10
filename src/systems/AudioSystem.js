import { AUDIO_CONFIG } from '../constants.js';

/**
 * Web Audio API によるサウンドシステム。
 * 音声アセットを使わず、SE・BGM・歓声をすべてプロシージャル生成する。
 *
 * ブラウザの自動再生制限のため、最初のユーザー操作（タイトルでのクリック等）で
 * unlock() を呼んで AudioContext を生成する必要がある。
 * unlock 前に再生メソッドを呼んでも安全（何もしない）。
 *
 * モジュール末尾で生成するシングルトンを import して使う。
 */
class AudioSystem {
  constructor() {
    /** @type {AudioContext | null} */
    this.context = null;
    this.masterGain = null;
    this.cheerGain = null;
    this.noiseBuffer = null;

    // BGM スケジューラの状態
    this.bgmIntervalId = null;
    this.bgmStep = 0;
    this.bgmNextTime = 0;

    this.lastFrenzySeAt = 0;
    this.lastExpPickupSeAt = 0;
  }

  /** 最初のユーザー操作で呼ぶ。AudioContext を生成・再開する */
  unlock() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return;
      }
      this.context = new AudioContextClass();

      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = AUDIO_CONFIG.MASTER_VOLUME;
      this.masterGain.connect(this.context.destination);

      this.noiseBuffer = this.createNoiseBuffer();
      this.startCheerLoop();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  /** 一時停止（アップグレード選択中など）。全サウンドが止まる */
  suspend() {
    if (this.context && this.context.state === 'running') {
      this.context.suspend();
    }
  }

  /** 一時停止からの再開 */
  resume() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  // ------------------------------------------------------------------
  // 基本ヘルパー
  // ------------------------------------------------------------------

  /** ホワイトノイズのバッファ（1 秒）を作る */
  createNoiseBuffer() {
    const length = this.context.sampleRate;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * 単音を鳴らす。
   * @param {number} when 再生開始時刻（AudioContext 時間）
   * @param {object} opts
   * @param {number} opts.freq 周波数（Hz）
   * @param {number} [opts.slideTo] 終了時の周波数（グリッサンド）
   * @param {OscillatorType} [opts.type]
   * @param {number} [opts.duration] 長さ（秒）
   * @param {number} [opts.gain] 音量
   */
  tone(when, { freq, slideTo, type = 'triangle', duration = 0.15, gain = 0.1 }) {
    const osc = this.context.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, when + duration);
    }

    const gainNode = this.context.createGain();
    gainNode.gain.setValueAtTime(gain, when);
    gainNode.gain.exponentialRampToValueAtTime(0.001, when + duration);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  /**
   * ノイズを短く鳴らす（打楽器・ヒット音用）。
   * @param {number} when 再生開始時刻
   * @param {object} opts
   * @param {number} [opts.duration]
   * @param {number} [opts.gain]
   * @param {BiquadFilterType} [opts.filterType]
   * @param {number} [opts.filterFreq]
   */
  noise(when, { duration = 0.08, gain = 0.1, filterType = 'lowpass', filterFreq = 2000 }) {
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.context.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;

    const gainNode = this.context.createGain();
    gainNode.gain.setValueAtTime(gain, when);
    gainNode.gain.exponentialRampToValueAtTime(0.001, when + duration);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start(when);
    source.stop(when + duration + 0.02);
  }

  // ------------------------------------------------------------------
  // 歓声（会場の環境音）
  // ------------------------------------------------------------------

  /** 歓声ノイズのループを開始する（音量 0 から） */
  startCheerLoop() {
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.7;

    this.cheerGain = this.context.createGain();
    this.cheerGain.gain.value = 0;

    source.connect(filter);
    filter.connect(this.cheerGain);
    this.cheerGain.connect(this.masterGain);
    source.start();
  }

  /**
   * 演出段階に応じて歓声の音量を変える。
   * @param {number} tier 0〜4
   * @param {number} [rampSec] 音量変化にかける時間
   */
  setCheerTier(tier, rampSec = 0.8) {
    if (!this.cheerGain) {
      return;
    }
    const target = AUDIO_CONFIG.CHEER_GAINS[tier] ?? 0;
    const now = this.context.currentTime;
    this.cheerGain.gain.cancelScheduledValues(now);
    this.cheerGain.gain.setValueAtTime(this.cheerGain.gain.value, now);
    this.cheerGain.gain.linearRampToValueAtTime(target, now + rampSec);
  }

  // ------------------------------------------------------------------
  // BGM（8 ビートのシンプルなループ）
  // ------------------------------------------------------------------

  /** BGM ループを開始する */
  startBgm() {
    if (!this.context || this.bgmIntervalId) {
      return;
    }
    this.bgmStep = 0;
    this.bgmNextTime = this.context.currentTime + 0.1;
    // 50ms ごとに 0.2 秒先までのステップを予約するルックアヘッド方式
    this.bgmIntervalId = setInterval(() => this.scheduleBgm(), 50);
  }

  /** BGM ループを停止する */
  stopBgm() {
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }

  /** 再生時刻が近いステップを予約する */
  scheduleBgm() {
    const stepSec = 60 / AUDIO_CONFIG.BGM_TEMPO / 2; // 8 分音符
    while (this.bgmNextTime < this.context.currentTime + 0.2) {
      this.playBgmStep(this.bgmStep, this.bgmNextTime);
      this.bgmStep = (this.bgmStep + 1) % 16;
      this.bgmNextTime += stepSec;
    }
  }

  /** 16 ステップ（2 小節）パターンの 1 ステップ分を鳴らす */
  playBgmStep(step, when) {
    // ベースライン（A マイナー）
    const A2 = 110;
    const C3 = 130.81;
    const E3 = 164.81;
    const G3 = 196;
    const bassPattern = [
      A2, 0, A2, 0, C3, 0, A2, 0,
      E3, 0, E3, 0, G3, 0, C3, 0,
    ];
    const bass = bassPattern[step];
    if (bass) {
      this.tone(when, { freq: bass, type: 'sawtooth', duration: 0.18, gain: 0.05 });
    }

    // キック（4 つ打ち）
    if (step % 4 === 0) {
      this.tone(when, { freq: 150, slideTo: 45, type: 'sine', duration: 0.12, gain: 0.22 });
    }
    // ハイハット（裏拍）
    if (step % 4 === 2) {
      this.noise(when, { duration: 0.04, gain: 0.04, filterType: 'highpass', filterFreq: 6000 });
    }
  }

  // ------------------------------------------------------------------
  // SE
  // ------------------------------------------------------------------

  /** SE の共通ガード。unlock 前は再生しない */
  get now() {
    return this.context ? this.context.currentTime : null;
  }

  /** ライブ開始 */
  playStart() {
    if (!this.context) return;
    this.tone(this.now, { freq: 440, slideTo: 880, type: 'triangle', duration: 0.25, gain: 0.15 });
  }

  /** 観客が熱狂した（連鎖時の鳴りすぎを防ぐレート制限つき） */
  playFrenzy() {
    if (!this.context) return;
    const nowMs = performance.now();
    if (nowMs - this.lastFrenzySeAt < AUDIO_CONFIG.FRENZY_SE_MIN_INTERVAL_MS) {
      return;
    }
    this.lastFrenzySeAt = nowMs;
    this.tone(this.now, { freq: 700, slideTo: 1000, type: 'triangle', duration: 0.09, gain: 0.09 });
  }

  /** 経験値オーブを回収した（連続回収時の鳴りすぎを防ぐレート制限つき） */
  playExpPickup() {
    if (!this.context) return;
    const nowMs = performance.now();
    if (nowMs - this.lastExpPickupSeAt < AUDIO_CONFIG.EXP_PICKUP_SE_MIN_INTERVAL_MS) {
      return;
    }
    this.lastExpPickupSeAt = nowMs;
    this.tone(this.now, { freq: 1200, slideTo: 1600, type: 'sine', duration: 0.06, gain: 0.05 });
  }

  /** レベルアップ（3 択が開く） */
  playLevelUp() {
    if (!this.context) return;
    this.tone(this.now, { freq: 660, type: 'square', duration: 0.1, gain: 0.08 });
    this.tone(this.now + 0.1, { freq: 880, type: 'square', duration: 0.16, gain: 0.08 });
  }

  /** アップグレード選択 */
  playSelect() {
    if (!this.context) return;
    this.tone(this.now, { freq: 880, type: 'square', duration: 0.07, gain: 0.08 });
  }

  /** 歌がアンチに命中した */
  playAntiHit() {
    if (!this.context) return;
    this.noise(this.now, { duration: 0.08, gain: 0.12, filterFreq: 1200 });
    this.tone(this.now, { freq: 220, type: 'sawtooth', duration: 0.08, gain: 0.06 });
  }

  /** アンチがプレイヤーに接触した（会場の Heat 低下） */
  playAntiContact() {
    if (!this.context) return;
    this.tone(this.now, { freq: 280, slideTo: 90, type: 'sawtooth', duration: 0.3, gain: 0.18 });
  }

  /** アンチのウェーブが襲来した（警告として 2 音連続で鳴らす） */
  playWaveAlert() {
    if (!this.context) return;
    this.tone(this.now, { freq: 200, type: 'sawtooth', duration: 0.14, gain: 0.14 });
    this.tone(this.now + 0.16, { freq: 160, type: 'sawtooth', duration: 0.18, gain: 0.14 });
  }

  /** ボスが出現した（ウェーブ警告より低く長く、不穏さを強調する） */
  playBossAlert() {
    if (!this.context) return;
    this.tone(this.now, { freq: 140, type: 'sawtooth', duration: 0.22, gain: 0.18 });
    this.tone(this.now + 0.24, { freq: 110, type: 'sawtooth', duration: 0.22, gain: 0.18 });
    this.tone(this.now + 0.48, { freq: 80, slideTo: 60, type: 'sawtooth', duration: 0.4, gain: 0.2 });
  }

  /** リザルトのファンファーレ */
  playResultFanfare() {
    if (!this.context) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      this.tone(this.now + i * 0.13, {
        freq,
        type: 'triangle',
        duration: i === notes.length - 1 ? 0.5 : 0.15,
        gain: 0.12,
      });
    });
  }
}

/** シングルトン。各シーン・オブジェクトから import して使う */
const audioSystem = new AudioSystem();
export default audioSystem;

import Phaser from 'phaser';

/**
 * シーンの内容が画面の高さに収まらない場合に、カメラをドラッグ／ホイールで
 * 縦スクロールできるようにする（スマホ縦画面でカード数が多いメニュー向け）。
 * contentHeight が画面高さ以下なら何もしない。
 * スタート/戻るボタンは呼び出し側で setScrollFactor(0) の固定表示にしておくこと
 * （スクロールしても常に押せるようにするため）。
 *
 * 各カード等の pointerdown はドラッグ開始時にそのまま発火する（Phaser の
 * pointerdown はタッチ開始時点で即座に発火するため、ドラッグと区別できない）。
 * そのためカードの上でスクロールを始めるとそのカードも選択されてしまうが、
 * 選び直せば済む程度の実害のため許容している。
 * @param {Phaser.Scene} scene
 * @param {number} contentHeight レイアウトの合計高さ（画面下端の余白込み）
 */
export function enableVerticalScroll(scene, contentHeight) {
  const width = scene.scale.width;
  const height = scene.scale.height;
  if (contentHeight <= height) {
    return;
  }

  scene.cameras.main.setBounds(0, 0, width, contentHeight);
  const maxScroll = contentHeight - height;
  let dragStartY = null;
  let scrollStartY = 0;

  const onPointerDown = (pointer) => {
    dragStartY = pointer.y;
    scrollStartY = scene.cameras.main.scrollY;
  };
  const onPointerMove = (pointer) => {
    if (dragStartY === null || !pointer.isDown) {
      return;
    }
    const delta = dragStartY - pointer.y;
    scene.cameras.main.scrollY = Phaser.Math.Clamp(scrollStartY + delta, 0, maxScroll);
  };
  const onPointerUp = () => {
    dragStartY = null;
  };
  const onWheel = (_pointer, _objects, _dx, dy) => {
    scene.cameras.main.scrollY = Phaser.Math.Clamp(
      scene.cameras.main.scrollY + dy * 0.6,
      0,
      maxScroll,
    );
  };

  scene.input.on('pointerdown', onPointerDown);
  scene.input.on('pointermove', onPointerMove);
  scene.input.on('pointerup', onPointerUp);
  scene.input.on('pointerupoutside', onPointerUp);
  scene.input.on('wheel', onWheel);
  scene.events.once('shutdown', () => {
    scene.input.off('pointerdown', onPointerDown);
    scene.input.off('pointermove', onPointerMove);
    scene.input.off('pointerup', onPointerUp);
    scene.input.off('pointerupoutside', onPointerUp);
    scene.input.off('wheel', onWheel);
  });
}

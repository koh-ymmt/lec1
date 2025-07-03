// ボール衝突音を生成する関数
export default function playBallCollisionSound(audioContext) {
  // Web Audio APIで「カチッ」という音を生成
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // オシレーターの設定（短いクリック音）
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    200,
    audioContext.currentTime + 0.05
  );

  // 音量の設定（非常に短時間で減衰）
  gainNode.gain.setValueAtTime(0.01, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.08
  );

  // 接続
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // 再生
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.08);
}

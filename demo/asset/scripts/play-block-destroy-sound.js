export default function playBlockDestroySound(audioContext) {
  // Web Audio APIで「ポコッ」という音を生成
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // オシレーターの設定（短いポップ音）
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(200, audioContext.currentTime); // 高い音から
  oscillator.frequency.exponentialRampToValueAtTime(
    1000,
    audioContext.currentTime + 0.15
  ); // 低い音へ

  // 音量の設定（短時間で減衰）
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.1
  );

  // 接続
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // 再生
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.15);
}

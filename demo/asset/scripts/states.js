// ゲーム状態
export const gameState = {
  level: 1,
  score: 0,
  isGameRunning: false,
  isBallMoving: false,
  isPaused: false
};

// ゲーム要素
export const paddle = {
  element: document.getElementById("paddle"),
  speed: 10
};

import generateBlocks from "./scripts/generate-blocks.js";
import { gameState, paddle } from "./scripts/states.js";
import Ball from "./scripts/ball.js";
import checkCollision from "./scripts/check-collision.js";
import playBlockDestroySound from "./scripts/play-block-destroy-sound.js";
import { audioContext } from "./scripts/audio-ctx.js";

const balls = [new Ball("50%", 4)];

// DOM要素
const elements = {
  gameArea: document.getElementById("game-area"),
  blockArea: document.getElementById("block-area"),
  levelDisplay: document.getElementById("level"),
  scoreDisplay: document.getElementById("score"),
  messageWindow: document.getElementById("message-window"),
  gameClear: document.getElementById("game-clear"),
  gameOver: document.getElementById("game-over"),
  gamePause: document.getElementById("game-pause"),
  nextButton: document.getElementById("next-button"),
  restartButton: document.getElementById("restart-button"),
  resumeButton: document.getElementById("resume-button"),
  quitButton: document.getElementById("quit-button")
};

// キー入力管理
const keys = {};

// 初期化
function init() {
  generateBlocks();
  updateDisplay();
  balls.forEach((ball) => ball.reset());
  setupEventListeners();
  gameState.isGameRunning = true;
  gameLoop();
  paddle.element.style.left =
    elements.blockArea.getBoundingClientRect().width / 2 -
    paddle.element.getBoundingClientRect().width / 2 +
    "px";
}

// イベントリスナー設定
function setupEventListeners() {
  document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === " " && !gameState.isBallMoving && !gameState.isPaused) {
      e.preventDefault();
      // 全てのボールを動かす
      balls.forEach((ball) => ball.start());
      gameState.isBallMoving = true;
    }
  });

  document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  elements.nextButton.addEventListener("click", nextLevel);
  elements.restartButton.addEventListener("click", restart);
}

// 表示更新
function updateDisplay() {
  elements.levelDisplay.textContent = gameState.level
    .toString()
    .padStart(3, "0");
  elements.scoreDisplay.textContent = gameState.score
    .toString()
    .padStart(5, "0");
}

// パドル更新
function updatePaddle() {
  if (gameState.isPaused) return;

  const gameAreaRect = elements.gameArea.getBoundingClientRect();
  const paddleRect = paddle.element.getBoundingClientRect();

  if (keys["ArrowLeft"]) {
    const newLeft = Math.max(
      0,
      paddleRect.left - paddle.speed - gameAreaRect.left
    );
    paddle.element.style.left = newLeft + "px";
  }
  if (keys["ArrowRight"]) {
    const maxLeft = gameAreaRect.width - paddleRect.width;
    const newLeft = Math.min(
      maxLeft,
      paddleRect.left + paddle.speed - gameAreaRect.left
    );
    paddle.element.style.left = newLeft + "px";
  }
}

// ボール更新
function updateBalls() {
  if (!gameState.isBallMoving || gameState.isPaused) return;

  const gameAreaRect = elements.gameArea.getBoundingClientRect();
  const paddleRect = paddle.element.getBoundingClientRect();

  balls.forEach((ball) => {
    const updateResult = ball.update(gameAreaRect, paddleRect);

    if (!updateResult.active) {
      if (updateResult.fallen) {
        // 全てのボールが落ちたかチェック
        const remainingActiveBalls = balls.filter((b) => b.moving).length;
        if (remainingActiveBalls === 0) {
          gameOver();
          return;
        }
      }
      return;
    }

    // ブロックとの衝突判定
    const blocks = elements.blockArea.querySelectorAll(
      ".block:not(.destroyed)"
    );
    for (const block of blocks) {
      const blockRect = block.getBoundingClientRect();
      if (checkCollision(updateResult.ballNextRect, blockRect)) {
        block.classList.add("destroyed");
        block.style.visibility = "hidden";
        ball.handleBlockCollision();
        gameState.score += 10;
        updateDisplay();

        // ブロック破壊音を再生
        playBlockDestroySound(audioContext);

        // 全ブロック破壊チェック
        const remainingBlocks = elements.blockArea.querySelectorAll(
          ".block:not(.destroyed)"
        );
        if (remainingBlocks.length === 0) {
          stageClear();
          return;
        }
        break;
      }
    }
  });

  // ボール同士の衝突判定
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const ball1 = balls[i];
      const ball2 = balls[j];

      if (
        ball1.moving &&
        ball2.moving &&
        ball1.checkBallCollision(ball2, gameAreaRect)
      ) {
        ball1.handleBallCollision(ball2, gameAreaRect);
      }
    }
  }
}

// ステージクリア
function stageClear() {
  gameState.isGameRunning = false;
  gameState.isBallMoving = false;
  elements.gameClear.classList.remove("hidden");
  elements.messageWindow.classList.remove("hidden");
  setTimeout(() => {
    elements.nextButton.focus();
  }, 50);
}

// ゲームオーバー
function gameOver() {
  gameState.isGameRunning = false;
  gameState.isBallMoving = false;
  elements.gameOver.classList.remove("hidden");
  elements.messageWindow.classList.remove("hidden");
}

// 次のレベル
function nextLevel() {
  gameState.level++;
  elements.gameClear.classList.add("hidden");
  elements.messageWindow.classList.add("hidden");

  // ブロックをリセット
  elements.blockArea.innerHTML = "";
  generateBlocks();

  // 全てのボールをリセット
  balls.forEach((ball) => {
    ball.element.style.visibility = "visible";
    ball.reset();
    ball.baseSpeed += 2; // レベルアップでボールの速度を上げる
  });
  gameState.isGameRunning = true;
  gameState.isBallMoving = false;
  updateDisplay();
}

// リスタート
function restart() {
  gameState.level = 1;
  gameState.score = 0;
  elements.gameOver.classList.add("hidden");
  elements.messageWindow.classList.add("hidden");

  // ブロックをリセット
  elements.blockArea.innerHTML = "";
  generateBlocks();

  // 全てのボールをリセット
  balls.forEach((ball) => {
    ball.element.style.visibility = "visible";
    ball.reset();
  });
  gameState.isGameRunning = true;
  gameState.isBallMoving = false;
  updateDisplay();
}

// ゲームループ
function gameLoop() {
  if (gameState.isGameRunning && !gameState.isPaused) {
    updatePaddle();
    updateBalls();
  }
  requestAnimationFrame(gameLoop);
}

// ゲーム開始
init();

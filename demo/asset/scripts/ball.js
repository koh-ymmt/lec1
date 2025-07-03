import checkCollision from "./check-collision.js";
import playBallCollisionSound from "./play-ball-collision-sound.js";
import { audioContext } from "./audio-ctx.js";

document.addEventListener(
  "keydown",
  (e) => {
    e.preventDefault();
    // AudioContextを初回起動（ユーザー操作が必要）
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
  },
  { once: true }
);

export default class Ball {
  constructor(initialX, initialSpeedX) {
    const ball = document.createElement("div");
    ball.className = "ball";
    document.getElementById("game-area").append(ball);
    this.element = ball;
    this.initialX = initialX;
    this.speedX = initialSpeedX;
    this.speedY = -4;
    this.baseSpeed = 8;
    this.moving = false;
    this.reset();
  }

  reset() {
    this.element.style.left = Math.random() * 100 + "%";
    this.element.style.top = "500px";
    this.speedX = this.speedX > 0 ? 4 : -4; // 初期方向を保持
    this.speedY = -4;
    this.moving = false;
    this.normalizeSpeed();
  }

  normalizeSpeed() {
    const currentSpeed = Math.sqrt(
      this.speedX * this.speedX + this.speedY * this.speedY
    );
    if (currentSpeed > 0) {
      this.speedX = (this.speedX / currentSpeed) * this.baseSpeed;
      this.speedY = (this.speedY / currentSpeed) * this.baseSpeed;
    }
  }

  update(gameAreaRect, paddleRect) {
    if (!this.moving) return { active: false };

    const ballRect = this.element.getBoundingClientRect();

    // 現在位置取得
    const currentLeft = ballRect.left - gameAreaRect.left;
    const currentTop = ballRect.top - gameAreaRect.top;

    // 新しい位置計算
    let newLeft = currentLeft + this.speedX;
    let newTop = currentTop + this.speedY;

    // 壁との衝突
    if (newLeft <= 0 || newLeft >= gameAreaRect.width - ballRect.width) {
      this.speedX *= -1;
      this.normalizeSpeed();
    }
    if (newTop <= 0) {
      this.speedY *= -1;
      this.normalizeSpeed();
    }

    // 底に落ちた場合
    if (newTop >= gameAreaRect.height) {
      this.moving = false;
      this.element.style.visibility = "hidden";
      return { active: false, fallen: true };
    }

    // パドルとの衝突
    const ballNextRect = {
      left: gameAreaRect.left + newLeft,
      top: gameAreaRect.top + newTop,
      right: gameAreaRect.left + newLeft + ballRect.width,
      bottom: gameAreaRect.top + newTop + ballRect.height
    };

    if (checkCollision(ballNextRect, paddleRect)) {
      this.speedY = -Math.abs(this.speedY);
      // パドルの中央からの距離に応じて角度を変える
      const paddleCenterX = paddleRect.left + paddleRect.width / 2;
      const ballCenterX = ballNextRect.left + ballRect.width / 2;
      const distance = (ballCenterX - paddleCenterX) / (paddleRect.width / 2);
      this.speedX = distance * this.baseSpeed * 0.8;
      this.normalizeSpeed();
    }

    // 位置更新
    this.element.style.left =
      Math.max(0, Math.min(newLeft, gameAreaRect.width - ballRect.width)) +
      "px";
    this.element.style.top = Math.max(0, newTop) + "px";

    return {
      active: true,
      ballNextRect: ballNextRect,
      newLeft: newLeft,
      newTop: newTop
    };
  }

  handleBlockCollision() {
    this.speedY *= -1;
    this.normalizeSpeed();
  }

  show() {
    this.element.style.visibility = "visible";
  }

  start() {
    this.moving = true;
  }

  // ボール同士の衝突判定
  checkBallCollision(otherBall, gameAreaRect) {
    if (!this.moving || !otherBall.moving) return false;

    const thisRect = this.element.getBoundingClientRect();
    const otherRect = otherBall.element.getBoundingClientRect();

    // 中心点を計算
    const thisCenterX = thisRect.left + thisRect.width / 2 - gameAreaRect.left;
    const thisCenterY = thisRect.top + thisRect.height / 2 - gameAreaRect.top;
    const otherCenterX =
      otherRect.left + otherRect.width / 2 - gameAreaRect.left;
    const otherCenterY =
      otherRect.top + otherRect.height / 2 - gameAreaRect.top;

    // 距離を計算
    const distance = Math.sqrt(
      Math.pow(thisCenterX - otherCenterX, 2) +
        Math.pow(thisCenterY - otherCenterY, 2)
    );

    // ボールの半径（実際のサイズに基づく）
    const ballRadius = thisRect.width / 2;

    // 衝突判定（少し余裕を持たせる）
    return distance < ballRadius * 2;
  }

  // ボール同士の衝突処理（弾性衝突）
  handleBallCollision(otherBall, gameAreaRect) {
    const thisRect = this.element.getBoundingClientRect();
    const otherRect = otherBall.element.getBoundingClientRect();

    // 中心点を計算
    const thisCenterX = thisRect.left + thisRect.width / 2 - gameAreaRect.left;
    const thisCenterY = thisRect.top + thisRect.height / 2 - gameAreaRect.top;
    const otherCenterX =
      otherRect.left + otherRect.width / 2 - gameAreaRect.left;
    const otherCenterY =
      otherRect.top + otherRect.height / 2 - gameAreaRect.top;

    // 衝突方向ベクトル
    const dx = otherCenterX - thisCenterX;
    const dy = otherCenterY - thisCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return; // 同じ位置にある場合は処理しない

    // 正規化された衝突方向
    const normalX = dx / distance;
    const normalY = dy / distance;

    // 相対速度
    const relativeVelocityX = otherBall.speedX - this.speedX;
    const relativeVelocityY = otherBall.speedY - this.speedY;

    // 法線方向の相対速度
    const speed = relativeVelocityX * normalX + relativeVelocityY * normalY;

    // 既に離れている場合は処理しない
    if (speed > 0) return;

    // 弾性衝突（質量は同じと仮定）
    const impulse = (2 * speed) / 2; // 質量が同じなので2で割る

    // 速度を更新
    this.speedX += impulse * normalX;
    this.speedY += impulse * normalY;
    otherBall.speedX -= impulse * normalX;
    otherBall.speedY -= impulse * normalY;

    // 速度を正規化
    this.normalizeSpeed();
    otherBall.normalizeSpeed();

    // ボール衝突音を再生
    playBallCollisionSound(audioContext);

    // ボールが重なっている場合は離す
    const overlap = thisRect.width / 2 + otherRect.width / 2 - distance;
    if (overlap > 0) {
      const separationX = (normalX * overlap) / 2;
      const separationY = (normalY * overlap) / 2;

      // 現在の位置を取得
      const thisCurrentLeft = parseFloat(this.element.style.left) || 0;
      const thisCurrentTop = parseFloat(this.element.style.top) || 0;
      const otherCurrentLeft = parseFloat(otherBall.element.style.left) || 0;
      const otherCurrentTop = parseFloat(otherBall.element.style.top) || 0;

      // 位置を調整
      this.element.style.left =
        Math.max(0, thisCurrentLeft - separationX) + "px";
      this.element.style.top = Math.max(0, thisCurrentTop - separationY) + "px";
      otherBall.element.style.left =
        Math.max(0, otherCurrentLeft + separationX) + "px";
      otherBall.element.style.top =
        Math.max(0, otherCurrentTop + separationY) + "px";
    }
  }
}

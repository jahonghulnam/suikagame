import { Bodies, Body, Engine, Events, Render, Runner, World } from "matter-js";
import { FRUITS_BASE, FRUITS_HLW } from "./fruits";
import "./dark.css";

// 상수 정의
const THEME = "base"; // { base, halloween }
let FRUITS;
if (THEME === "halloween" && typeof FRUITS_HLW !== 'undefined') {
  FRUITS = FRUITS_HLW;
} else {
  FRUITS = FRUITS_BASE;
}

// 캔버스가 그려질 위치
const wrap = document.querySelector(".wrap");

// 엔진과 렌더러 설정
const engine = Engine.create();
const render = Render.create({
  engine,
  element: wrap,
  options: {
    wireframes: false,
    background: false,
    width: 620,
    height: 850,
  }
});
Render.run(render);
Runner.run(engine);

// 세계와 벽, 바닥 설정
const world = engine.world;
const walls = [
  Bodies.rectangle(15, 395, 30, 790, { isStatic: true, render: { fillStyle: "#7aa2e3" }}),
  Bodies.rectangle(605, 395, 30, 790, { isStatic: true, render: { fillStyle: "#7aa2e3" }}),
  Bodies.rectangle(310, 820, 620, 60, { isStatic: true, render: { fillStyle: "#7aa2e3" }}),
  Bodies.rectangle(310, 150, 620, 2, { name: "topLine", isStatic: true, isSensor: true, render: { fillStyle: "#7aa2e3" }})
];
World.add(world, walls);

// 사운드 관련
const buttonStartSound = document.querySelector("#button_start_sound");
const mouseClickSound = document.querySelector("#mouse_click_sound");
const fruitsMurgeSound = document.querySelector("#fruits_murge_sound");
const fruitsLastmurgeSound = document.querySelector("#fruits_last_murge_sound");
const gameClear = document.querySelector("#game_clear");
const gameOver = document.querySelector("#game_over");
const bgM = document.querySelector("#bgm");

function playStartSound() {
  buttonStartSound.play();
}
function playmouseClickSound() {
  mouseClickSound.volume = 0.4;
  mouseClickSound.play();
}
function playfruitsMurgeSound() {
  fruitsMurgeSound.volume = 0.4;
  fruitsMurgeSound.play();
}
function playfruitsLastmurgeSound() {
  fruitsLastmurgeSound.play();
}
function playgameClear() {
  gameClear.play();
}
function playgameOver() {
  gameOver.play();
}
function playbgM() {
  bgM.play();
  bgM.volume = 0.2;
  bgM.loop = true;
}
function stopbgM() {
  bgM.pause();
}
const stopBGM = document.querySelector('.stopBGM');
function toggleBGM() {
  if (bgM.paused) {
    bgM.play();
    stopBGM.textContent = "BGM OFF";
  } else {
    bgM.pause();
    stopBGM.textContent = "BGM ON";
  }
}
stopBGM.addEventListener("click", toggleBGM);

// 변수 초기화
let currentBody = null;
let currentFruit = null;
let disableAction = false;
let interval = null;
let numFruits = 0;
let score = 0;
let highScore = localStorage.getItem("highScore") || 0; // 로컬 스토리지에서 하이스코어 가져오기
const scoreBox = document.getElementById("scoreBox");
const highScoreBox = document.getElementById("highScoreBox");
highScoreBox.innerText = highScore;

function playGame() {
  // 과일 추가 함수
  playbgM();
  function addFruit() {
    const index = Math.floor(Math.random() * numFruits);
    const fruit = FRUITS[index];

    const body = Bodies.circle(300, 50, fruit.radius, {
      index,
      isSleeping: true,
      render: { sprite: { texture: `${fruit.name}.png` }},
      restitution: 0.3,
    });

    currentBody = body;
    currentFruit = fruit;

    World.add(world, body);
  }

  // 키보드 이벤트 처리
  window.addEventListener("keydown", (event) => {
    if (disableAction) return;

    switch (event.code) {
      case "KeyA":
      case "KeyD":
        if (interval) return;

        interval = setInterval(() => {
          const direction = event.code === "KeyA" ? -1 : 1;
          const newPositionX = currentBody.position.x + direction;
          if (newPositionX >= 30 + currentFruit.radius && newPositionX <= 590 - currentFruit.radius)
            Body.setPosition(currentBody, { x: newPositionX, y: currentBody.position.y });
        }, 5);
        break;

      case "KeyS":
        currentBody.isSleeping = false;
        disableAction = true;

        playmouseClickSound();
        setTimeout(() => {
          addFruit();
          disableAction = false;
        }, 1000);
        break;
    }
  });

  // 키보드 이벤트 처리 (키 뗄 때)
  window.addEventListener("keyup", (event) => {
    if (event.code === "KeyA" || event.code === "KeyD") {
      clearInterval(interval);
      interval = null;
    }
  });

  // 하이스코어 업데이트 함수
  function updateHighScore() {
    highScore = Math.max(score, highScore);
    highScoreBox.innerText = highScore;
    localStorage.setItem("highScore", highScore); // 로컬 스토리지에 하이스코어 저장
  }

  // 충돌 이벤트 처리
  Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((collision) => {
      const { bodyA, bodyB } = collision;
      if (bodyA.index === bodyB.index) {
        const index = bodyA.index;

        if (index === FRUITS.length - 1) {
          setTimeout(() => {
            alert("Game CLEAR");
            // 게임 클리어 후 리로드
            window.location.reload();
          }, 500);
        }

        playfruitsMurgeSound();
        World.remove(world, [bodyA, bodyB]);
        const newFruit = FRUITS[index + 1];
        const newBody = Bodies.circle(collision.collision.supports[0].x, collision.collision.supports[0].y, newFruit.radius, {
          render: { sprite: { texture: `${newFruit.name}.png` }},
          index: index + 1,
        });
        score += index;
        scoreBox.innerText = score;
        updateHighScore(); // 점수가 증가할 때마다 하이스코어 업데이트

        World.add(world, newBody);

        // 난이도 조절
        if (numFruits < FRUITS.length) numFruits++;
      }

      if (!disableAction && (bodyA.name === "topLine" || bodyB.name === "topLine")) {
        alert("Game over");
        updateHighScore(); // 게임 오버 시 하이스코어 업데이트
        // 게임 오버 후 리로드
        window.location.reload();
      }
    });
  });

  // 마우스 이벤트 처리
  const canvasArea = document.querySelector('canvas');
  function handleMouseMovement(event) {
    if (!currentBody || disableAction) return;

    let mouseX = event.offsetX;
    if (mouseX < 30 + currentFruit.radius) mouseX = 30 + currentFruit.radius;
    else if (mouseX > 590 - currentFruit.radius) mouseX = 590 - currentFruit.radius;
    
    if (currentBody.position.y < 51) {
      Body.setPosition(currentBody, { x: mouseX, y: currentBody.position.y });
    }
  }

  function handleMouseDown(event) {
    if (!currentBody || disableAction) return;

    currentBody.isSleeping = false;
    disableAction = true;

    playmouseClickSound();
    setTimeout(() => {
      addFruit();
      disableAction = false;
    }, 1000);
    
    let mouseX = event.offsetX;
    if (mouseX < 30 + currentFruit.radius) mouseX = 30 + currentFruit.radius;
    else if (mouseX > 590 - currentFruit.radius) mouseX = 590 - currentFruit.radius;

    Body.setPosition(currentBody, { x: mouseX, y: currentBody.position.y });
  }

  canvasArea.addEventListener('mousemove', handleMouseMovement);
  canvasArea.addEventListener('mousedown', handleMouseDown);

  // 초기 과일 추가
  addFruit();
};

// 게임 시작
playGame();

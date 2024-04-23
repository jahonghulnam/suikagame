import { Bodies, Body, Engine, Events, Render, Runner, World } from "matter-js";
import { FRUITS_BASE, FRUITS_HLW } from "./fruits";
import "./dark.css";

let THEME = "base"; // { base, halloween }
let FRUITS = FRUITS_BASE;

switch (THEME) {
  case "halloween":
    FRUITS = FRUITS_HLW;
    break;
  default:
    FRUITS = FRUITS_BASE;
}
const engine = Engine.create();
const render = Render.create({
  engine,
  element: document.body,
  options: {
    wireframes: false,
    background: "#F7F4C8",
    width: 620,
    height: 850,
  }
});

const world = engine.world;

const leftWall = Bodies.rectangle(15, 395, 30, 790, {
  isStatic: true,
  render: { fillStyle: "#E6B143" }
});

const rightWall = Bodies.rectangle(605, 395, 30, 790, {
  isStatic: true,
  render: { fillStyle: "#E6B143" }
});

const ground = Bodies.rectangle(310, 820, 620, 60, {
  isStatic: true,
  render: { fillStyle: "#E6B143" }
});

const topLine = Bodies.rectangle(310, 150, 620, 2, {
  name: "topLine",
  isStatic: true,
  isSensor: true,
  render: { fillStyle: "#E6B143" }
})

World.add(world, [leftWall, rightWall, ground, topLine]);

Render.run(render);
Runner.run(engine);

let currentBody = null;
let currentFruit = null;
let disableAction = false;
let interval = null;
let numFruits = 0;

function addFruit() {
  const index = Math.floor(Math.random() * numFruits);
  const fruit = FRUITS[index];

  const body = Bodies.circle(300, 50, fruit.radius, {
    index: index,
    isSleeping: true,
    render: {
      sprite: { texture: `${fruit.name}.png` }
    },
    restitution: 0.3,
  });

  currentBody = body;
  currentFruit = fruit;

  World.add(world, body);
}

window.onkeydown = (event) => {
  if (disableAction) {
    return;
  }

  switch (event.code) {
    case "KeyA":
      if (interval)
        return;

      interval = setInterval(() => {
        if (currentBody.position.x - currentFruit.radius > 30)
          Body.setPosition(currentBody, {
            x: currentBody.position.x - 1,
            y: currentBody.position.y,
          });
      }, 5);
      break;

    case "KeyD":
      if (interval)
        return;

      interval = setInterval(() => {
        if (currentBody.position.x + currentFruit.radius < 590)
        Body.setPosition(currentBody, {
          x: currentBody.position.x + 1,
          y: currentBody.position.y,
        });
      }, 5);
      break;

    case "KeyS":
      currentBody.isSleeping = false;
      disableAction = true;

      setTimeout(() => {
        addFruit();
        disableAction = false;
      }, 1000);
      break;
  }
}

window.onkeyup = (event) => {
  switch (event.code) {
    case "KeyA":
    case "KeyD":
      clearInterval(interval);
      interval = null;
  }
}
// 스코어변수
let Score = 0;
const scoreBox = document.getElementById("scoreBox");

Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    if (collision.bodyA.index === collision.bodyB.index) {
      const index = collision.bodyA.index;

      if (index === FRUITS.length - 2) {
        setTimeout(() => {
          alert("Game CLEAR");
          // game clear이후 게임재기동
          history.go(0);
          //return;
        }, 500);
      }

      World.remove(world, [collision.bodyA, collision.bodyB]);

      const newFruit = FRUITS[index + 1];

      const newBody = Bodies.circle(
        collision.collision.supports[0].x,
        collision.collision.supports[0].y,
        newFruit.radius,
        {
          render: {
            sprite: { texture: `${newFruit.name}.png` }
          },
          index: index + 1,
        }
      );
      Score = Score + index;
      scoreBox.innerText = Score;
      World.add(world, newBody);

      // 난이도 조절 화면안의 과일이 몇단게인지 파악 순차적으로 5단계 과일까지만 생경나도록 random 변수
      if (numFruits < 5){
        numFruits ++;
      }
    }

    if (
      !disableAction &&
      (collision.bodyA.name === "topLine" || collision.bodyB.name === "topLine")) {
      alert("Game over");
      // game over이후 게임재기동
      history.go(0);
    }
  });
});


addFruit();


const canvasArea = document.querySelector('canvas');
function mousemove(event) {
  let mosusePositionX = event.offsetX;
  // 마우스위치가 현재과일의 반지금 더하기 왼쪽벽두께 보다 작으면
  if(mosusePositionX < 30 + currentFruit.radius){
    mosusePositionX = 30 + currentFruit.radius;
  }
  // 마우스위치가 현재과일의 반지금 더하기 오른쪽벽두께 보다 크면
  else if(mosusePositionX > 590 - currentFruit.radius){
    mosusePositionX = 590 - currentFruit.radius;
  }
  if (currentBody.position.y < 51 ){
    Body.setPosition(currentBody, {
      x: mosusePositionX,
      y: currentBody.position.y,
    });
  }
  console.log(
      'offsetX: ', event.offsetX, 'offsetY:', event.offsetY, 'currentBodyY:', currentBody.position.y)
}

// 마우스다운시 마우스 x위치로 과일이 이동하고 떨어진다.
function mousedown(event) {
  currentBody.isSleeping = false;
  disableAction = true;

  if (currentBody.position.y < 51 ){
    setTimeout(() => {
      addFruit();
      disableAction = false;
    }, 1000);
     
    let mosusePositionX = event.offsetX;
    // 마우스위치가 현재과일의 반지름 더하기 왼쪽벽두께 보다 작으면
    if(mosusePositionX < 30 + currentFruit.radius){
      mosusePositionX = 30 + currentFruit.radius;
    }
    // 마우스위치가 현재과일의 반지름 더하기 오른쪽벽두께 보다 크면
    else if(mosusePositionX > 590 - currentFruit.radius){
      mosusePositionX = 590 - currentFruit.radius;
    }
    Body.setPosition(currentBody, {
      x: mosusePositionX,
      y: currentBody.position.y,
    });
  }

}

canvasArea.addEventListener('mousemove', mousemove);
canvasArea.addEventListener('mousedown', mousedown);

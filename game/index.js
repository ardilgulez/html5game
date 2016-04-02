//CANVAS DECLARATIONS HERE
var canvas = document.createElement("canvas");
var context = canvas.getContext("2d");
document.body.appendChild(canvas);
//END OF CANVAS DECLARATIONS

//MAGIC NUMBERS HERE
var upKey = 87;
var downKey = 83;
var leftKey = 65;
var rightKey = 68;

var width = canvas.width = 512;
var height = canvas.height = 480;
var heroheight = 34;
var herowidth = 32;
var herospeed = 256;

var bulletheight = 4;
var bulletwidth = 4;
var bulletspeed = 500;
//END OF MAGIC NUMBERS

//GAME ASSETS DECLARATIONS
var GameAsset = function(src){
  this.image = new Image();
  this.image.src = src;
  this.ready = false;
  this.image.onload = function(){
    this.ready = true;
  };
};

var MovableGameAsset = function(src, speed, width, height){
  this.image = new Image();
  this.image.src = src;
  this.ready = false;
  this.speed = speed;
  this.width = width;
  this.height = height;
  this.image.onload = function(){
    this.ready = true;
  };
  this.x = (canvas.width/2) - this.width/2;
  this.y = (canvas.height/2) - this.height/2;
};

var socket = io();

socket.on("fire", function(data){
  //TODO: implement the logic for other people firing
  console.log("fire one");
});

var bullets = [];
var enemies = [];
//END OF GAME ASSETS DECLARATIONS
var bullet = new GameAsset("../assets/bullet.jpg");
var background = new GameAsset("../assets/bgImage.jpg");

var hero = new MovableGameAsset("../assets/hero.png", herospeed, herowidth, heroheight);

var testenemy = new MovableGameAsset("../assets/enemy.jpg", herospeed, 40, 42);
testenemy.width = herowidth;
testenemy.height = heroheight;
enemies.push(testenemy);

var keysDown = {};

canvas.tabIndex = 1;
canvas.addEventListener("keydown", function(e) {
	keysDown[e.keyCode] = true;
}, false);

canvas.addEventListener("keyup", function(e) {
	delete keysDown[e.keyCode];
}, false);

canvas.addEventListener("mousedown", function(e) {
  var xClick = getClickX(e);
  var yClick = getClickY(e);
  var bulletCenterX = hero.x + hero.width/2 - bulletwidth/2;
  var bulletCenterY = hero.y + hero.height/2 - bulletheight/2;
  var hypotenuse = Math.sqrt(Math.pow((xClick - bulletCenterX), 2) +Math.pow((yClick - bulletCenterY), 2));
  var bulletXDirection = (xClick - bulletCenterX) / hypotenuse;
  var bulletYDirection = (yClick - bulletCenterY) / hypotenuse;
  var bullet = {
    'x' : bulletCenterX,
    'y' : bulletCenterY,
    'dirX' : bulletXDirection,
    'dirY' : bulletYDirection
  };
  bullets.push(bullet);
  socket.emit('fire', bullet);
}, false);

function getClickX(e){
  var x;
  if (e.pageX){
    x = e.pageX;
  } else {
    x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
  }
  x -= canvas.offsetLeft;
  return x;
}

function getClickY(e){
  var y;
  if(e.pageY){
    y = e.pageY;
  } else {
    y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }
  y -= canvas.offsetTop;
  return y;
}

function update(timeDelta) { //timeDelta should be in seconds
  if(keysDown[leftKey]){
    hero.x = Math.max(0, (hero.x - hero.speed*timeDelta));
  }
  if(keysDown[upKey]){
    hero.y = Math.max(0, (hero.y - hero.speed*timeDelta));
  }
  if(keysDown[rightKey]){
    hero.x = Math.min((width-hero.width), hero.x + hero.speed*timeDelta);
  }
  if(keysDown[downKey]){
    hero.y = Math.min((height-hero.height), hero.y + hero.speed*timeDelta);
  }
  bullets.forEach(function(bulletData, bulletIndex, bulletArray){
    if(checkBulletCollision(bulletData) || checkBulletOutOfBounds(bulletData)){
      bulletArray.splice(bulletIndex, 1);
    } else {
      bulletData.x += bulletData.dirX*bulletspeed*timeDelta;
      bulletData.y += bulletData.dirY*bulletspeed*timeDelta;
    }
  });
}

function checkBulletOutOfBounds(bulletData){
  return !(bulletData.x > 0 && bulletData.x < canvas.width && bulletData.y > 0 && bulletData.y < canvas.height);
}

function checkBulletCollision(bulletData){
  console.log("CHECKING BULLET COLLISION");
  var collisionHappened = false;
  enemies.forEach(function(enemy){
    var enemyOR = {
      "x1" : enemy.x - bulletwidth,
      "y1" : enemy.y - bulletheight,
      "x2" : enemy.x + enemy.width + 2*bulletwidth -2,
      "y2" : enemy.y + enemy.height + 2*bulletheight -2
    };
    if(checkCollisionCondition(enemyOR, bulletData)) {
      console.log("COLLISION HAPPENED");
      collisionHappened = true;
    }
  });
  return collisionHappened;
}

function checkCollisionCondition(enemyOR, bulletData){
  var centerX = ((enemyOR.x2+enemyOR.x1)/2);
  var centerY = ((enemyOR.y2+enemyOR.y1)/2);
  var condition1 = enemyOR.x1 <= bulletData.x;
  var condition2 = enemyOR.x2 >= bulletData.x;
  var condition3 = enemyOR.y1 <= bulletData.y;
  var condition4 = enemyOR.y2 >= bulletData.y;
  return condition1 && condition2 && condition3 && condition4;
}

var init = function() {
  if(background.ready){
    context.drawImage(background.image, 0, 0);
    context.save();
  }
  if(hero.ready){
    context.drawImage(hero.image, hero.x, hero.y);
  }
};

var then = new Date().getTime();
var w = window;
requestAnimationFrame =
              w.requestAnimationFrame ||
              w.webkitRequestAnimationFrame ||
              w.msRequestAnimationFrame ||
              w.mozRequestAnimationFrame;

var render = function() {
  context.restore();
  context.clearRect(0, 0, width, height);
  context.drawImage(background.image, 0, 0);
  bullets.forEach(function(bulletData) {
    context.drawImage(bullet.image, bulletData.x, bulletData.y);
  });
  enemies.forEach(function(enemy){
    context.drawImage(enemy.image, enemy.x, enemy.y);
  });
  context.drawImage(hero.image, hero.x, hero.y);
};

var gameLoop = function() {
  var now = new Date().getTime();
  var delta = now - then;
  update(delta/1000);
  render();
  then = now;
  requestAnimationFrame(gameLoop);
};

init();
gameLoop();

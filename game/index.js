//CANVAS DECLARATIONS HERE
var canvas = document.getElementById("gamecanvas");
var context = canvas.getContext("2d");
//END OF CANVAS DECLARATIONS

//MAGIC NUMBERS HERE
var upKey = 87;
var downKey = 83;
var leftKey = 65;
var rightKey = 68;

var width = canvas.width = 512;
var height = canvas.height = 480;
var heroheight = 34;
var herowidth = 28;
var herospeed = 256;

var bulletheight = 4;
var bulletwidth = 4;
var bulletspeed = 500;
var needlist = true;
var joined = false;
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
  this.username = undefined;
  this.lasthitter = undefined;
  this.health = undefined;
  this.image.onload = function(){
    this.ready = true;
  };
  this.x = (canvas.width * Math.random()) - this.width/2;
  this.y = (canvas.height * Math.random()) - this.height/2;
};

var enemyImageReady = false;
var enemyImage = new Image();
enemyImage.src = "../assets/enemy.png";
enemyImage.onload = function(){
  enemyImageReady = true;
};
//END OF GAME ASSETS DECLARATIONS

var socket = io();

socket.on("welcome", function(data){
  //TODO: implement the logic for other people joining
  console.log(data);
});

socket.on("joinfail", function(data){
  alert(data);
});

socket.on("joingame", function(data){
  document.getElementById("joinbutton").style.display = "none";
  document.getElementById("leavebutton").style.display = "inline";
  socket.emit("spawn", hero);
  joined = true;
});

socket.on("get list", function(data){
  if(needlist){
    enemies = data;
    needlist = false;
  }
  enemies[hero.username] = hero;
});

socket.on("fire", function(data){
  //TODO: implement the logic for other people firing
  data.x += data.dirX * 500 * ((new Date().getTime()) - data.time) / 1000;
  data.y += data.dirY * 500 * ((new Date().getTime()) - data.time) / 1000;
  console.log(bullets.length);
  bullets.push(data);
  console.log("FIRE ONE", data);
  console.log(bullets.length);
});

socket.on("move", function(data){
  enemies[data.username].x = data.x;
  enemies[data.username].y = data.y;
  //TODO: implement the logic for other people moving
});

socket.on("spawn", function(data){
  enemies[data.username] = data;
  //TODO: implement the logic for other people spawning
});

socket.on("die", function(data){
  delete enemies[data.username];
  console.log(data.username, data.lasthitter);
  if(data.lasthitter){
    console.log(data.username, 'has been killed by', data.lasthitter);
  }
});

//END OF GAME ASSETS DECLARATIONS
var bullet = new GameAsset("../assets/bullet.jpg");
var background = new GameAsset("../assets/bgImage.jpg");
var joinscreen = new GameAsset("../assets/join.jpg");

var hero = new MovableGameAsset("../assets/hero.png", herospeed, herowidth, heroheight);
hero.health = 100;

var keysDown = {};
var bullets = [];
var enemies = {};

canvas.tabIndex = 1;
canvas.addEventListener("keydown", function(e) {
	keysDown[e.keyCode] = true;
}, false);

canvas.addEventListener("keyup", function(e) {
	delete keysDown[e.keyCode];
}, false);

canvas.addEventListener("click", function(e) {
  if(joined){
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
      'dirY' : bulletYDirection,
      'time' : new Date().getTime(),
      'username' : hero.username
    };
    bullets.push(bullet);
    socket.emit("fire", bullet);
  }
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
  var moving = false;
  if(keysDown[leftKey]){
    hero.x = Math.max(0, (hero.x - hero.speed*timeDelta));
    moving = true;
  }
  if(keysDown[upKey]){
    hero.y = Math.max(0, (hero.y - hero.speed*timeDelta));
    moving = true;
  }
  if(keysDown[rightKey]){
    hero.x = Math.min((width-hero.width), hero.x + hero.speed*timeDelta);
    moving = true;
  }
  if(keysDown[downKey]){
    hero.y = Math.min((height-hero.height), hero.y + hero.speed*timeDelta);
    moving = true;
  }
  if(moving){
    socket.emit("move", hero);
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
  var collisionHappened = false;
  for(var name in enemies){
    if(bulletData.username !== name){
      var enemyOR = {
        "x1" : enemies[name].x - bulletwidth,
        "y1" : enemies[name].y - bulletheight,
        "x2" : enemies[name].x + enemies[name].width + 2*bulletwidth -2,
        "y2" : enemies[name].y + enemies[name].height + 2*bulletheight -2
      };
      if(checkCollisionCondition(enemyOR, bulletData)) {
        //enemies[name].lasthitter = bulletData.username;
        if(hero.username === name){
          hero.lasthitter = bulletData.username;
          console.log(hero.lasthitter);
          hero.health -= 10;
          if(hero.health <= 0){
            handleDeath();
          }
        }
        collisionHappened = true;
      }
    }
  }
  return collisionHappened;
}

var handleDeath = function(){
  joined = false;
  document.getElementById("joinbutton").style.display = "inline";
  document.getElementById("leavebutton").style.display = "none";
  socket.emit("die", hero);
  delete hero.lasthitter;
};

function checkCollisionCondition(enemyOR, bulletData){
  var centerX = ((enemyOR.x2+enemyOR.x1)/2);
  var centerY = ((enemyOR.y2+enemyOR.y1)/2);
  var condition1 = enemyOR.x1 <= bulletData.x;
  var condition2 = enemyOR.x2 >= bulletData.x;
  var condition3 = enemyOR.y1 <= bulletData.y;
  var condition4 = enemyOR.y2 >= bulletData.y;
  return condition1 && condition2 && condition3 && condition4;
}

var joinAction = function(){
  hero.username = document.getElementById("usernamebox").value;
  hero.health = 100;
  socket.emit("joingame", {"username" : hero.username});
};

var leaveAction = function() {
  joined = false;
  document.getElementById("joinbutton").style.display = "inline";
  document.getElementById("leavebutton").style.display = "none";
  socket.emit("die", hero);
  delete hero.lasthitter;
};

var gameInit = function() {
  if(joined){
    if(background.ready){
      context.drawImage(background.image, 0, 0);
      context.save();
    }
    if(hero.ready){
      context.drawImage(hero.image, hero.x, hero.y);
    }
  }
};

var then = new Date().getTime();
var w = window;
requestAnimationFrame =
              w.requestAnimationFrame ||
              w.webkitRequestAnimationFrame ||
              w.msRequestAnimationFrame ||
              w.mozRequestAnimationFrame;

var renderGame = function() {
  context.restore();
  context.clearRect(0, 0, width, height);
  context.drawImage(background.image, 0, 0);
  console.log(bullets.length);
  bullets.forEach(function(bulletData) {
    context.drawImage(bullet.image, bulletData.x, bulletData.y);
  });
  for(var name in enemies){
    if(hero.username !== name){
      context.drawImage(enemyImage, enemies[name].x, enemies[name].y);
    }
  }
  context.drawImage(hero.image, hero.x, hero.y);
};

var renderJoin = function() {
  context.clearRect(0, 0, width, height);
  context.drawImage(joinscreen.image, 0, 0);
};

var gameLoop = function() {
  if(joined){
    var now = new Date().getTime();
    var delta = now - then;
    update(delta/1000);
    renderGame();
    then = now;
  } else {
    renderJoin();
  }
  requestAnimationFrame(gameLoop);
};

gameInit();
gameLoop();

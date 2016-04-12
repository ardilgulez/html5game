//CANVAS DECLARATIONS HERE
var canvas = document.getElementById("gamecanvas");
var context = canvas.getContext("2d");
context.font = "12px serif";
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
  this.room = undefined;
  this.id = undefined;
  this.kills = 0;
  this.deaths = 0;
  this.image.onload = function(){
    this.ready = true;
  };
  this.x = (canvas.width * Math.random()) - this.width;
  this.y = (canvas.height * Math.random()) - this.height;
};

var enemyImageReady = false;
var enemyImage = new Image();
enemyImage.src = "../assets/enemy.png";
enemyImage.onload = function(){
  enemyImageReady = true;
};

var bullets = [];
var enemies = {};
var killList = [];
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
  hero.x = Math.max(0, (canvas.width * Math.random()) - hero.width);
  hero.y = Math.max(0, (canvas.height * Math.random()) - hero.height);
  socket.emit("spawn", hero);
  joined = true;
});

socket.on("get list", function(data){
  if(needlist){
    console.log("DATA:", data);
    enemies = data;
    needlist = false;
  }
  enemies[hero.id] = hero;
});

socket.on("fire", function(data){
  data.x += data.dirX * 500 * ((new Date().getTime()) - data.time) / 1000;
  data.y += data.dirY * 500 * ((new Date().getTime()) - data.time) / 1000;
  bullets.push(data);
});

socket.on("move", function(data){
  enemies[data.id].x = data.x;
  enemies[data.id].y = data.y;
});

socket.on("spawn", function(data){
  enemies[data.id] = data;
});

socket.on("die", function(data){
  console.log("SOMEONE DIED:", JSON.stringify(data, null, 2));
  if(data.lasthitter){
    console.log(data.lasthitter);
    if(data.lasthitter === hero.id){
      hero.kills += 1;
    }
    killList.reverse();
    killList.push({"kill" : data.killer, "die" : data.username, "time" : new Date().getTime()});
    killList.reverse();
  }
  setTimeout(function(){
    delete enemies[data.id];
  }, 50);
});

//END OF GAME ASSETS DECLARATIONS
var bullet = new GameAsset("../assets/bullet.jpg");
var background = new GameAsset("../assets/bgImage.jpg");
var joinscreen = new GameAsset("../assets/join.jpg");

var hero = new MovableGameAsset("../assets/hero.png", herospeed, herowidth, heroheight);
hero.health = 100;

var keysDown = {};

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
      'userid' : hero.id,
      'room' : hero.room
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
    if(bulletData.userid !== name){
      var enemyOR = {
        "x1" : enemies[name].x - bulletwidth,
        "y1" : enemies[name].y - bulletheight,
        "x2" : enemies[name].x + enemies[name].width + 2*bulletwidth -2,
        "y2" : enemies[name].y + enemies[name].height + 2*bulletheight -2
      };
      if(checkCollisionCondition(enemyOR, bulletData)) {
        console.log(hero.id, name);
        if(hero.id === name){
          console.log(bulletData.userid);
          hero.lasthitter = bulletData.userid;
          console.log(hero.lasthitter);
          hero.health -= 10;
        }
        collisionHappened = true;
      }
    }
  }
  return collisionHappened;
}

var handleLeaveOrDeath = function(){
  joined = false;
  needlist = true;
  document.getElementById("joinbutton").style.display = "inline";
  document.getElementById("leavebutton").style.display = "none";
  hero.deaths += 1;
  console.log(hero.lasthitter);
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
  if(!document.getElementById("usernamebox").value || document.getElementById("usernamebox").value.trim().length <= 0 ||
     !document.getElementById("roomnamebox").value || document.getElementById("roomnamebox").value.trim().length <= 0){
    alert("Username or Roomname can not be left empty");
    return;
  }
  hero.username = document.getElementById("usernamebox").value;
  hero.room = document.getElementById("roomnamebox").value;
  hero.health = 100;
  hero.id = '/#' + socket.id.toString();
  console.log(socket.id);
  console.log(hero.id);
  socket.emit("joingame", {"id" : hero.id, "username" : hero.username, "room" : hero.room});
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
  bullets.forEach(function(bulletData) {
    context.drawImage(bullet.image, bulletData.x, bulletData.y);
  });
  for(var name in enemies){
    if(hero.username !== name){
      context.drawImage(enemyImage, enemies[name].x, enemies[name].y);
    }
  }
  context.drawImage(hero.image, hero.x, hero.y);
  context.textAlign = "right";
  context.font = "12px Times New Roman";
  context.fillText("Kills: " + hero.kills, canvas.width - 5, 15);
  context.fillText("Deaths: " + hero.deaths, canvas.width - 5, 30);
};

var renderJoin = function() {
  context.clearRect(0, 0, width, height);
  context.drawImage(joinscreen.image, 0, 0);
};

var renderKills = function() {
  context.font = "12px Times New Roman";
  context.textAlign = "left";
  killList.forEach(function(kill, killIndex, killArray){
    if(new Date().getTime() - kill.time >= 3000){
      killArray.splice(killIndex, 1);
    } else {
      context.fillText(kill.kill + " -> " + kill.die, 0, 15*(killIndex + 1));
    }
  });
};

var renderHealth = function(){
  context.font = "24px Times New Roman";
  context.textAlign = "right";
  context.fillText(hero.health, 40, canvas.height-40);
};

var gameLoop = function() {
  if(joined){
    var now = new Date().getTime();
    var delta = now - then;
    update(delta/1000);
    renderGame();
    renderKills();
    renderHealth();
    if(hero.health <= 0){
      handleLeaveOrDeath();
    }
    then = now;
  } else {
    renderJoin();
  }
  requestAnimationFrame(gameLoop);
};

gameInit();
gameLoop();

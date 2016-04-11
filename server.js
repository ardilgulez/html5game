var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var fs = require('fs');
var livingplayers = {};
var players = {};

server.listen(3000);

app.use(express.static('game'));
app.use('/assets', express.static('assets'));

app.get('/', function(req, res, next){
  res.sendFile(__dirname + '/game/index.html');
});

io.on('connection', function(socket){
  console.log('SOMEONE CONNECTED:', socket.id);
  socket.emit('welcome', 'HEY DUDE YOU SHOULD TOTALLY JOIN');

  socket.on('joinlobby', function(data){

  });

  socket.on('joingame', function(data){
    if(livingplayers[data.room] && livingplayers[data.room][data.id]){
      socket.emit('joinfail', 'That name is taken');
    } else {
      socket.join(data.room);
      socket.emit('joingame', data);
    }
  });

  socket.on('spawn', function(data){
    if(!livingplayers[data.room]){
      console.log('NOBODY IN THE ROOM BEFORE');
      livingplayers[data.room] = {};
    }
    socket.emit('get list', livingplayers[data.room]);
    livingplayers[data.room][data.id] = data;
    socket.broadcast.to(data.room).emit('spawn', data);
  });

  socket.on('move', function(data){
    livingplayers[data.room][data.id].x = data.x;
    livingplayers[data.room][data.id].y = data.y;
    socket.broadcast.to(data.room).emit('move', data);
  });

  socket.on('fire', function(data){
    socket.broadcast.to(data.room).emit('fire', data);
  });

  socket.on('die', function(data){
    if(data.lasthitter) {
      livingplayers[data.room][data.lasthitter].kills += 1;
    }
    socket.leave(data.room);
    livingplayers[data.room][data.id].deaths += 1;
    data.killer = livingplayers[data.room][data.id].username;
    delete livingplayers[data.room][data.id];
    socket.broadcast.to(data.room).emit('die', data);
  });

  socket.on('disconnect', function(data){
    console.log('SOMEONE DISCONNECTED:', socket.id);
  });
});

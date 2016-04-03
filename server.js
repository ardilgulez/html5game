var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var livingplayers = {};

server.listen(3000);

app.use(express.static('game'));
app.use('/assets', express.static('assets'));

app.get('/', function(req, res, next){
  res.sendFile(__dirname + '/game/index.html');
});

io.on('connection', function(socket){
  console.log('SOMEONE CONNECTED');
  socket.emit('welcome', 'HEY DUDE YOU SHOULD TOTALLY JOIN');

  socket.on('joingame', function(data){
    if(livingplayers[data.username]){
      socket.emit('joinfail', 'That name is taken');
    } else {
      socket.emit('joingame', data);
    }
  });

  socket.on('spawn', function(data){
    socket.emit('get list', livingplayers);
    livingplayers[data.username] = data;
    socket.broadcast.emit('spawn', data);
  });

  socket.on('move', function(data){
    socket.broadcast.emit('move', data);
  });

  socket.on('fire', function(data){
    socket.broadcast.emit('fire', data);
  });

  socket.on('die', function(data){
    if(data.lasthitter) {
      livingplayers[data.lasthitter].kills += 1;
    }
    livingplayers[data.username].deaths += 1;
    for(var name in livingplayers){
      console.log(name, livingplayers[name].kills, livingplayers[name].deaths);
    }
    delete livingplayers[data.username];
    socket.broadcast.emit('die', data);
  });

  socket.on('disconnect', function(data){
    console.log('SOMEONE DISCONNECTED');
  });
});

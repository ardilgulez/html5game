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
    console.log(data.username, 'has joined.');
    if(livingplayers[data.username]){
      socket.emit('joinfail', 'That name is taken');
    } else {
      //TODO: go back to: socket.broadcast.to('game room').emit('move', data);
      io.sockets.emit('joingame', data);
    }
  });

  socket.on('spawn', function(data){
    console.log('LET\'S GET IT ON', data);
    //TODO: socket.broadcast.to('game room').emit('move', data);
    socket.emit('get list', livingplayers);
    livingplayers[data.username] = data;
    console.log(JSON.stringify(livingplayers, null, 2));
    socket.broadcast.emit('spawn', data);
  });

  socket.on('move', function(data){
    console.log('MOOVIT BABY', data);
    //TODO: go back to socket.broadcast.emit
    socket.broadcast.emit('move', data);
  });

  socket.on('fire', function(data){
    console.log('FIRE ONE', data);
    //TODO: go back to socket.broadcast.emit
    //socket.broadcast.to('game room').emit('fire', data);
    socket.broadcast.emit('fire', data);
  });

  socket.on('die', function(data){
    console.log('SEE YOU NEXT TIME', data);
    //TODO: go back to socket.broadcast.emit
    socket.broadcast.to('game room').emit('die', data);
  });

  socket.on('disconnect', function(data){
    console.log('SOMEONE DISCONNECTED');
  });
});

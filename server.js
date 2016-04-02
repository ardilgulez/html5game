var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

server.listen(3000);

app.use(express.static('game'));
app.use('/assets', express.static('assets'));

app.get('/', function(req, res, next){
  res.sendFile(__dirname + '/game/index.html');
});

io.on('connection', function(socket){
  console.log('SOMEONE CONNECTED');
  socket.emit('welcome', 'HEY DUDE!!1!1');

  socket.on('fire', function(data){
    console.log('FIRE ONE', data);
    //TODO: go back to socket.broadcast.emit
    io.sockets.emit('fire', data);
  });

  socket.on('disconnect', function(){
    console.log('SOMEONE DISCONNECTED');
  });
});

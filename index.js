var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var database = require("./database.js");


app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade');
app.set('views', __dirname + '/');
app.engine('.html', require('jade').__express);

app.get('/', function(req, res){
   res.render('index.jade');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

io.on('connection', function(socket){

  socket.on('set username', function(username) {
    database.validateUser(username, socket.id, function(err, result){
      console.log('Result' + result);
      if(result)
      {   
        newUserJoin(username);
        usernameAvailable(socket, username, result);
      }
      else
      {
        usernameAlreadyInUse(socket);
      }
    });
  });

   socket.on('load history', function(){
    database.readAllMessages(function(err, results){
        if(results)
        {
          loadMessageHistory(socket, results)
        }
    });
  })

  socket.on('message', function(msg){
    console.log('emitting chat message : ' + msg.userId  + ", " + msg.username);
    database.addMessage(msg.userId, msg.username,msg.message, function(err, result){
        if(result)
        {
          io.emit('message', result);
        }
        else
        {
          messageError(socket);
        }
    });
  });

  socket.on('disconnect', function(){
    database.deactivateUser(socket.id, function(err, result){
        if(result)
        {
            userLeft(result.username);
        }
    });
    console.log("User has disconnected");
  });

  socket.on('error', function(err){
    console.log("Error on the server " + err);
  });

});

function newUserJoin(username) {
    io.emit('userJoined', { "username": username});
}

function userLeft(username) {
    io.emit('userLeft', { "username": username });
}

function usernameAvailable(socket, username, userId) {
  setTimeout(function() {
    console.log('Sending welcome msg to ' +userId +"," + username + ' at ' + socket.id);
    socket.emit('welcome', { "username" : username,"userid" : userId});
    }, 500);
}

function usernameAlreadyInUse(socket) {
    setTimeout(function() {
    socket.emit('usernameError', { "userNameInUse" : true });
    }, 500);
}

function messageError(socket)
{
  setTimeout(function(){
    socket.emit("messageError", {"failedToSendMessage" : true})
  }, 500);
}

function loadMessageHistory(socket, rows)
{
    setTimeout(function(){
        rows.forEach(function(row){
              socket.emit("message", row);
           });
    },500);
}


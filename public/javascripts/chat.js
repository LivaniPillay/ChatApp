var socket = io.connect();
var myUsername;
var userId;

console.log("Script loaded");

function enableMsgInput(enable) {
  $('input#message').prop('disabled', !enable);
}

function enableUsernameField(enable) {
  $('input#username').prop('disabled', !enable);
}

function sendMessage() {
    var trgtUser = $('ul#messages').val();
    socket.emit('message', 
                {
                  "inferSrcUser": true,
                  "source": "",
                  "message": $('input#message').val(),
                  "username": myUsername,
                  "userId" : userId,
                  "target": trgtUser
                });
	$('input#message').val("");
}

function appendNewMessage(username, message, date)
{	
	 $('ul#messages').append($("<li> "+ username + " : " + message + "<span class='date'>" +date +"</span></li>"));
	 $('input#message').val('');
	 return false;
}

function setUsername() {
	myUsername = $('input#username').val();
    socket.emit('set username', myUsername, function(data) {
     console.log('emit set username', data); 
 	});
 	$('button#join').addClass("hide");
}

function appendNewUser(username, notify) {
  if (notify && (myUsername !== username))
    $('ul#messages').append("<li class='adminMessage'>" + username + " has joined the chat room. </li>")
}

function setFeedback(username) {
  $('ul#messages').append("<li class='adminMessage'> Welcome to the chat room, " + username + "</li>")
}

function handleUserLeft(msg) {
	$('ul#messages').append("<li class='adminMessage'> " + msg.username + " has left the chat room.</li>")
}

$(function(){

	enableMsgInput(false);

	socket.on('userJoined', function(msg) {
    	appendNewUser(msg.username, true);
  	});

  	socket.on('userLeft', function(msg) {
    	handleUserLeft(msg);
  	});

	socket.on('message', function(msg) {
    	appendNewMessage(msg.username, msg.message, msg.dateTime);
  	});

	socket.on('welcome', function(msg) {
	   userId = msg.userid;
	   setFeedback(msg.username);
	   enableMsgInput(true);
	   enableUsernameField(false);

	   socket.emit('load history', function(data){
	   		console.log("Loading chat history for " + myUsername);
	   });
	   
	});

	socket.on('usernameError', function(msg) {
		  if (msg.userNameInUse) {
			  $('ul#messages').append("<li style='color: red'> Username already in use. Please try another name.</li>");
			  $('button#join').removeClass("hide");
			  $('button#join').addClass("show");
		  }
	});

	socket.on('messageError', function(msg){
		if(msg.failedToSendMessage)
		{
			$('ul#messages').append("<li style='color: red'> Message failed to send.</li>")
		}
	});

  	$('input#username').keypress(function(e) {
	  if (e.keyCode == 13) {
		  setUsername();
		  e.stopPropagation();
		  e.stopped = true;
		  e.preventDefault();
	  	}
  	});

  	$('button#join').click(function(e){
		  setUsername();
  	});

	$('input#message').keypress(function(e) {
	  if (e.keyCode == 13) {
		  sendMessage();
		  e.stopPropagation();
		  e.stopped = true;
		  e.preventDefault();
	  }
  	});

	$('button#post').click(function(e) {
		  sendMessage();
  	});

});

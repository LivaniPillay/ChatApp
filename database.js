var sqlite3 = require('sqlite3').verbose();
var db;
var activeUser =1;
var inactiveUser =0;
var exports = module.exports = {};

startDatabase();

function createDb() {
    console.log("createDb chatApplication");
    db = new sqlite3.Database('chatApplication.sqlite3', createTable);
}

function createTable() {
    console.log('reseting database');
    resetDb();

    console.log("createTable users");
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," +
    	"username VARCHAR(255),active INTEGER, socketId VARCHAR(255) NULL)");

    console.log("createTable messages");
	  db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," +
    	"userId INTEGER NOT NULL, username VARCHAR(255), message VARCHAR(255), dateTime DATETIME)");

}

exports.validateUser = function(username, socketId, callback){
  db.get("SELECT * FROM users WHERE username ='"+ username +"'", function(err, row)
  { 
      if(err)
      {
          console.log("Error: " + err);
      }
      else
      {
        console.log("Validating user name : socketId=" +socketId+ " username =  " + username);    
          if(row == null)
          {
              console.log("No entries found. Inserting user.");
              insertUser(username,socketId, function(err, result){
                      callback(err,result);         
              });
             
          }
          else
          { 
            console.log("Active " + row.active);

            if(row.active ==1)
            {
                callback(null, null);
            }
            else
            {
                activateUser(row.id, socketId, function(err, result){
                    callback(err,result)
                })
            }
          }
      }
  });
}

function insertUser(username,socketId, callback) {
    console.log("insertRows into users");
    var stmt = db.prepare("INSERT INTO users (username,active, socketId) VALUES (?,?,?)");    

    stmt.run(username,activeUser,socketId);

    stmt.finalize(getUserIdByUsername(username, function(err, result){
        callback(err,result);
    }));

}

function activateUser(userId, socketId, callback)
{
     db.run("UPDATE users SET active = ?, socketId = ? WHERE id = ?", activeUser, socketId, userId);
     callback(null,userId);
}

exports.deactivateUser = function(socketId, callback)
{
  getUserIdBySocket(socketId, function(err, result){
      if(result != null)
      {
        console.log('Disabling user ' +result);
        db.run("UPDATE users SET active = ?, socketId = null WHERE id = ?", inactiveUser, result);

        getUser(result, function(err, row){
            callback(err, row);
        });    
      }
      else
      {
        console.log("Attempting to deactivating user " + result + ". Unable to indentify user to deactivate.");
        callback(err, result);
      }
  });
  
}

function getUserIdByUsername(username, callback)
{
    console.log("Getting ID for " + username);

    db.get("SELECT * FROM users WHERE username ='" + username + "'", function(err, row)
    {
        if(err)
        {
         console.log("Error when trying to get user id for " + username +"." + err);
         callback(err,null);
        }
        else
        {
          if(row ==null){
              console.log("no result for " + username);
              callback(null,null);
          } 
          else
          {   
              console.log("User: : " + row.id + "," + row.username);
              callback(null, row.id);
          }
        }
    });
}

function getUser(userId, callback)
{
    console.log('Getting user for ' + userId);
    db.get("SELECT * FROM users WHERE id = '"+userId + "'", function(err,row){
        if(err)
        {
          console.log("Error occured while finidng user." + err);
          callback(err, null);
        }
        else
        {
          if(row == null)
          {
              console.log("no results for " + userId);
              callback(null, null);
          }
          else
          {
              callback(null,row);
          }
        }
    });
}

function getUserIdBySocket(socketId, callback)
{
    console.log("Getting ID for " + socketId);

    db.get("SELECT * FROM users WHERE socketId ='" + socketId + "'", function(err, row)
    {
        if(err)
        {
         console.log("Error when trying to get user id for " + socketId +"." + err);
         callback(err, null);
        }
        else
        {
          if(row == null){
              console.log("no result for " + socketId);
              callback(null, null);
          } 
          else
          {
              console.log("User: : " + row.id + "," + row.username);
              callback(null, row.id);
          }
        }
    });
}

exports.addMessage = function(userId,username,message, callback){

  console.log("Adding message " + userId + "," + username + "," +message)
  if(userId != null)
  {    
    insertMessage(userId, username, message, function(err, result){
          callback(err,result);
    });
  }
 else{
    console.log("Attempting to send message for user " + username + ". Unable to indentify user.");
    callback(null, null);
  }
}

function insertMessage(userId, username, message,callback) {
 
    console.log("Insert Message into messages");
      
    var stmt = db.prepare("INSERT INTO messages (userId,username, message, dateTime) VALUES (?,?,?,datetime('now'))");

    stmt.run(userId, username, message);

    stmt.finalize(getLatestUserMessage(userId, function(err, result){
       callback(err,result);
    }));
}

function getLatestUserMessage(userId, callback)
{
  db.get("SELECT * FROM messages WHERE userId ='" + userId + "' ORDER BY dateTime DESC", function(err, row)
    {
        if(err)
        {
         console.log("Error when trying to get message for " + userId +"." + err);
         callback(err,null);
        }
        else
        { 
            console.log('Latest Message ' +row.message);

          if(row ==null){
              console.log("no message result for " + userId);
              callback(null,null);
          } 
          else
          {
            callback(null, row);
          }
        }
    });
}


function readAllUsers(callback) {
    console.log("readAllRows users");
    db.all("SELECT * FROM users", function(err, rows) {
    if(err)
    {
      console.log("Error reading messages: " +err);
      callback(err,null);
    }
    else
    {
        if(rows.length ==0)
        {
            console.log('No users');
            callback(null, null);
        }
        else{
          callback(null, rows); 
        }
    }       
    });
}

exports.readAllMessages = function (callback){
	db.all("SELECT * FROM messages", function(err, rows){
    if(err)
    {
      console.log("Error reading messages: " +err);
      callback(err, null);
    }
    else
    {
      if(rows.length ==0)
        {
            console.log("No messages");
            callback(null, null);
        }
        else
        {
           callback(null, rows); 
        }
    }  
  });
}

function resetDb()
{
    console.log('Resetting database');
    db.run("delete from messages"); 
    db.run("delete from users");
}

function dropUserTable()
{
    console.log("Dropping user table");
    db.run("drop table users");
}

function dropMessageTable()
{
    console.log("Dropping massages table");
    db.run("drop table messages");
}

function closeDb() {
    console.log("closeDb");
    db.close();
}

function startDatabase() {
    createDb();
}
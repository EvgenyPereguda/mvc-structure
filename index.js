const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");


const server = http.createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

let typingUsers = new Array();

let currentUsersMap = new Map();

io.on('connection', (socket) => {

  let lId = socket.id;
  
  socket.on('chat message', (msg) => {
    socket.broadcast.emit('chat message', `${currentUsersMap.get(lId)}: ${msg}`);
  });

  socket.on('user is typing', (msg) => {
    if(!typingUsers.includes(currentUsersMap.get(lId)))
      typingUsers.push(currentUsersMap.get(lId))
  });  

  socket.on('register user', (msg) => {
    socket.broadcast.emit("connection", `a ${msg} connected`);

    currentUsersMap.set(lId, msg);
  });  

  socket.on('rename user', (msg) => {
    currentUsersMap.set(lId, msg);
  });   

  socket.on("disconnect", () => {    
    currentUsersMap.delete(lId);
  });
  
});


io.on('disconnect', (socket) => {
  console.log('disconnect');
  socket.broadcast.emit('user is disconnect', "");
  currentUsersMap.delete(socket);
});


server.listen(8080, () => {
  console.log("listening on http://localhost:8080");
});

function statusIsTypingCheck(){
  
  if(typingUsers.length == 0)
  {    
    io.emit('users are typing', "");
    
    return;
  }

  let listTypingUsers = "";

  for (let index = 0; index < typingUsers.length; index++) {
    listTypingUsers += ", " + typingUsers[index];    
  }

  listTypingUsers = listTypingUsers.substring(1);

  listTypingUsers = typingUsers.length == 1? `${listTypingUsers} is typing` : `${listTypingUsers} are typing`;

  typingUsers = new Array();

  io.emit('users are typing', listTypingUsers);

}

setInterval(statusIsTypingCheck, 1000)


function statusIsOnlineCheck(){
  
  if(currentUsersMap.size == 0)
  {        
      return;
  }

  let listOnlineUsers = "";

  currentUsersMap.forEach((value) => {
    listOnlineUsers += ", " + value;    
  })

  listOnlineUsers = listOnlineUsers.substring(1);

  listOnlineUsers = currentUsersMap.size == 1? `${listOnlineUsers} is online` : `${listOnlineUsers} are online`;

  io.emit('users are online', listOnlineUsers);

}

setInterval(statusIsOnlineCheck, 1000)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});

app.use(express.static('public'));

let nicknames = {};
let rooms = {}; // socket.id -> room

io.on('connection', (socket) => {
  console.log(`[${socket.id}] user connected`);

  socket.on('join room', ({ nickname, room }) => {
    for (const [id, name] of Object.entries(nicknames)) {
      console.log(name, nickname);
      if (name === nickname) {
        io.to(socket.id).emit('dup_nickname', '이미 존재하는 닉네임입니다.');
        console.log('이미 존재하는 닉네임');
        return;
      }
    }
    nicknames[socket.id] = nickname;
    rooms[socket.id] = room;
    socket.join(room);

    console.log(`[${socket.id}] ${nickname}님이 [${room}] 방에 입장`);

    io.to(room).emit('notice', `🟢 ${nickname}님이 입장하였습니다.`);
    io.to(room).emit('users', getUsersInRoom(room));
  });

  socket.on('chat message', ({ room, message }) => {
    const nickname = nicknames[socket.id] || '알 수 없음';
    console.log(`[${nickname}] [${room}] ${message}`);
    io.to(room).emit('chat message', { id: socket.id, nickname, message });
  });

  socket.on('disconnect', () => {
    const nickname = nicknames[socket.id] || '알 수 없음';
    const room = rooms[socket.id];

    io.to(room).emit('notice', `🔴 ${nickname}님이 퇴장하였습니다.`);

    console.log(`[${socket.id}] (${nickname}) user disconnected`);
    delete nicknames[socket.id];
    delete rooms[socket.id];

    io.to(room).emit('users', getUsersInRoom(room));
  });
});

function getUsersInRoom(room) {
  const roomUsers = {};
  for (const [id, name] of Object.entries(nicknames)) {
    const socket = io.sockets.sockets.get(id);
    if (socket?.rooms.has(room)) {
      roomUsers[id] = name;
    }
  }
  return roomUsers;
}

server.listen(3000 || '0.0.0.0', () => {
  console.log('Server is running at http://localhost:3000');
});

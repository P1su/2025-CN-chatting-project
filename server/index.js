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

io.on('connection', (socket) => {
  console.log(`[${socket.id}] user connected`);

  socket.on('set nickname', (nickname) => {
    nicknames[socket.id] = nickname;
    console.log(`[${socket.id}] 닉네임 설정됨: ${nickname}`);

    io.emit('notice', `🟢 ${nickname}님이 입장하였습니다.`);
    io.emit('users', nicknames);
  });

  socket.on('chat message', (msg) => {
    const nickname = nicknames[socket.id] || '알 수 없음';
    console.log(`[${nickname}] ${msg}`);
    io.emit('chat message', { id: socket.id, nickname, message: msg });
  });

  socket.on('disconnect', () => {
    const nickname = nicknames[socket.id] || '알 수 없음';

    io.emit('notice', `🔴 ${nickname}님이 퇴장하였습니다.`);

    console.log(`[${socket.id}] (${nickname}) user disconnected`);
    delete nicknames[socket.id];
    io.emit('users', nicknames);
  });
});

server.listen(3000 || '0.0.0.0', () => {
  console.log('Server is running at http://localhost:3000');
});

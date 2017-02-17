const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read the client html file into memory.
// __dirname in node is the current directory.
// (In this case, the same folder as the server.js file)
const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.01:${port}`);

// Pass in the http server into socketio and grab the websocket server as socketio
const io = socketio(app);

// Object to hold all of our connect users.
const users = {};

const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
        // Message back to new user.
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online.`,
    };

    socket.name = data.name;
    socket.emit('msg', joinMsg);

    socket.join('room1');

        // Announcement to everyone in the room1
    const response = {
      name: 'server',
      msg: `${data.name} has joined the room.`,
    };
    socket.broadcast.to('room1').emit('msg', response);

    console.log(`${data.name} joined`);
        // Success message back to new user
    socket.emit('msg', { name: 'server', msg: 'You joined the room' });
  });
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('msgToServer', (data) => {
    io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg });
  });
};

const onDisconnet = (sock) => {
  const socket = sock;
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
  onDisconnet(socket);
});

console.log('Websocket server started');


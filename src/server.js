const http = require('http');
const url = require('url');

const responses = require('./responses');

const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const onRequest = (request, response) => {
  console.log(request.url);
  const urlObject = url.parse(request.url, true); // This object represents the URL.


  // This gets the title of the URL minus the query field.
  switch (urlObject.pathname) {
    // Default page
    case '/':
      responses.getFile(request, response, '/client.html');
      break;
    // Retrieves all other files. Also handles Resource Not Found conditions.
    default:
      responses.getFile(request, response, urlObject.pathname);
      break;
  }
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.01:${port}`);

// Pass in the http server into socketio and grab the websocket server as socketio
const io = socketio(app);

// Object to hold all of our connect users.
const users = {};

// Adds the events for when the user joins
const onJoined = (sock) => {
  const socket = sock;

  // On event "join"
  socket.on('join', (data) => {
    // Message back to new user.
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online.`,
    };
    socket.name = data.name;
    socket.emit('msg', joinMsg);

    socket.join('room1');

    users[data.name] = data.name;

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

// On receiving a message
const onMsg = (sock) => {
  const socket = sock;
  socket.on('msgToServer', (data) => {
    io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg, color: data.color});
  });
};

// On receiving a 'disconnect' event
const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', (data) => {
    console.dir(data);

    const disconnectMsg = {
      name: 'server',
      msg: `${socket.name} has left the room.`,
    };
    socket.broadcast.to('room1').emit('msg', disconnectMsg);

    socket.leave('room1');

    // Delete user from list
    delete users[socket.name];
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');


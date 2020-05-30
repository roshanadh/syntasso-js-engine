const socket = require('socket.io');

const server = require('../server.js');

const io = socket(server);

io.on('connection', socket => {
    console.log(`\nCONNECTION: New socket with id ${socket.id} has connected.\n`);

    socket.on('disconnect', reason => {
        console.log(`\nDISCONNECT: Socket with id ${socket.id} has disconnected.`);
        console.log(`REASON: ${reason}\n`);
    });
});
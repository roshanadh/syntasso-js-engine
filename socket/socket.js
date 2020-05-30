const socket = require('socket.io');

module.exports = createSocket = server => {
    const io = socket(server);

    io.on('connection', socket => {
        console.log(`\nCONNECTION: New socket connection with id ${socket.id}\n`);
    
        socket.on('disconnect', reason => {
            console.log(`\nDISCONNECT: Socket disconnected with id ${socket.id}`);
            console.log(`REASON: ${reason}\n`);
        });
    });
}

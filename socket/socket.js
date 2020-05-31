const socket = require('socket.io');

class Socket {
    constructor(server) {
        this.instance = socket(server);
        this.instance.on('connection', socket => {
            console.log(`\nCONNECTION: New socket connection with id ${socket.id}\n`);
            
            socket.on('disconnect', reason => {
                console.log(`\nDISCONNECT: Socket disconnected with id ${socket.id}`);
                console.log(`REASON: ${reason}\n`);
            });
        });
    }
}

module.exports = Socket;

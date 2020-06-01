const socket = require('socket.io');
const cryptoRandomString = require('crypto-random-string');

const DockerApp = require('../docker/app.js');

const dockerApp = new DockerApp();

class Socket {
    constructor(server) {
        this.instance = socket(server);

        // assign custom socket IDs
        this.instance.engine.generateId = (req) => {
            return `s-${cryptoRandomString({length: 18, type: 'hex'})}`;
        }

        this.instance.on('connection', socket => {
            console.log(`\nCONNECTION: New socket connection with id ${socket.id}\n`);
            
            socket.on('disconnect', reason => {
                console.log(`\nDISCONNECT: Socket disconnected with id ${socket.id}`);
                console.log(`REASON: ${reason}\n`);
                
                dockerApp.removeNodeContainer(socket.id);
            });
        });
    }
}

module.exports = Socket;

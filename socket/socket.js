const socket = require("socket.io");
const cryptoRandomString = require("crypto-random-string");

const DockerApp = require("../docker/app.js");
const { cleanUpTempFiles } = require("../filesystem/index.js");

const dockerApp = new DockerApp();

class Socket {
	constructor(server) {
		this.instance = socket(server);

		// assign custom socket IDs
		this.instance.engine.generateId = (req) => {
			return `s-${cryptoRandomString({ length: 18, type: 'hex' })}`;
		}

		this.instance.on("connection", socket => {
			console.log(`\nCONNECTION: New socket connection with id ${socket.id}\n`);
			
			socket.on("disconnect", reason => {
				console.log(`\nDISCONNECT: Socket disconnected with id ${socket.id}`);
				console.log(`REASON: ${reason}\n`);
				/*
				*	After socket disconnection, remove:
				*	i. The Node.js container that was created for the disconnected client
				*	ii. The JavaScript file that the client might have uploaded (POST /upload) ...
				*	... ... or the one that might have been created when the client submitted ...
				*	... ... a code snippet (POST /execute)
				*	iii. The output file (.txt file) generated after execution of the user's code
				*/
				dockerApp.removeNodeContainer(socket.id);
				cleanUpTempFiles(socket.id);
			});
		});
	}
}

module.exports = Socket;

const socket = require("socket.io");
const cryptoRandomString = require("crypto-random-string");

const { removeNodeContainer } = require("../docker/index.js");
const { cleanUpClientFiles } = require("../filesystem/index.js");
const initContainer = require("./initContainer.js");
const logger = require("../util/logger.js");

class Socket {
	constructor(server) {
		this.instance = socket(server);

		// assign custom socket ID
		// this custom socket ID will also be the unique container name
		this.instance.engine.generateId = () => {
			return `s-${cryptoRandomString({ length: 18, type: "hex" })}`;
		};

		this.instance.on("connection", async socket => {
			logger.info(
				`\nCONNECTION: New socket connection with id ${socket.id}\n`
			);
			// initialize container for each connection
			initContainer(socket.id, this.instance).catch(error => {
				logger.fatal("Error in Socket.constructor:", error);
				throw new Error(JSON.stringify(error));
			});
			// perform cleanup operations after socket disconnect
			socket.on("disconnect", reason => {
				logger.info(
					`\nDISCONNECT: Socket disconnected with ID ${socket.id}, REASON: ${reason}`
				);
				removeNodeContainer(socket.id).catch(error =>
					logger.error(
						`Error during container cleanup after socket ${socket.id} disconnection:`,
						error
					)
				);
				cleanUpClientFiles(socket.id).catch(error =>
					logger.error(
						`Error during client-files/ cleanup after socket ${socket.id} disconnection:`,
						error
					)
				);
			});
		});
	}
}

module.exports = Socket;

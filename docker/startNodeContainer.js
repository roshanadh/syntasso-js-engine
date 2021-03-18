const { exec } = require("child_process");

const { convertTimeToMs } = require("../util/index.js");
const logger = require("../util/logger.js");

module.exports = (socketId, socketInstance) => {
	return new Promise((resolve, reject) => {
		try {
			logger.info("Starting Node.js container...");
			socketInstance.to(socketId).emit("docker-app-stdout", {
				stdout: "Starting Node.js container...",
			});
			let containerStartTime;
			exec(
				`time docker container start ${socketId}`,
				{ shell: "/bin/bash" },
				(error, stdout, stderr) => {
					if (error) {
						logger.error(
							"Error while starting Node.js container:",
							error
						);
						// reject an object with keys error or stderr, because this ...
						// ... makes it easier to check later if an error occurred ...
						// ... or an stderr was generated during the starting process
						return reject({ error });
					}
					if (stderr) {
						let times;
						/*
						 * 'time' command returns the real(total), user, and sys(system) ...
						 * ... times for the execution of following command (e.g. docker build ... )
						 * The times are returned in the following structure:
						 * ++++++++++++++++++
						 * + real\t0m0.000s +
						 * + user\t0m0.000s +
						 * + sys\t0m0.000s  +
						 * ++++++++++++++++++
						 * Note: 0m0.000s = 0minutes and 0.000 seconds
						 * We need to extract real(total) time/containerStartTime from the returned timed.
						 * The times are returned as an 'stderr' object
						 */
						try {
							times = stderr.split("\n");
							// get build time in terms of 0m.000s
							containerStartTime = times[1].split("\t")[1];
							logger.info(
								`stdout during Node.js container start: ${stdout}`
							);
							logger.info("Node.js container started.");
							socketInstance
								.to(socketId)
								.emit("docker-app-stdout", {
									stdout: `stdout during Node.js container start: ${stdout}`,
								});
							socketInstance
								.to(socketId)
								.emit("docker-app-stdout", {
									stdout: "Node.js container started.",
								});
							return resolve({
								stdout,
								containerStartTime: convertTimeToMs(
									containerStartTime
								),
							});
						} catch (err) {
							// stderr contains an actual error and not execution times
							logger.error(
								"stderr while starting Node.js container:",
								stderr
							);
							socketInstance
								.to(socketId)
								.emit("docker-app-stdout", {
									stdout: `stderr while starting Node.js container: ${stderr}`,
								});
							// reject an object with keys error or stderr, because this ...
							// ... makes it easier to check later if an error occurred ...
							// ... or an stderr was generated during the starting process
							return reject({ stderr });
						}
					}
				}
			);
		} catch (error) {
			logger.error("Error in startNodeContainer:", error);
			return reject({ error });
		}
	});
};

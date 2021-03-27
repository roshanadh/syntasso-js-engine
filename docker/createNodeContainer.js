const { exec } = require("child_process");

const removeNodeContainer = require("./removeNodeContainer.js");
const { convertTimeToMs } = require("../util/index.js");
const logger = require("../util/logger.js");

module.exports = (socketId, socketInstance) => {
	return new Promise((resolve, reject) => {
		try {
			removeNodeContainer(socketId)
				.then(removalLogs => {
					logger.info("Creating a Node.js container...");
					socketInstance.to(socketId).emit("docker-app-stdout", {
						stdout: "Creating a Node.js container...",
					});
					let containerCreateTime;
					exec(
						`time docker create -it --memory 100m --memory-swap 200m --name ${socketId} img_node`,
						{ shell: "/bin/bash" },
						(error, stdout, stderr) => {
							if (error) {
								logger.error(
									"Error while creating Node.js container:",
									error
								);
								// reject an object with keys error or stderr, because this ...
								// ... makes it easier to check later if an error occurred ...
								// ... or an stderr was generated during the creation process
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
								 * We need to extract real(total) time/containerCreateTime from the returned timed.
								 * The times are returned as an 'stderr' object
								 */
								try {
									times = stderr.split("\n");
									// get build time in terms of 0m.000s
									containerCreateTime = times[1].split(
										"\t"
									)[1];
									logger.info(
										`stdout during Node.js container creation: ${stdout}`
									);
									logger.info("Node.js container created.");
									socketInstance
										.to(socketId)
										.emit("docker-app-stdout", {
											stdout: `stdout during Node.js container creation: ${stdout}`,
										});
									socketInstance
										.to(socketId)
										.emit("docker-app-stdout", {
											stdout:
												"Node.js container created.",
										});
									return resolve({
										stdout,
										containerCreateTime: convertTimeToMs(
											containerCreateTime
										),
									});
								} catch (err) {
									// stderr contains an actual error and not execution times
									logger.error(
										"stderr while creating Node.js container:",
										stderr
									);
									socketInstance
										.to(socketId)
										.emit("docker-app-stdout", {
											stdout: `stderr while creating Node.js container: ${stderr}`,
										});
									// reject an object with keys error or stderr, because this ...
									// ... makes it easier to check later if an error occurred ...
									// ... or an stderr was generated during the creation process
									return reject({ stderr });
								}
							}
						}
					);
				})
				.catch(error => {
					return reject(error);
				});
		} catch (error) {
			logger.error("Error in createNodeContainer:", error);
			return reject({ error });
		}
	});
};

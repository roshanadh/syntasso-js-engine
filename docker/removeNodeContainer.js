const { exec, spawnSync } = require("child_process");

module.exports = socketId => {
	return new Promise((resolve, reject) => {
		try {
			console.log(
				`Removing any existing Node.js containers named ${socketId}...`
			);
			// if the engine is run on an testing environment, use the sync function ...
			// ... otherwise, use the async function
			if (process.env.NODE_ENV === "test") {
				let stdout, stderr;
				try {
					const removeProcess = spawnSync("docker", [
						"container",
						"rm",
						`${socketId}`,
						"--force",
					]);
					[stdout, stderr] = removeProcess.output;
					stdout = stdout ? stdout.toString() : null;
					stderr = stderr ? stderr.toString() : null;
					if (
						stderr &&
						!stderr.includes(`No such container: ${socketId}`) &&
						!stderr.trim().includes(socketId)
					) {
						console.error(
							"stderr while removing Node.js container:",
							stderr
						);
						// reject an object with keys error or stderr, because this ...
						// ... makes it easier to check later if an error occurred ...
						// ... or an stderr was generated during the removal process
						return reject({ stderr });
					}
					console.log(
						`stdout while removing container ${socketId}: ${stdout}`
					);
					console.log(`Node.js container named ${socketId} removed.`);
					return resolve(stdout);
				} catch (error) {
					if (
						error &&
						!error.message.includes(
							`No such container: ${socketId}`
						)
					) {
						console.error(
							"Error while removing Node.js container:",
							error
						);
						// reject an object with keys error or stderr, because this ...
						// ... makes it easier to check later if an error occurred ...
						// ... or an stderr was generated during the removal process
						return reject({ error });
					}
					console.log(
						`stdout during Node.js container removal: ${stdout}`
					);
					console.log("Node.js container removed.");
					return resolve(stdout);
				}
			}
			// else: NODE_ENV is not "test", so use async function
			exec(
				`docker container rm ${socketId} --force`,
				(error, stdout, stderr) => {
					// even if error occurred, check if the error occurred due to ...
					// ... the container not existing beforehand, making it impossible ...
					// ... to delete the container
					if (
						error &&
						!error.message.includes(
							`No such container: ${socketId}`
						)
					) {
						console.error(
							"Error while removing Node.js container:",
							error
						);
						// reject an object with keys error or stderr, because this ...
						// ... makes it easier to check later if an error occurred ...
						// ... or an stderr was generated during the removal process
						return reject({ error });
					}
					if (
						stderr &&
						!stderr.includes(`No such container: ${socketId}`) &&
						!stderr.trim().includes(socketId)
					) {
						console.error(
							"stderr while removing Node.js container:",
							stderr
						);
						// reject an object with keys error or stderr, because this ...
						// ... makes it easier to check later if an error occurred ...
						// ... or an stderr was generated during the removal process
						return reject({ stderr });
					}
					console.log(
						`stdout during Node.js container removal: ${stdout}`
					);
					console.log("Node.js container removed.");
					return resolve(stdout);
				}
			);
		} catch (error) {
			console.error("Error in removeNodeContainer:", error);
			return reject({ error });
		}
	});
};

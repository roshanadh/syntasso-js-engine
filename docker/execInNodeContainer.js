const { exec } = require("child_process");
const { performance } = require("perf_hooks");

const { EXECUTION_TIME_OUT_IN_MS, MAX_LENGTH_STDOUT } = require("../config.js");
const removeClientFilesFromNodeContainer = require("./removeClientFilesFromNodeContainer.js");
const copyClientFilesToNodeContainer = require("./copyClientFilesToNodeContainer.js");

const execSubmission = (req, socketInstance) => {
	return new Promise((resolve, reject) => {
		/*
		 * @resolve
		 * Always resolve the stdout as resolve({...}})
		 *
		 * @reject
		 * Reject the error and stderr values as keys in a JSON object ...
		 * ... that is, as reject({ error }) and reject({ stderr })
		 */
		try {
			let startTime = performance.now(),
				executionTime = 0;
			const { socketId } = req.body;
			console.log("Executing submission inside container...");
			socketInstance.instance.to(socketId).emit("docker-app-stdout", {
				stdout: "Executing submission inside container...",
			});
			const mainWrapper = exec(
				`docker exec -i -e socketId='${socketId}' -e EXECUTION_TIME_OUT_IN_MS='${EXECUTION_TIME_OUT_IN_MS}' -e MAX_LENGTH_STDOUT='${MAX_LENGTH_STDOUT}' ${socketId} node main-wrapper.js`
			);
			mainWrapper.stdout.on("data", stdoutBuffer => {
				try {
					executionTime = performance.now() - startTime;
					let stringOutput = stdoutBuffer.toString();
					let jsonOutput = JSON.parse(stringOutput);
					console.log(
						`stdout while executing submission inside container ${socketId}: ${stringOutput}`
					);
					if (jsonOutput.type === "test-status") {
						// stdout is the test status for an individual test case
						socketInstance.instance
							.to(socketId)
							.emit("test-status", {
								...jsonOutput,
							});
					} else if (jsonOutput.type === "full-response") {
						// stdout is the final response for user's submission

						// remove "type" property from jsonOutput object before resolving
						delete jsonOutput.type;
						socketInstance.instance
							.to(socketId)
							.emit("docker-app-stdout", {
								stdout: `User's submission executed`,
							});
						console.log(`Submission from ${socketId} executed.`);
						return resolve({
							...jsonOutput,
							executionTime,
						});
					}
				} catch (error) {
					if (error.message.includes("Unexpected token { in JSON")) {
						// this error happens because mainWrapper.stdout ...
						// ... outputs a stream of JSON objects like:
						// ... {}{}{}...
						// we need to create an array of JSON objects: ...
						// ... [{}, {}, {}, ...] in such a case
						try {
							console.log(
								`Parsing stdout with adjoining JSON objects encountered for socketId ${socketId}`
							);
							let stream = stdoutBuffer.toString().trim();
							stream = stream.split("}{");
							stream.forEach((element, index) => {
								// add missing braces as .split("}{") removes ...
								// ... every instance of "}{" in the stdout
								if (index === 0) stream[index] = element + "}";
								else if (index === stream.length - 1)
									stream[index] = "{" + element;
								else stream[index] = "{" + element + "}";
								// parse JSON and create an array of JSON objects
								stream[index] = JSON.parse(stream[index]);
								// if stream[index] is a test-status type JSON, emit:
								if (
									stream[index].type &&
									stream[index].type === "test-status"
								) {
									socketInstance.instance
										.to(socketId)
										.emit("test-status", {
											...stream[index],
										});
								} else {
									// stream[index].type === "full-response"
									// this is the full response body, so resolve it

									// remove "type" property from stream[index] object before resolving
									delete stream[index].type;
									socketInstance.instance
										.to(socketId)
										.emit("docker-app-stdout", {
											stdout: `User's submission executed`,
										});
									console.log(
										`Submission from ${socketId} executed.`
									);
									return resolve({
										...stream[index],
										executionTime,
									});
								}
							});
						} catch (err) {
							console.error(
								`Error while parsing stdout with adjoining JSON objects in execInNodeContainer for socketId ${socketId}:`,
								err
							);
							return reject({
								error: err,
							});
						}
					} else {
						console.error(
							`Error in execInNodeContainer for socketId ${socketId}:`,
							error
						);
						return reject({
							error,
						});
					}
				}
			});
			mainWrapper.stderr.on("data", stderrBuffer => {
				try {
					const stderr = JSON.parse(stderrBuffer.toString());
					console.error(
						`Some error while executing main-wrapper inside ${socketId}:`,
						stderr
					);
					return reject({
						error: stderr,
					});
				} catch (error) {
					return reject({ error });
				}
			});
		} catch (error) {
			console.error("Error in execInNodeContainer:", error);
			return reject({ error });
		}
	});
};
module.exports = (req, socketInstance) => {
	return new Promise((resolve, reject) => {
		removeClientFilesFromNodeContainer(req.body.socketId)
			.then(() => copyClientFilesToNodeContainer(req))
			.then(copyLogs => execSubmission(req, socketInstance))
			.then(execLogs => resolve(execLogs))
			.catch(error => {
				// at this point, error is already an object, so no need to wrap it in ...
				// ... braces like reject({error})
				return reject(error);
			});
	});
};

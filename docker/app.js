const { exec, spawn, spawnSync } = require("child_process");
const { performance } = require("perf_hooks");
const path = require("path");
const fs = require("fs");

const { SECRET_DIVIDER_TOKEN } = require("../config.js");
modifyTime = (time) => {
	/*
	 * execTime is of type 'number' : It represents milliseconds
	 * Other performance times (imageBuildTime, containerCreateTime, and containerStartTime) ...
	 * ... are in the form '0m0.000s'
	 * We need to return these times in a similar structure as execTime
	 */
	try {
		let minutes = parseInt(time.split("m")[0]);
		// remove trailing 's'
		let seconds = parseFloat((time.split("m")[1]).replace("s", ""));
		// return the time in terms of milliseconds
		return ((minutes * 60) + seconds) * 1000;
	} catch (err) {
		return err;
	}
}

class DockerApp {
	buildNodeImage = (session) => {
		// set all instance variables null so that it does not retain value from any previous ...
		// ... method call
		this._stderr = null;
		this._times = null;
		this._totalTime = null;

		const { socketInstance } = require("../server.js");

		return new Promise((resolve, reject) => {
			// emit build message to the connected socket ID
			socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
				stdout: "Building a Node.js image..."
			});

			console.log("Building a Node.js image... ");
			const build = exec("time docker build -t img_node .", { shell: "/bin/bash" }, (error, stdout, stderr) => {
				if (error) {
					console.error(`Error during Node.js image build: ${error}`);

					socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
						stdout: "An error occurred while building the Node.js image."
					});
					reject(error);
					return;
				}
				if (stderr) {
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
					 * We need to extract real(total) time from the returned timed.
					 * The times are returned as an 'stderr' object
					 */
					try {
						this._times = stderr.split("\n");
						this._totalTime = this._times[1].split("\t")[1];
					} catch (err) {
						// stderr contains an actual error and not execution times
						console.error(`stderr during Node.js image build: ${stderr}`);
						this._stderr = stderr;
					}
				}
				stdout ? console.error(`stdout during Node.js image build: ${stdout}`) :
					console.log("Node.js image built.");

				console.log(`Time taken for image build: ${this._totalTime}`);

				socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
					stdout: `A Node.js image has been built.\nTime taken for image build: ${this._totalTime}`
				});
				// if an stderr has occurred and this._stderr has been initialized, ...
				// ... the resolved object should contain the stderr as well
				this._stderr ? resolve({ success: true, stdout, stderr, totalTime: modifyTime(this._totalTime) }) :
					resolve({ success: true, stdout, totalTime: modifyTime(this._totalTime) });
			});

			build.stdout.on("data", stdout => {
				socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
					stdout
				});
			});
		});
	}

	createNodeContainer = (session) => {
		// set all instance variables null so that it does not retain value from any previous ...
		// ... method call
		this._stderr = null;
		this._times = null;
		this._totalTime = null;

		const { socketInstance } = require("../server.js");

		return new Promise((resolve, reject) => {
			console.log(`Removing any pre-existing Node.js container: ${session.socketId}... `);
			// remove any preexisting container
			exec(`docker container rm ${session.socketId} --force`, (error, stdout, stderr) => {
				// emit create message to the connected socket ID
				socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
					stdout: "Creating a Node.js container..."
				});

				console.log("Creating a Node.js container... ");
				const container = exec(`time docker container create -it --name ${session.socketId} img_node`, { shell: "/bin/bash" }, (error, stdout, stderr) => {
					if (error) {
						console.error(`Error during Node.js container creation: ${error}`);

						socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
							stdout: "An error occurred while creating the Node.js container."
						});
						reject(error);
						return;
					}
					if (stderr) {
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
						 * We need to extract real(total) time from the returned timed.
						 * The times are returned as an 'stderr' object
						 */
						try {
							this._times = stderr.split("\n");
							this._totalTime = this._times[1].split("\t")[1];
						} catch (err) {
							// stderr contains an actual error and not execution times
							console.error(`stderr during Node.js container creation: ${stderr}`);
							this._stderr = stderr;
						}
					}
					stdout ? console.error(`stdout during Node.js container creation: ${stdout}`) :
						console.log("Node.js container created.");

					console.log(`Time taken for container creation: ${this._totalTime}`);

					socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
						stdout: `A Node.js container has been created.\nTime taken for container creation: ${this._totalTime}`
					});
					// if an stderr has occurred and this._stderr has been initialized, ...
					// ... the resolved object should contain the stderr as well
					this._stderr ? resolve({ success: true, stdout, stderr, totalTime: modifyTime(this._totalTime) }) :
						resolve({ success: true, stdout, totalTime: modifyTime(this._totalTime) });
				});

				container.stdout.on("data", containerId => {
					socketInstance.instance.to(session.socketId).emit("container-id", { containerId });
				});
			});
		});
	}

	startNodeContainer = (session) => {
		// set all instance variables null so that it does not retain value from any previous ...
		// ... method call
		this._stderr = null;
		this._times = null;
		this._totalTime = null;

		const { socketInstance } = require("../server.js");

		let containerId = session.socketId;

		return new Promise((resolve, reject) => {
			// emit start message to the connected socket ID
			socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
				stdout: "Starting the Node.js container..."
			});
			console.log("Starting the Node.js container... ");
			exec(`time docker container start ${containerId}`, { shell: "/bin/bash" }, (error, stdout, stderr) => {
				if (error) {
					/*
					 *  A potential err may include 'No such container: ${containerId}' ...
					 *  ... which indicates that the container has not been created yet.
					 *  If so, the client should be sent back a response body ...
					 *  ... that contains a message to use dockerConfig value 0 ...
					 *  ... so as to create a container before starting it.
					 */
					socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
						stdout: "An error occurred while starting the Node.js container."
					});

					let errorString = `No such container: ${session.socketId}`;
					if (error.message.includes(errorString)) {
						reject({
							errorType: "container-not-created-beforehand",
							error,
						});
						return;
					}
					console.error(`Error during Node.js container start: ${error.message}`);
					reject(error.message);
					return;
				}
				if (stderr) {
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
					 * We need to extract real(total) time from the returned timed.
					 * The times are returned as an 'stderr' object
					 */
					try {
						this._times = stderr.split("\n");
						this._totalTime = this._times[1].split("\t")[1];
					} catch (err) {
						// stderr contains an actual error and not execution times
						console.error(`stderr during Node.js container start: ${stderr}`);
						this._stderr = stderr;
					}
				}
				stdout ? console.error(`stdout during Node.js container start: ${stdout}`) :
					console.log("Node.js container started.");

				console.log(`Time taken for container start: ${this._totalTime}`);

				socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
					stdout: `The Node.js container has been started.\nTime taken for container start: ${this._totalTime}`
				});
				// if an stderr has occurred and this._stderr has been initialized, ...
				// ... the resolved object should contain the stderr as well
				this._stderr ? resolve({ success: true, stdout, stderr, totalTime: modifyTime(this._totalTime) }) :
					resolve({ success: true, stdout, totalTime: modifyTime(this._totalTime) });
			});
		});
	}

	copyClientFilesToContainer = (session) => {
		// --- Copy the code inside the container to execute --- 
		let containerId = session.socketId;
		return new Promise((resolve, reject) => {
			// emit exec message to the connected socket ID
			socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
				stdout: "Preparing to execute JavaScript code inside the container..."
			});

			let stepTime = performance.now();
			// copy client-files/ from host to container's home/client-files/
			const localPath = path.resolve(
				__dirname,
				"..",
				"client-files",
				`${session.socketId}`
			);

			exec(`docker cp ${localPath} ${containerId}:/home/client-files/`, (error, stdout, stderr) => {
				let now = performance.now();
				console.log("Time taken to perform copy operation: client-files/ into the container: " + (now - stepTime) + "ms");

				if (error) {
					console.error(`Error during copying client-files/ into the container: ${error}`);

					socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
						stdout: "An error occurred while executing code inside the Node.js container."
					});
					reject({ error });
					return;
				}

				if (stderr) {
					/*
					 *  A potential err may include: ...
					 *  ... 'No such container:path: ${containerId}':/home' ...
					 *  ... which indicates that the container has not been created ...
					 *  ... and/or started yet.
					 *  If so, the client should be sent back a response body ...
					 *  ... that contains a message to use dockerConfig value 0 or 1 ...
					 *  ... so as to create a container or start the container (if it exists) ...
					 *  ... before copying files into it.
					 */

					socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
						stdout: "An error occurred while preparing to execute code inside the Node.js container."
					});

					const errorString = `No such container:path: ${session.socketId}:/home`;
					if (stderr.includes(errorString)) {
						reject({
							errorType: "container-not-started-beforehand",
							error: stderr,
						});
					}
					console.error(`Error during the execution of 'docker cp' command.`);
					console.error(`Error during copying client-files/ into the container: ${stderr}`);
					reject({ error: stderr });
					return;
				}
				resolve({ copyTime: now - stepTime });
			});
		});
	}

	writeOutputToFile = (outputFilePath, data, socketInstance) => {
		return new Promise((resolve, reject) => {
			let stepTime = performance.now();
			fs.writeFile(outputFilePath, JSON.stringify(data), err => {
				if (err) {
					console.error(`Error while writing output to .txt file: ${err.stack}`);

					socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
						stdout: "An error occurred while executing code inside the Node.js container."
					});
					reject({ error: err });
					return;
				}
				resolve({ writeToOutputTime: performance.now() - stepTime })
			});
		});
	}

	execInNodeContainer = (session) => {
		// set all instance variables null so that it does not retain value from any previous ...
		// ... method call
		this._stderr = null;
		this._times = null;
		this._totalTime = null;

		const { socketInstance } = require("../server.js");

		let containerId = session.socketId,
			outputFilePath = path.resolve(
				__dirname,
				"..",
				"client-files",
				"outputs",
				`${session.socketId}.txt`
			);

		return new Promise(async(resolve, reject) => {
			let { copyTime, error, errorType } = await this.copyClientFilesToContainer(session);
			if (errorType) {
				reject({ errorType, error });
				return;
			}
			if (error) {
				reject({ error });
				return;
			}

			// emit exec message to the connected socket ID
			socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
				stdout: "Executing JavaScript code inside the container..."
			});

			let stepTime = performance.now();
			try {
				// child_process.exec() returns output in plain string, no need to ...
				// ... explicitly convert to string
				const containerBash = exec(`docker exec -i ${containerId} /bin/bash`);
				// let stdout = [];
				containerBash.stdout.on("data", async stdout => {
					let now = performance.now();
					let responseTime = now - stepTime;
					
					console.log("Response time for exec command: " + responseTime + "ms");
					
					socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
						stdout: `Response time for exec command: ${responseTime}`
					});

					// nested try...catch to catch any JSON parse errors
					try {
						stdout = JSON.parse(stdout.toString().trim());

						if (stdout.type && stdout.type === "test-status") {
							socketInstance.instance.to(session.socketId).emit("test-status", {
								...stdout
							});
						} else {
							// stdout.type === "full-response"
							// write stdout to output file
							const { writeToOutputTime, error } = await this.writeOutputToFile(outputFilePath, stdout, socketInstance);
							
							console.log("Total time taken for all execution steps (Copy, Write to output, and Exec): " + (copyTime + writeToOutputTime + responseTime) + "ms");

							console.log("\nSTDOUT for 'docker exec' command: ");
							console.dir({
								stdout,
							});

							if (error) {
								reject({ error });
								return;
							} else {
								resolve({ responseTime: responseTime + copyTime + writeToOutputTime });
								return;
							} 
						}
					} catch (err) {
						if (err.message.includes("Unexpected token { in JSON")) {
							// this error happens because containerBash.stdout ...
							// ... outputs a stream of JSON objects like:
							// ... {}{}{}...
							// we need to create an array of JSON objects: ...
							// ... [{}, {}, {}, ...] in such a case

							let stream = stdout.toString().trim();
							stream = stream.split("}{")
							stream.forEach(async(element, index) => {
								// add missing braces as .split("}{") removes ...
								// ... every instance of "}{" in the stdout
								if (index === 0) stream[index] = element + "}";
								else if (index === stream.length - 1) stream[index] = "{" + element;
								else stream[index] = "{" + element + "}";

								// parse JSON and create an array of JSON objects
								stream[index] = JSON.parse(stream[index]);
								// if stream[index] is a test-status type JSON, emit:
								if (stream[index].type && stream[index].type === "test-status") {
									socketInstance.instance.to(session.socketId).emit("test-status", {
										...stream[index]
									});
								} else {
									// stream[index].type === "full-response"
									// write stream[index] to output file
									const { writeToOutputTime, error } = await this.writeOutputToFile(outputFilePath, stream[index], socketInstance);

									console.log("Total time taken for all execution steps (Copy, Write to output, and Exec): " + (copyTime + writeToOutputTime + responseTime) + "ms");

									console.log("\nSTDOUT for 'docker exec' command: ");
									console.dir({
										stdout: stream[index],
									});

									if (error) {
										reject({ error });
										return;
									} else {
										resolve({ responseTime: responseTime + copyTime + writeToOutputTime });
										return;
									}								
								}
							});
						} else {
							reject({ error: err });
							return;
						}
					}
				});

				containerBash.stderr.on('data', stderr => {
					stderr = stderr.trim();
					socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
						stdout: "An error occurred while executing code inside the Node.js container."
					});

					const errorString = "is not running";
					if (stderr.includes(errorString)) {
						reject({
							errorType: "container-not-started-beforehand",
							error: stderr,
						});
						return;
					}
					console.error(`Error during JavaScript code execution: ${stderr}`);
					reject({ error: stderr });
					return;
				});

				// execute main-wrapper.js by writing execution command to bash
				containerBash.stdin.write(`socketId="${session.socketId}" SECRET_DIVIDER_TOKEN="${SECRET_DIVIDER_TOKEN}" node home/client-files/main-wrapper.js\n`);
			} catch (err) {
				console.error(`Error during JavaScript code execution: ${err.stack}`);

				socketInstance.instance.to(session.socketId).emit("docker-app-stdout", {
					stdout: "An error occurred while executing code inside the Node.js container."
				});
				reject({ error: err });
			}
		});
	}

	removeNodeContainer = (socketId) => {
		// set all instance variables null so that it does not retain value from any previous ...
		// ... method call
		this._stderr = null;
		this._times = null;
		this._totalTime = null;

		let NODE_ENV = process.env.NODE_ENV;
		if (NODE_ENV === "test") {
			// use spawnSync to write blocking code for testing
			let stepTime = 0.0;
			try {
				stepTime = performance.now();
				// remove container with name that equals socketId
				const container = spawnSync("docker", ["container", "rm", socketId, "--force"], {
					stdio: ["pipe", "pipe", "pipe"],
				});

				const io = container.output.toString("utf-8").split(",");
				// io[stdin, stdout, stderr]
				if (io[1].trim() === socketId) {
					console.error(
						`Container named ${socketId} has been removed after the client's socket disconnection.`
					);
					console.log("Time taken for removeNodeContainer() call: " + (performance.now() - stepTime) + "ms");
					return;
				}
				if (io[2].trim() !== "") {
					/*
					 * Any potential stderr may be: ...
					 * ... 'Error: No such container: ${containerId}'
					 * In such cases, the connected client may not have created a container ...
					 * ... so there's no problem if a non-existent container couldn't be removed.
					 *
					 * And so we don't need to log such an error.
					 *
					 * We need to parse stderr to see if it is the very same error ...
					 * ... as mentioned above.
					 * 
					 */
					console.log("Time taken for removeNodeContainer() call: " + (performance.now() - stepTime) + "ms");
					let stderr = io[2].trim().toString("utf-8");
					const errorArr = stderr.split(":");
					if (errorArr[1].trim() !== "No such container") {
						console.error(`Error during the execution of 'docker container rm' command.`);
						console.error(`Error during removing the container: ${stderr}`);
					} else {
						console.log("No container was removed.")
					}
					return { error: stderr };
				}
			} catch (err) {
				console.log("Time taken for removeNodeContainer() call: " + (performance.now() - stepTime) + "ms");
				console.error(`Error in dockerApp.removeNodeContainer(): ${err}`);
				return { error: err };
			}
		}
		// if NODE_ENV is not 'test', use asynchronous function like spawn()
		let stepTime = 0.0;
		try {
			stepTime = performance.now();
			// remove container with name that equals socketId
			const container = spawn("docker", ["container", "rm", socketId, "--force"], {
				stdio: ["pipe", "pipe", "pipe"],
			});

			container.stdout.on("data", containerId => {
				if (containerId.toString("utf-8").trim() === socketId)
					console.error(
						`Container named ${socketId} has been removed after the client's socket disconnection.`
					);
				console.log("Time taken for removeNodeContainer() call: " + (performance.now() - stepTime) + "ms");
			});

			container.stderr.on("data", stderr => {
				/*
				 * Any potential stderr may be: ...
				 * ... 'Error: No such container: ${containerId}'
				 * In such cases, the connected client may not have created a container ...
				 * ... so there's no problem if a non-existent container couldn't be removed.
				 *
				 * And so we don't need to log such an error.
				 *
				 * We need to parse stderr to see if it is the very same error ...
				 * ... as mentioned above.
				 * 
				 */
				console.log("Time taken for removeNodeContainer() call: " + (performance.now() - stepTime) + "ms");
				stderr = stderr.toString("utf-8");
				const errorArr = stderr.split(":");
				if (errorArr[1].trim() !== "No such container") {
					console.error(`Error during the execution of 'docker container rm' command.`);
					console.error(`Error during removing the container: ${stderr}`);
				} else {
					console.log("No container was removed.");
				}
				return { error: stderr };
			});
		} catch (err) {
			console.log("Time taken for removeNodeContainer() call: " + (performance.now() - stepTime) + "ms");
			console.error(`Error in dockerApp.removeNodeContainer(): ${err}`);
			return { error: err };
		}
	}
}

module.exports = DockerApp;

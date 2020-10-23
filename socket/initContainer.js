const {
	buildNodeImage,
	createNodeContainer,
	startNodeContainer,
} = require("../docker/index.js");

module.exports = (socketId, socketInstance) => {
	return new Promise((resolve, reject) => {
		let times = {};
		socketInstance.to(socketId).emit("container-init-status", {
			status: "building",
			message: "Building a Node.js image...",
			error: null,
		});
		buildNodeImage(socketId, socketInstance)
			.then(buildLogs => {
				times.imageBuildTime = buildLogs.imageBuildTime;
				socketInstance.to(socketId).emit("container-init-status", {
					status: "creating",
					message: "Creating a Node.js container...",
					error: null,
				});
				return createNodeContainer(socketId, socketInstance);
			})
			.then(creationLogs => {
				times.containerCreateTime = creationLogs.containerCreateTime;
				socketInstance.to(socketId).emit("container-init-status", {
					status: "starting",
					message: "Starting the Node.js container...",
					error: null,
				});
				return startNodeContainer(socketId, socketInstance);
			})
			.then(startLogs => {
				times.containerStartTime = startLogs.containerStartTime;
				socketInstance.to(socketId).emit("container-init-status", {
					status: "ready",
					message: "Container is ready.",
					error: null,
				});
				// "container-ready-status" event is strictly for testing
				// clients may only listen for the "container-init-status" events
				socketInstance.to(socketId).emit("container-ready-status", {
					status: "ready",
					message: "Container is ready.",
					error: null,
				});
				return resolve(socketId);
			})
			.catch(error => {
				if (
					error.error &&
					error.error.message &&
					error.error.message.includes(
						`The container name "/${socket.id}" is already in use by container`
					)
				) {
					// do nothing as this error was caused by trying to ...
					// ... to create a container that already exists
				} else {
					console.error("Error in initContainer:", error);
					socketInstance.to(socketId).emit("container-init-status", {
						status: "error",
						message: "Please re-try creating a socket connection",
						error,
					});
					reject(error);
				}
			});
	});
};

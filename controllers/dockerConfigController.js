const DockerApp = require("../docker/app.js");
const { readOutput } = require("../filesystem/index.js");

const dockerApp = new DockerApp();
handleConfigZero = async (req, res) => {
	let imageBuildTime, containerCreateTime, containerStartTime;
	try {
		let { stderr, totalTime } = await dockerApp.buildNodeImage(req.session);
		imageBuildTime = totalTime;

		stderr
			? console.error(`stderr in dockerApp.buildNodeImage(): ${image.stderr}`)
			: console.log("Node.js image built.");
	} catch (err) {
		// handle promise rejection
		return res
			.status(503)
			.json({ error: "Service currently unavailable due to server conditions" });
	}
	try {
		let { stderr, totalTime } = await dockerApp.createNodeContainer(
			req.session
		);
		containerCreateTime = totalTime;
		stderr
			? console.error(
				`stderr in dockerApp.createNodeContainer(): ${container.stderr}`
			)
			: console.log("Node.js container created.");
	} catch (err) {
		return res
			.status(503)
			.json({ error: "Service currently unavailable due to server conditions" });
	}
	try {
		let { stderr, totalTime } = await dockerApp.startNodeContainer(
			req.session
		);
		containerStartTime = totalTime;

		stderr
			? console.error(
				`stderr in dockerApp.startNodeContainer(): ${startStatus.stderr}`
			)
			: console.log("Node.js container started.");
	} catch (err) {
		// handle promise rejection
		return res
			.status(503)
			.json({ error: "Service currently unavailable due to server conditions" });
	}
	try {
		let { responseTime } = await dockerApp.execInNodeContainer(
			req.session
		);
		console.log("\nResponse to the client:");
		const _res = await readOutput(req.session.socketId);
		if (!_res.errorInProcess) {
			const response = {
				..._res,
				imageBuildTime,
				containerCreateTime,
				containerStartTime,
				responseTime,
			};
			console.dir(response);
			res.status(200).json(response);
		}
	} catch (error) {
		if (error.errorType && error.errorType === "container-not-started-beforehand") {
			return res.status(503).json({
				error:
					"The container is not currently running on the server. Request again with dockerConfig 0 or 1.",
			});
		} else {
			return res
				.status(503)
				.json({ error: "Service currently unavailable due to server conditions" });
		}
	}
};

handleConfigOne = async (req, res) => {
	let containerStartTime;
	try {
		let { stderr, totalTime } = await dockerApp.startNodeContainer(
			req.session
		);
		containerStartTime = totalTime;

		stderr
			? console.error(
				`stderr in dockerApp.startNodeContainer(): ${startStatus.stderr}`
			)
			: console.log("Node.js container started.");
	} catch (err) {
		// handle promise rejection of dockerApp.startNodeContainer()
		if (err.errorType === "container-not-created-beforehand") {
			return res.status(503).json({
				error:
					"The container has not been created on the server. Request again with dockerConfig 0.",
			});
		} else {
			return res
				.status(503)
				.json({ error: "Service currently unavailable due to server conditions" });
			}
	}

	try {
		let { responseTime } = await dockerApp.execInNodeContainer(
			req.session
		);
		console.log("\nResponse to the client:");
		const _res = await readOutput(req.session.socketId);
		if (!_res.errorInProcess) {
			const response = {
				..._res,
				containerStartTime,
				responseTime,
			};
			console.dir(response);
			res.status(200).json(response);
		}
	} catch (error) {
		if (error.errorType && error.errorType === "container-not-started-beforehand") {
			return res.status(503).json({
				error:
					"The container is not currently running on the server. Request again with dockerConfig 0 or 1.",
			});
		} else {
			return res
				.status(503)
				.json({ error: "Service currently unavailable due to server conditions" });
		}
	}
};

handleConfigTwo = async (req, res) => {
	try {
		let { responseTime } = await dockerApp.execInNodeContainer(
			req.session
		);
		console.log("\nResponse to the client:");
		const _res = await readOutput(req.session.socketId);
		if (!_res.errorInProcess) {
			const response = {
				..._res,
				responseTime,
			};
			console.dir(response);
			res.status(200).json(response);
		}
	} catch (error) {
		if (error.errorType && error.errorType === "container-not-started-beforehand") {
			return res.status(503).json({
				error:
					"The container is not currently running on the server. Request again with dockerConfig 0 or 1.",
			});
		} else {
			return res
				.status(503)
				.json({ error: "Service currently unavailable due to server conditions" });
		}
	}
};

module.exports = {
	handleConfigZero,
	handleConfigOne,
	handleConfigTwo,
};

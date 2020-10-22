const { buildNodeImage, createNodeContainer } = require("../docker/index.js");

const handleConfigOne = require("./handleConfigOne.js");

module.exports = (req, res, next) => {
	const { socketInstance } = require("../server.js");
	let times = {};
	buildNodeImage(req, socketInstance)
		.then(buildLogs => {
			times.imageBuildTime = buildLogs.imageBuildTime;
			return createNodeContainer(req, socketInstance);
		})
		.then(creationLogs => {
			times.containerCreateTime = creationLogs.containerCreateTime;
			return handleConfigOne(req, res, next, times);
		})
		.catch(error => {
			console.error("Error in handleConfigZero:", error);
			next(error);
		});
};

const { execInNodeContainer } = require("../docker/index.js");

const handle403Response = require("./handle403Response.js");
const logger = require("../util/logger.js");

module.exports = (req, res, next) => {
	const { socketInstance } = require("../server.js");
	let times = {};
	execInNodeContainer(req, socketInstance)
		.then(execLogs => {
			/*
			 * execLogs contains the output of the submission, time for execution, and other details
			 */
			times.executionTime = execLogs.executionTime;
			const response = {
				...execLogs,
				...times,
			};
			logger.info("Response to the client:", response);
			return res.status(200).json(response);
		})
		.catch(error => {
			/*
			 * Check if error occurred due to a non-existent container ...
			 * or an idle (not-running) container
			 */
			if (
				error.error &&
				error.error.message &&
				(error.error.message.includes(
					`No such container: ${req.body.socketId}`
				) ||
					error.error.message.includes("is not running"))
			) {
				return handle403Response(
					res,
					"Wait for socket connection to initialize container environment; or re-establish a socket connection"
				);
			}
			logger.error("Error in handleContainerTasks:", error);
			next(error);
		});
};

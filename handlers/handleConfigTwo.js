const { execInNodeContainer } = require("../docker/index.js");

const handle403Response = require("./handle403Response.js");

module.exports = (req, res, next, times) => {
	const { socketInstance } = require("../server.js");
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
			console.log("Response to the client:", response);
			return res.status(200).json(response);
		})
		.catch(error => {
			/*
			 * Check if error occurred due to a bad dockerConfig value
			 */
			if (
				error.error &&
				error.error.message &&
				error.error.message.includes(
					`No such container: ${req.body.socketId}`
				)
			) {
				return handle403Response(
					res,
					"Re-request using dockerConfig 0 or 1 because container has not been created or started"
				);
			}
			console.error("Error in handleConfigTwo:", error);
			next(error);
		});
};

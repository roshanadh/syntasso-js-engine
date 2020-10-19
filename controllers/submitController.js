const socketValidator = require("../middlewares/socketValidator.js");
const ErrorWithStatus = require("../utils/ErrorWithStatus.js");

const {
	initDirectories,
	generateTestFiles,
	generateSubmissionFile,
} = require("../filesystem/index.js");

const {
	handleConfigZero,
	handleConfigOne,
	handleConfigTwo,
} = require("./dockerConfigController.js");

const submitController = (req, res) => {
	console.log("POST request received at /submit");
	initDirectories()
		.then(() => {
			/*
			 * All req.body params =>
			 * 1. req.body.socketId: String => contains socket ID of the connected client
			 * 2. req.body.code: String => contains JavaScript code to be compiled and executed
			 * 3. req.body.dockerConfig: Stringified Integer =>
			 * ... a) if 0, docker environment (image build and container create) should be setup ...
			 * ... ... before code execution
			 * ... b) if 1, docker container should be started before code execution, no need to  ...
			 * ... ... build an image or to create a container
			 * ... c) if 2, just execute the code, no need to create and/or start the container
			 * 4. req.body.testCases: Array => contains multiple JSON objects of sampleInputs and ...
			 * ... ... expectedOutputs in the following structure
			 * submitController deals with the code and dockerConfig parameters
			 *
			 * req.body structure:
			 *	{
			 *		socketId: "",
			 *		code: "",
			 *		dockerConfig: "",
			 *		testCases: [
			 *			{
			 *				sampleInput: "5\n1 2 3 4 5",
			 *				expectedOutput: "5\n1 2 3 4 5",
			 *			}, {}, {}, ...
			 *		]
			 *	}
			 */
			try {
				generateTestFiles(req).then(() => {
					// write the user-submitted code into a file
					generateSubmissionFile(
						req.session.socketId,
						req.body.code
					).then(() => {
						if (isNaN(req.body.dockerConfig))
							throw new ErrorWithStatus(
								400,
								"Bad Request: dockerConfig Value Is Not A Number!"
							);
						let dockerConfig = parseInt(req.body.dockerConfig);

						switch (dockerConfig) {
							case 0:
								handleConfigZero(req, res);
								break;
							case 1:
								handleConfigOne(req, res);
								break;
							case 2:
								handleConfigTwo(req, res);
								break;
							default:
								throw new ErrorWithStatus(
									400,
									"Bad Request: dockerConfig Value Is Not A Valid Number!"
								);
						}
					});
				});
			} catch (err) {
				// if the error object 'err' contains a status code, ...
				// ... it was thrown using custom ErrorWithStatus class
				if (err.status)
					return res.status(err.status).json({
						error: err.message,
					});
				// otherwise, a different error occurred and should be ...
				// ... logged to console
				console.error({
					error: err.message,
					stack: err.stack,
				});
				res.status(503).json({
					error: "Service is currently unavailable!",
				});
			}
		})
		.catch(err => {
			throw err;
		});
};

module.exports = submitController;

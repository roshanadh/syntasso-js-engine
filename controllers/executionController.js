const socketController = require("./socketController.js");
const Handler = require("./DockerConfigHandler.js");
const ErrorWithStatus = require("../utils/ErrorWithStatus.js");

const { updateCodeInFile } = require("../filesystem/index.js");

const handler = new Handler();

const executionController = async (req, res) => {
	console.log("POST request received at /execute");
	/*
	 * All req.body params =>
	 * 1. req.body.socketId: String => contains socket ID of the connected client
	 * 2. req.body.code: String => contains JavaScript code to be compiled and executed
	 * 3. req.body.dockerConfig: Stringified Integer =>
	 * ... a) if 0, docker environment (image build and container create) should be setup ...
	 * ... ... before code execution
	 * ... b) if 1, docker container should be started before code execution, no need to ....
	 * ... ... build an image or to create a container
	 * ... c) if 2, just execute the code, no need to create and/or start the container
	 *
	 * executionController middleware deals with the code and dockerConfig parameters
	 */
	try {
		await socketController(req, res);
		if (!req.body.code) {
			return res.status(400).json({ error: "Bad Request: No Code Provided!" });
		}
		if (!req.body.dockerConfig) {
			return res.status(400).json({
				error: "Bad Request: No Docker Configuration Instruction Provided!",
			});
		}
		// write the user-submitted code into a file
		await updateCodeInFile(req.session.socketId, req.body.code);
		if (isNaN(req.body.dockerConfig))
			throw new ErrorWithStatus(
				400,
				"Bad Request: dockerConfig Value Is Not A Number!"
			);
		let dockerConfig = parseInt(req.body.dockerConfig);

		switch (dockerConfig) {
			case 0:
				handler.handleConfigZero(req, res);
				break;
			case 1:
				handler.handleConfigOne(req, res);
				break;
			case 2:
				handler.handleConfigTwo(req, res);
				break;
			default:
				throw new ErrorWithStatus(
					400,
					"Bad Request: dockerConfig Value Is Not A Valid Number!"
				);
		}
	} catch (err) {
		res.status(err.status).json({
			error: err.message,
		});
	}
};

module.exports = executionController;

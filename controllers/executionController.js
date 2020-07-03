const multer = require("multer");
const path = require("path");
const fs = require("fs");

const socketValidator = require('../middlewares/socketValidator.js');
const ErrorWithStatus = require("../utils/ErrorWithStatus.js");

const { initDirectories, updateCodeInFile } = require("../filesystem/index.js");
const {
	handleConfigZero,
	handleConfigOne,
	handleConfigTwo
} = require("./dockerConfigController.js");

let sampleInputFileNameIndex = 0, expectedOutputFileNameIndex = 0;
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		let basePath = path.resolve(__dirname, "..", "client-files", req.body.socketId);
		let sampleInputsPath = path.resolve(basePath, "sampleInputs");
		let expectedOutputsPath = path.resolve(basePath, "expectedOutputs");

		fs.mkdir(sampleInputsPath, {
			recursive: true
		}, (err) => {
			// do nothing if the directories already exist, ...
			// ... i.e., when an EEXIST error is thrown
			if (err && err.code === "EEXIST") { }
			else if (err)
				cb(new Error(`Error while creating directory: ${sampleInputsPath} for socketId: ${req.body.socketId}: ${err}`), false);
			else {
				fs.mkdir(expectedOutputsPath, {
					recursive: true
				}, (err) => {
					// do nothing if the directories already exist, ...
					// ... i.e., when an EEXIST error is thrown
					if (err && err.code === "EEXIST") { }
					else if (err)
						cb(new Error(`Error while creating directory: ${expectedOutputsPath} for socketId: ${req.body.socketId}: ${err}`), false);
					else {
						if (file.fieldname === "submission")
							cb(null, basePath);
						else if (file.fieldname === "sampleInputs")
							cb(null, sampleInputsPath);
						else if (file.fieldname === "expectedOutputs")
							cb(null, expectedOutputsPath);
						else
							cb(new Error(`Unexpected fieldname: ${file.fieldname}`), false);
					}
				});
			}
		});
	},
	filename: (req, file, cb) => {
		if (file.fieldname === "sampleInputs")
			cb(null, `${req.body.socketId}-sampleInput-${sampleInputFileNameIndex++}.txt`);
		else if (file.fieldname === "expectedOutputs")
			cb(null, `${req.body.socketId}-expectedOutput-${expectedOutputFileNameIndex++}.txt`);
		else
			cb(new Error(`Unexpected fieldname: ${file.fieldname}`), false);
	}
});

const fileFilter = (req, file, cb) => {
	const listOfClients = Object.keys(socketInstance.instance.sockets.sockets);

	if (!req.body.socketId)
		return cb(null, false);
	if (!listOfClients.includes(req.body.socketId))
		return cb(null, false);
	if (file.originalname.split('.').length > 2)
		return cb(new Error('File name cannot contain more than one period (.)'), false);
	if (file.originalname.split('.')[1] !== 'txt')
		return cb(new Error('Only .txt files can be uploaded as sampleInputs or expectedOutputs'), false);
	cb(null, true);
}

const upload = multer({ storage, fileFilter });
let fileUpload = upload.fields([
	{
		name: "sampleInputs",
		maxCount: 8
	},
	{
		name: "expectedOutputs",
		maxCount: 8
	}
]);

const executionController = (req, res) => {
	console.log("POST request received at /execute");
	initDirectories().then(() => {
		sampleInputFileNameIndex = 0; expectedOutputFileNameIndex = 0;
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
		fileUpload(req, res, (err) => {
			try {
				socketValidator(req, res);
				if (err instanceof multer.MulterError) {
					// A Multer error occurred during uploading
					res.status(503).json({
						error: 'An error occurred while uploading the test files!',
						message: err.message,
					});
					console.error(`A Multer error occurred at executionController while uploading:\n${err}`);
				} else if (err) {
					// An error occurred during uploading
					res.status(503).json({
						error: 'An error occurred while uploading the test files!',
						message: err.message,
					});
					console.error(`An error occurred at executionController while uploading:\n${err}`);
				} else {
					if (!req.body.code) {
						return res.status(400).json({ error: "Bad Request: No Code Provided!" });
					}
					if (!req.body.dockerConfig) {
						return res.status(400).json({
							error: "Bad Request: No Docker Configuration Instruction Provided!",
						});
					}
					// write the user-submitted code into a file
					updateCodeInFile(req.session.socketId, req.body.code).then(() => {
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
				}
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
					stack: err.stack
				});
				res.status(503).json({
					error: 'Service is currently unavailable!',
				});
			}
		});
	});
};

module.exports = executionController;

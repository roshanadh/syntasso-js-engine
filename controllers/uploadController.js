const multer = require('multer');
const path = require("path");
const fs = require("fs");

const { initDirectories, addDividerToken } = require("../filesystem/index.js");
const socketValidator = require('../middlewares/socketValidator.js');
const ErrorWithStatus = require("../utils/ErrorWithStatus.js");

const {
	handleConfigZero,
	handleConfigOne,
	handleConfigTwo
} = require("./dockerConfigController.js");

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
		if (file.fieldname === "submission")
			cb(null, "submission.js");
		else if (file.fieldname === "sampleInputs" || file.fieldname === "expectedOutputs")
			cb(null, `${req.body.socketId}-${file.originalname}`);
		else
			cb(new Error(`Unexpected fieldname: ${file.fieldname}`), false);
	}
});

const fileFilter = (req, file, cb) => {
	const listOfClients = Object.keys(socketInstance.instance.sockets.sockets);
	const sampleInputFileNameRegex = /sampleInput-\b[0-8].txt$/;
	const expectedOutputFileNameRegex = /expectedOutput-\b[0-8].txt$/;

	if (!req.body.socketId)
		return cb(null, false);
	if (!listOfClients.includes(req.body.socketId))
		return cb(null, false);
    if (file.originalname.split('.').length > 2)
		return cb(new Error('File name cannot contain more than one period (.)'), false);
	if (file.fieldname === "submission" && file.originalname.split('.')[1] !== 'js')
		return cb(new Error('Only .js files can be uploaded as submission'), false);
    if (
		(file.fieldname === "sampleInputs" || file.fieldname === "expectedOutputs")
		&& file.originalname.split('.')[1] !== 'txt'
	)
		return cb(new Error('Only .txt files can be uploaded as sampleInputs or expectedOutputs'), false);
	if (file.fieldname === "sampleInputs" && !file.originalname.match(sampleInputFileNameRegex))
		return cb(new Error('Sample Input file name must be according to the specification'), false);
	if (file.fieldname === "expectedOutputs" && !file.originalname.match(expectedOutputFileNameRegex))
		return cb(new Error('Expected Output file name must be according to the specification'), false);

    cb(null, true);
}

const upload = multer({ storage, fileFilter });
let fileUpload = upload.fields([
	{
		name: "submission",
		maxCount: 1
	},
	{
		name: "sampleInputs",
		maxCount: 8
	},
	{
		name: "expectedOutputs",
		maxCount: 8
	}
]);

module.exports = uploadController = (req, res) => {
	console.log("POST request received at /upload");
	// TODO:
	/*
 	 * Remove any previously uploaded test cases as they may cause issues.
 	 * For example if the same socketId had previously uploaded 5 test cases ...
 	 * ... and now it uploads 3 test cases, 5 test cases will be executed this time as well.
 	 * So, find a way to remove test cases uploaded by a previous request.
 	 * NOTE: THIS ISSUE IS NOT PRESENT IS THE /submit ROUTE. IT IS ONLY ...
 	 * ... PRESENT IN /execute AND /upload ROUTES.
 	 *
	*/
	initDirectories().then(() => {
		/*
		* All possible req.body params =>
		* 1. req.body.socketId: String => contains socket ID of the connected client
		* 
		* 2. req.body.dockerConfig: Stringified Integer => 
		* ... a) if 0, docker environment (image build and container create) should be setup ...
		* ... ... before code execution
		* ... b) if 1, docker container should be started before code execution, no need to ....
		* ... ... build an image or to create a container
		* ... c) if 2, just execute the code, no need to create and/or start the container
		* 
		* uploadController middleware deals with the dockerConfig request body parameter ...
		* ... and the file included in the request
		*/

		fileUpload(req, res, (err) => {
			try {
				socketValidator(req, res);
				if (err instanceof multer.MulterError) {
					// A Multer error occurred during uploading
					res.status(503).json({
						error: 'An error occurred while uploading the submitted JavaScript file!',
						message: err.message,
					});
					console.error(`A Multer error occurred at uploadController while uploading:\n${err}`);
				} else if (err) {
					// An error occurred during uploading
					res.status(503).json({
						error: 'An error occurred while uploading the submitted JavaScript file!',
						message: err.message,
					});
					console.error(`An error occurred at uploadController while uploading:\n${err}`);
				} else {
					if (!req.files["submission"]) {
						res.status(400).json({ error: "Bad Request: No JavaScript File Provided!" });
						return console.error('Bad Request Error at /upload POST. No JavaScript File Provided!');
					}
					if (!req.body.dockerConfig) {
						res.status(400).json({ error: "Bad Request: No Docker Configuration Instruction Provided!" });
						return console.error("Bad Request Error at /upload POST. No Docker Configuration Instruction Provided!");
					}
					// add secret divider token to the user-submitted file
					addDividerToken(req.session.socketId).then(() => {
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
}

module.exports = uploadController;

const multer = require('multer');

const { addDividerToken } = require("../filesystem/index.js");
const socketController = require('./socketController.js');
const Handler = require('./DockerConfigHandler.js');
const ErrorWithStatus = require("../utils/ErrorWithStatus.js");

const handler = new Handler();

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, __dirname + '/../client-files/submissions');
	},
	filename: (req, file, cb) => {
		cb(null, req.body.socketId + '.js');
	}
});

const fileFilter = (req, file, cb) => {
    if (file.originalname.split('.').length > 2)
        return cb(new Error('File name cannot contain more than one period (.)'), false);
    if (file.originalname.split('.')[1] !== 'js')
        return cb(new Error('Only .js files can be uploaded'), false);
    if (!req.body.socketId)
        return cb(null, false);
    cb(null, true);
}

const upload = multer({ storage, fileFilter });
let fileUpload = upload.single('submission');

module.exports = uploadController = (req, res) => {
	console.log("POST request received at /upload");
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

	fileUpload(req, res, async (err) => {
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
			try {
				await socketController(req, res);
				if (!req.file) {
					res.status(400).json({ error: "Bad Request: No JavaScript File Provided!" });
					return console.error('Bad Request Error at /execute POST. No JavaScript File Provided!');
				}
				if (!req.body.dockerConfig) {
					res.status(400).json({ error: "Bad Request: No Docker Configuration Instruction Provided!" });
					return console.error("Bad Request Error at /execute POST. No Docker Configuration Instruction Provided!");
				}
				// add secret divider token to the user-submitted file
				await addDividerToken(req.session.socketId);
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
		}
	});
}

module.exports = uploadController;

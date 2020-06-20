const multer = require('multer');
const path = require("path");

const { addDividerToken } = require("../filesystem/index.js");
const socketValidator = require('../middlewares/socketValidator.js');
const ErrorWithStatus = require("../utils/ErrorWithStatus.js");

const {
	handleConfigZero,
	handleConfigOne,
	handleConfigTwo
} = require("./dockerConfigController.js");

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.resolve(__dirname, "..", "client-files", "submissions"));
	},
	filename: (req, file, cb) => {
		cb(null, req.body.socketId + '.js');
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
    if (file.originalname.split('.')[1] !== 'js')
        return cb(new Error('Only .js files can be uploaded'), false);
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
		try {
			await socketValidator(req, res);
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
				if (!req.file) {
					res.status(400).json({ error: "Bad Request: No JavaScript File Provided!" });
					return console.error('Bad Request Error at /upload POST. No JavaScript File Provided!');
				}
				if (!req.body.dockerConfig) {
					res.status(400).json({ error: "Bad Request: No Docker Configuration Instruction Provided!" });
					return console.error("Bad Request Error at /upload POST. No Docker Configuration Instruction Provided!");
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
			}
		} catch (err) {
			res.status(err.status).json({
				error: err.message,
			});
		}
	});
}

module.exports = uploadController;

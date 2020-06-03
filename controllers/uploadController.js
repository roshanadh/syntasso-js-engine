const multer = require('multer');

const socketController = require('./socketController.js');
const Handler = require('./DockerConfigHandler.js');

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
    if (file.originalname.split('.').length > 2) {
        cb(new Error('File name cannot contain more than one period (.)'), false);
    } else if (file.originalname.split('.')[1] !== 'js') {
        cb(new Error('Only .js files can be uploaded'), false);
    }
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

    fileUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred during uploading
            console.error(`A Multer error occurred at uploadController while uploading:\n${err}`);
            return res.status(503).json({
                error: 'An error occurred while uploading the submitted JavaScript file'
            });
        } else if (err) {
            // An error occurred during uploading
            console.error(`An error occurred at uploadController while uploading:\n${err}`);
            return res.status(503).json({
                error: 'An error occurred while uploading the submitted JavaScript file'
            });
        } else {
            const socketStatus = socketController(req, res);
            if (socketStatus === -1) return;
            
            if (!req.file) {
                console.error('Bad Request Error at /execute POST. No JavaScript File Provided!');
                return res.status(400).json({ error: "Bad Request: No JavaScript File Provided!" });
            }
            if (!req.body.dockerConfig) {
                console.error("Bad Request Error at /execute POST. No Docker Configuration Instruction Provided!");
                return res.status(400).json({ error: "Bad Request: No Docker Configuration Instruction Provided!" });
            }
            
            let dockerConfig = req.body.dockerConfig;
            try {
                dockerConfig = parseInt(req.body.dockerConfig);
            } catch (err) {
                console.error("Bad Request Error at /execute POST. dockerConfig Value Is Not A Number!");
                return res.status(400).send("Bad Request: dockerConfig Value Is Not A Number!");
            }

            switch(dockerConfig) {
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
                    console.error("Bad Request Error at /execute POST. dockerConfig Value Is Not A Valid Number!"); 
                    return res.status(400).send("Bad Request: dockerConfig Value Is Not A Valid Number!");
            }
        }
    });
}

module.exports = uploadController;

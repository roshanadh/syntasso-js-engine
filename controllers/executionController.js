const socketController = require('./socketController.js');
const Handler = require('./DockerConfigHandler.js');
const { updateCodeInFile } = require('../filesystem/index.js');

const handler = new Handler();
module.exports = executionController = (req, res) => {
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
    const socketStatus = socketController(req, res);
    if (socketStatus === -1) return;
    
    if (!req.body.code) {
        console.error("Bad Request Error at /execute POST. No Code Provided!");
        return res.status(400).json({ error: "Bad Request: No Code Provided!" });
    }
    if (!req.body.dockerConfig) {
        console.error("Bad Request Error at /execute POST. No Docker Configuration Instruction Provided!");
        return res.status(400).json({ error: "Bad Request: No Docker Configuration Instruction Provided!" });
    }
    // write the provided code into a file
    updateCodeInFile(req.session.socketId, req.body.code);
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

module.exports = executionController;

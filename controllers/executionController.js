const Handler = require('./DockerConfigHandler.js');
const { updateCodeInFile } = require('../file/index.js');

const handler = new Handler();
executionController = (req, res) => {
    console.log("POST request received at /execute");
    /*
    * All req.body params =>
    * 1. req.body.code: String => contains JavaScript code to be compiled and executed
    * 2. req.body.dockerConfig: Integer => 
    * ... a) if 0, docker environment (image build and container create) should be setup ...
    * ... ... before code execution
    * ... b) if 1, docker container should be started before code execution, no need to ....
    * ... ... build an image or to create a container
    * ... c) if 2, just execute the code, no need to create and/or start the container
    */
    if(!req.body.code) {
        res.status(400).send("Bad Request: No Code Provided!");
        throw new Error("Bad Request Error at /execute POST. No Code Provided!");
    }
    if(!req.body.dockerConfig) {
        res.status(400).send("Bad Request: No Docker Configuration Instruction Provided!");
        throw new Error("Bad Request Error at /execute POST. No Docker Configuration Instruction Provided!");
    }
    // write the provided code into a file
    updateCodeInFile(req.body.code);
    let dockerConfig = req.body.dockerConfig;
    try {
        dockerConfig = parseInt(req.body.dockerConfig);
    } catch (err) {
        res.status(400).send("Bad Request: dockerConfig Value Is Not A Number!");
        throw new Error("Bad Request Error at /execute POST. dockerConfig Value Is Not A Number!");
    }

    switch(dockerConfig) {
        case 0:
            handler.handleConfigZero(res);
            break;
        case 1:
            handler.handleConfigOne(res);
            break;
        case 2:
            handler.handleConfigTwo(res);
            break;
        default:
            res.status(400).send("Bad Request: dockerConfig Value Is Not A Valid Number!");
            throw new Error("Bad Request Error at /execute POST. dockerConfig Value Is Not A Valid Number!");    
    }
}

module.exports = executionController;

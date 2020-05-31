module.exports = socketController = (req, res, next) => {
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
    * socketController deals with the socketId parameter included in the request body
    */

    const { socketInstance } = require('../server.js');
    const listOfClients = Object.keys(socketInstance.instance.sockets.sockets);

    if (!req.body.socketId) {
        res.status(400).json({ error: "Bad Request: No Socket ID Provided!" });
        throw new Error("Bad Request Error at /execute POST. No Socket ID Provided!");
    }
    if (!listOfClients.includes(req.body.socketId)) {
        res.status(401).json({ error: "Unauthorized Request: Socket ID Not Recognized!" });
        throw new Error("Unauthorized Request Error at /execute POST. Socket ID Not Recognized!");
    }
    next();
}
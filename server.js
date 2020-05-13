const express = require('express');
const bodyParser = require('body-parser');

const DockerApp = require('./docker/app.js');
const { updateCodeInFile, readOutput } = require('./file/index.js');

const app = express();
const dockerApp = new DockerApp();

app.set('json spaces', 2);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    console.log("GET request received at /");
    res.send("Hello World!");
});

app.post('/execute', (req, res) => {
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
            handleConfigZero(res);
            break;
        case 1:
            handleConfigOne(res);
            break;
        case 2:
            handleConfigTwo(res);
            break;
        default:
            res.status(400).send("Bad Request: dockerConfig Value Is Not A Valid Number!");
            throw new Error("Bad Request Error at /execute POST. dockerConfig Value Is Not A Valid Number!");    
    }
});

handleConfigZero = async(res) => {
    let imageBuildTime, containerCreateTime, containerStartTime;
    try {
        let { stderr, totalTime } = await dockerApp.buildNodeImage();
        imageBuildTime = totalTime;

        stderr ? console.error(`stderr in dockerApp.buildNodeImage(): ${image.stderr}`)
        : console.log('Node.js image built.');
    
    } catch (err) {
        // handle promise rejection
        res.status(503).send(`Service currently unavailable due to server conditions.`);
        throw new Error(`Error in dockerApp.buildNodeImage(): ${error}`);
    }    
    try {
        let { stderr, totalTime } = await dockerApp.createNodeContainer();
        containerCreateTime = totalTime;

        stderr ? console.error(`stderr in dockerApp.createNodeContainer(): ${container.stderr}`)
        : console.log('Node.js container created.');
    
    } catch (err) {
        // handle promise rejection
        res.status(503).send(`Service currently unavailable due to server conditions.`);
        throw new Error(`Error in dockerApp.createNodeContainer(): ${error}`);
    }
    try {
        let { stderr, totalTime } = await dockerApp.startNodeContainer();
        containerStartTime = totalTime;

        stderr ? console.error(`stderr in dockerApp.startNodeContainer(): ${startStatus.stderr}`)
        : console.log('Node.js container started.');
    
    } catch (err) {
        // handle promise rejection
        res.status(503).send(`Service currently unavailable due to server conditions.`);
        throw new Error(`Error in dockerApp.startNodeContainer(): ${error}`);
    }

    let { error, execTime } = dockerApp.execInNodeContainer();
    if (error) {
        console.error(`Error in dockerApp.execInNodeContainer(): ${error}`);
        res.status(503).send(`Service currently unavailable due to server conditions.`);   
    }
    console.log('\nResponse to the client:');
    const response = {
        output: readOutput().toString(),
        imageBuildTime,
        containerCreateTime,
        containerStartTime,
        execTime,
    };
    console.dir(response);
    res.status(200).json(response);
}

handleConfigOne = async(res) => {
    let containerStartTime;
    try {
        let { stderr, totalTime } = await dockerApp.startNodeContainer();
        containerStartTime = totalTime;

        stderr ? console.error(`stderr in dockerApp.startNodeContainer(): ${startStatus.stderr}`)
        : console.log('Node.js container started.');
    
    } catch (err) {
        // handle promise rejection
        res.status(503).send(`Service currently unavailable due to server conditions.`);
        throw new Error(`Error in dockerApp.startNodeContainer(): ${error}`);
    }

    let { error, execTime } = dockerApp.execInNodeContainer();
    if (error) {
        console.error(`Error in dockerApp.execInNodeContainer(): ${error}`);
        res.status(503).send(`Service currently unavailable due to server conditions.`);   
    }
    console.log('\nResponse to the client:');
    const response = {
        output: readOutput().toString(),
        containerStartTime,
        execTime,
    };
    console.dir(response);
    res.status(200).json(response);
}

handleConfigTwo = (res) => {
    let { error, execTime } = dockerApp.execInNodeContainer();
    if (error) {
        console.error(`Error in dockerApp.execInNodeContainer(): ${error}`);
        /*
         * Check if the error message is for an idle container
        */
        try {
            if (error.slice(-15).trim() === "is not running")
                res.status(503).json({
                    error: "The container is not currently running on the server. Request again with dockerConfig 0 or 1."
                });
            else res.status(503).send(`Service currently unavailable due to server conditions.`);
        } catch (err) {
            console.error(`Error during slicing the error message from dockerApp.execInNodeContainer(): ${err}`);
            res.status(503).send(`Service currently unavailable due to server conditions.`);
        }
    } else {
        console.log('\nResponse to the client:');
        const response = {
            output: readOutput().toString(),
            execTime,
        };
        console.dir(response);
        res.status(200).json(response);    
    }
}

app.listen(8080, () => {
    console.log('Syntasso JS Engine server listening on port 8080 ...');
});
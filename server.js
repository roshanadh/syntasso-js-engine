const express = require('express');
const bodyParser = require('body-parser');

const DockerApp = require('./docker/app.js');
const { updateCodeInFile, readOuput } = require('./file/index.js');

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
    * ... b) if 1, docker container should be started before code execution
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

    if (dockerConfig === 0) {
        // build image and then create container
        // dockerApp.buildNodeImage()
        // .then(image => {
        //     image.stderr ? console.error(`stderr in dockerApp.buildNodeImage(): ${image.stderr}`)
        //         : console.log('Node.js image built.');

        //     dockerApp.createNodeContainer()
        //         .then(container => {
        //             container.stderr ? console.error(`stderr in dockerApp.createNodeContainer(): ${container.stderr}`)
        //                 : console.log('Node.js container created.');
        //             }, error => {
        //                 console.error(`Error in dockerApp.createNodeContainer(): ${error}`)
        //         })
        // }, error => {
        //         console.error(`Error in dockerApp.buildNodeImage(): ${error}`)
        // });

        dockerApp.buildNodeImage()
        .then(image => {
            image.stderr ? console.error(`stderr in dockerApp.buildNodeImage(): ${image.stderr}`)
                : console.log('Node.js image built.');

            dockerApp.createNodeContainer()
                .then(container => {
                    container.stderr ? console.error(`stderr in dockerApp.createNodeContainer(): ${container.stderr}`)
                        : console.log('Node.js container created.');

                    dockerApp.startNodeContainer()
                        .then(startStatus => {
                            startStatus.stderr ? console.error(`stderr in dockerApp.startNodeContainer(): ${startStatus.stderr}`)
                                : console.log('Node.js container started.');

                            dockerApp.execInNodeContainer();
                            console.log(`Output: ${readOuput()}`);
                            res.status(200).send(`Output: ${readOuput()}`);

                            }, error => {
                                console.error(`Error in dockerApp.startNodeContainer(): ${error}`);
                                res.status(503).send(`Service currently unavailable due to server conditions.`);
                        })
                    }, error => {
                        console.error(`Error in dockerApp.createNodeContainer(): ${error}`);
                        res.status(503).send(`Service currently unavailable due to server conditions.`);
                })
        }, error => {
                console.error(`Error in dockerApp.buildNodeImage(): ${error}`);
                res.status(503).send(`Service currently unavailable due to server conditions.`);
        });
    } else if (dockerConfig === 1) {
        dockerApp.startNodeContainer()
            .then(startStatus => {
                startStatus.stderr ? console.error(`stderr in dockerApp.startNodeContainer(): ${startStatus.stderr}`)
                    : console.log('Node.js container started.');

                dockerApp.execInNodeContainer();
                console.log(`Output: ${readOuput()}`);
                res.status(200).send(`Output: ${readOuput()}`);

            }, error => {
                console.error(`Error in dockerApp.startNodeContainer(): ${error}`);
                res.status(503).send(`Service currently unavailable due to server conditions.`);
        });
    } else if (dockerConfig === 2) {
        const executionStatus = dockerApp.execInNodeContainer();
        if (!(executionStatus === undefined)) {
            let { error } = executionStatus;
            console.error(`Error in dockerApp.execInNodeContainer(): ${error}`);
            res.status(503).send(`Service currently unavailable due to server conditions.`);
        } else {
            console.log(`Output: ${readOuput()}`);
            res.status(200).send(`Output: ${readOuput()}`);
        }
    } else {
        res.status(400).send("Bad Request: dockerConfig Value Is Not A Valid Number!");
        throw new Error("Bad Request Error at /execute POST. dockerConfig Value Is Not A Valid Number!");
    }
    // dockerApp.buildNodeImage()
    //     .then(image => {
    //         image.stderr ? console.error(`stderr in dockerApp.buildNodeImage(): ${image.stderr}`)
    //             : console.log('Node.js image built.');

    //         dockerApp.createNodeContainer()
    //             .then(container => {
    //                 container.stderr ? console.error(`stderr in dockerApp.createNodeContainer(): ${container.stderr}`)
    //                     : console.log('Node.js container created.');

    //                 dockerApp.startNodeContainer()
    //                     .then(startStatus => {
    //                         startStatus.stderr ? console.error(`stderr in dockerApp.startNodeContainer(): ${startStatus.stderr}`)
    //                             : console.log('Node.js container started.');

    //                         dockerApp.execInNodeContainer();
    //                         console.log(`Output: ${readOuput()}`);
    //                         res.status(200).send(`Output: ${readOuput()}`);

    //                         }, error => {
    //                             console.error(`Error in dockerApp.startNodeContainer(): ${error}`)
    //                     })
    //                 }, error => {
    //                     console.error(`Error in dockerApp.createNodeContainer(): ${error}`)
    //             })
    //     }, error => {
    //             console.error(`Error in dockerApp.buildNodeImage(): ${error}`)
    //     })
});

app.listen(8080, () => {
    console.log('Syntasso JS Engine server listening on port 8080 ...');
});
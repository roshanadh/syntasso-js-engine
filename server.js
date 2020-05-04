const express = require('express');
const bodyParser = require('body-parser');

const DockerApp = require('./docker/app.js');
const { updateCodeInFile, readOuput } = require('./file/index.js');

const app = express();
const dockerApp = new DockerApp();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    console.log("GET request received at /");
    res.send("Hello World!");
});

app.post('/execute', (req, res) => {
    console.log("POST request received at /execute");
    if(!req.body.code) {
        res.status(400).send("Bad Request: No Code Provided!");
        throw new Error("Bad Request Error at /execute POST. No Code Provided!");
    }
    updateCodeInFile(req.body.code);
    // dockerApp.buildNodeImage()
    //     .then(image => {
    //         image.stderr ? console.error(`stderr in dockerApp.buildNodeImage(): ${image.stderr}`)
    //             : console.log();

    //         dockerApp.createNodeContainer()
    //             .then(container => {
    //                 container.stderr ? console.error(`stderr in dockerApp.createNodeContainer(): ${container.stderr}`)
    //                     : console.log();

    //                 dockerApp.startNodeContainer()
    //                     .then(startStatus => {
    //                         startStatus.stderr ? console.error(`stderr in dockerApp.startNodeContainer(): ${startStatus.stderr}`)
    //                             : console.log();

    //                         dockerApp.execInNodeContainer();
    //                         }, error => {
    //                             console.error(`Error in dockerApp.startNodeContainer(): ${error}`)
    //                     })
    //                 }, error => {
    //                     console.error(`Error in dockerApp.createNodeContainer(): ${error}`)
    //             })
    //     }, error => {
    //             console.error(`Error in dockerApp.buildNodeImage(): ${error}`)
    //     })
        // .then(() => {
        //     dockerApp.createNodeContainer()
        //         .then(container => {
        //             container.stderr ? console.error(`stderr in dockerApp.createNodeContainer(): ${container.stderr}`)
        //                 : console.log();
        //             }, error => {
        //                 console.error(`Error in dockerApp.createNodeContainer(): ${error}`)
        //         })
        //         .then(() => {
        //             dockerApp.startNodeContainer()
        //                 .then(startStatus => {
        //                     startStatus.stderr ? console.error(`stderr in dockerApp.startNodeContainer(): ${startStatus.stderr}`)
        //                         : console.log();
        //                     }, error => {
        //                     console.error(`Error in dockerApp.startNodeContainer(): ${error}`)
        //                 })
        //         })

                dockerApp.buildNodeImage()
                    .then(() => {
                        dockerApp.createNodeContainer()
                            .then(() => {
                                dockerApp.startNodeContainer()
                                    .then(() => {
                                        dockerApp.execInNodeContainer();
                                        console.log(`Output: ${readOuput()}`);
                                        res.send(`Output: ${readOuput()}`);
                                    })
                            })
                    })
                    
    // dockerApp.buildNodeImage().then(handleSuccessfulImageBuild(image), handleImageBuildError());
    // res.status(200).send(`Code to be executed: ${req.body.code}`);
});

// handleSuccessfulImageBuild(image) {
//     image.stderr ? console.error(`stderr in dockerApp.buildNodeImage(): ${image.stderr}`)
//     : console.log();

//     dockerApp.createNodeContainer()
//         .then(container => {

//         }, error => {

//         });
// }

// handleImageBuildError(error) {
//     return console.error(`Error in dockerApp.buildNodeImage(): ${error}`)
// }

app.listen(8080, () => {
    console.log('Syntasso JS Engine server listening on port 8080 ...');
});
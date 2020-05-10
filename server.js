const express = require('express');
const bodyParser = require('body-parser');

const { execInNodeContainer } = require('./docker/app.js');
const { updateCodeInFile } = require('./file/index.js');

const app = express();

app.set('json spaces', 2);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    console.log("GET request received at /");
    res.send("Hello World!");
});

app.post('/execute', (req, res) => {
    console.log("POST request received at /execute\n");
    /*
    * All req.body param(s) =>
    * 1. req.body.code: String => contains JavaScript code to be compiled and executed
    */
    if(!req.body.code) {
        res.status(400).send("Bad Request: No Code Provided!");
        throw new Error("Bad Request Error at /execute POST. No Code Provided!");
    }
    // write the user submitted code into a file
    updateCodeInFile(req.body.code);
    // compile and execute the code inside a Node.js container
    let { stdout, stderr } = execInNodeContainer();
    if (stderr) {
        console.error(`stderr in dockerApp.execInNodeContainer(): ${stderr}`);
        res.status(503).send(`Service currently unavailable due to server conditions.`);
    } else {
        console.log('\nResponse to the client:');
        console.dir({ output: stdout });
        res.status(200).json({ output: stdout });
    }
});

app.listen(8080, () => {
    console.log('Syntasso JS Engine server listening on port 8080 ...');
});

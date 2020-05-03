const express = require('express');
const bodyParser = require('body-parser');

const { dockerApp } = require('./docker/app.js')

const app = express();

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
    res.status(200).send(`Code to be executed: ${req.body.code}`);
});

app.listen(8080, () => {
    console.log('Syntasso JS Engine server listening on port 8080 ...');
});
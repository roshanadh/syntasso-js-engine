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
    res.send("Hello World!");
});

app.listen(8080, () => {
    console.log('Syntasso JS Engine server listening on port 8080 ...');
});
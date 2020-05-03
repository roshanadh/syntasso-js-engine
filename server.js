const express = require('express');
const app = express();

app.get('/', (req, res) => {
    console.log("Request received at /");
    res.send("Hello World!");
});

app.listen(8080, () => {
    console.log('Syntasso JS Engine server listening on port 8080 ...');
});
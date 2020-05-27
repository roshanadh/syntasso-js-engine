const express = require('express');
const bodyParser = require('body-parser');
const { PORT } = require('./utils.js');

const app = express();
const router = require('./routes/router.js');

app.set('json spaces', 2);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(router);

const server = app.listen(PORT, () => {
    console.log('Syntasso JS Engine server listening on port 8080 ...');
});

module.exports = server;

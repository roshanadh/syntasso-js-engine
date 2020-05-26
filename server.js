const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env) throw new Error('Environment variable(s) not set.');

const PORT = process.env.PORT;
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

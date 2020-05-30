const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const createSocket = require('./socket/socket.js');
const { PORT } = require('./utils.js');

const app = express();
app.use(cors());

const router = require('./routes/router.js');

app.set('json spaces', 2);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(router);

const server = app.listen(PORT, () => {
    console.log(`Syntasso JS Engine server listening on port ${PORT}...`);
});

createSocket(server);

module.exports = server;

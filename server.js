const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');

const Socket = require('./socket/socket.js');
const { PORT, SECRET_SESSION_KEY } = require('./utils.js');

const app = express();
app.use(session({
    secret: SECRET_SESSION_KEY,
    saveUninitialized: true,
    resave: true,
}));
app.use(cors());

const router = require('./routes/router.js');

app.set('json spaces', 2);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(router);

const server = app.listen(PORT, () => {
    console.log(`Syntasso JS Engine server listening on port ${PORT}...`);
});

socketInstance = new Socket(server);

module.exports = { server, socketInstance };

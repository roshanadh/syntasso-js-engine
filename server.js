const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const redis = require("redis");
const RedisStore = require("connect-redis")(session);
const cors = require("cors");

const Socket = require("./socket/socket.js");
const { PORT, LIVE_SERVER_PORT, SECRET_SESSION_KEY } = require("./config.js");

const client = redis.createClient();
const app = express();
app.use(
	session({
		secret: SECRET_SESSION_KEY,
		store: new RedisStore({
			host: "localhost",
			port: 6379,
			client,
		}),
		saveUninitialized: false,
		resave: false,
	})
);

// change origin to Syntasso Client's protocol://address:port when NODE_ENV = prod
app.use(
	cors({ credentials: true, origin: `http://127.0.0.1:${LIVE_SERVER_PORT}` })
);

const router = require("./routes/router.js");

app.set("json spaces", 2);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(router);

const server = app.listen(PORT, () => {
	console.log(`Syntasso JS Engine server listening on port ${PORT}...`);
});

socketInstance = new Socket(server);

module.exports = { server, socketInstance, client };

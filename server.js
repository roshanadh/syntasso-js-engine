const http = require("http");
const express = require("express");
const redis = require("redis");
const sticky = require("sticky-session");
const cluster = require("cluster");
const blocked = require("blocked-at");

const Socket = require("./socket/socket.js");
const {
	PORT,
	CLIENT_PORT,
	SECRET_SESSION_KEY,
	REDIS_PORT,
} = require("./config.js");
const log4js = require("./util/logger.js");

const client = redis.createClient();
const app = express();
let server = http.createServer(app);

const { NODE_ENV } = process.env;

let logger = log4js.getLogger();

if (NODE_ENV === "dev") {
	logger = log4js.getLogger("dev");
	// inspect event-loop blocks
	blocked((time, stack) => {
		logger.warn(`Blocked for ${time}ms, operation started here:`, stack);
	});
}

if (cluster.isMaster && !module.parent) {
	// if current process is the master process and the ...
	// ... application has no parent script i.e. the ...
	// ... application has not been launched from another ...
	// ... script (e.g. a test script like /test/test-config.js)
	server.once("listening", () => {
		logger.info(`Syntasso JS Engine server listening on port ${PORT}...`);
	});
} else {
	// if the current process is a worker process or if the application ...
	// ... has been launched from another script, most likely the ...
	// ... test script (/test/test-config.js)

	// log the worker process' ID only if module.parent doesn't exist i.e. if ...
	// ... the application hasn't been launched from another script
	!module.parent
		? logger.info(`Worker process ${cluster.worker.id} forked`)
		: null;
	const cors = require("cors");
	const session = require("express-session");
	const bodyParser = require("body-parser");
	const RedisStore = require("connect-redis")(session);

	const router = require("./routes/router.js");

	app.use(
		session({
			secret: SECRET_SESSION_KEY,
			store: new RedisStore({
				host: "localhost",
				port: parseInt(REDIS_PORT),
				client,
			}),
			saveUninitialized: false,
			resave: false,
		})
	);

	// change origin to Syntasso Client's protocol://address:port when NODE_ENV = prod
	app.use(
		cors({
			credentials: true,
			origin: `http://127.0.0.1:${CLIENT_PORT}`,
		})
	);

	app.set("json spaces", 2);

	app.use(express.urlencoded({ extended: false }));
	app.use(express.json());

	app.use(router);
}

if (!module.parent) {
	// if the application has no parent script, ...
	// ... create a cluster
	sticky.listen(server, PORT, {
		// if NODE_ENV === "prod", fork 8 processes, otherwise, use 1 worker process
		workers: NODE_ENV === "prod" ? require("os").cpus().length : 1,
	});
} else {
	// if the application was started by another script, ...
	// ... for instance the test script (/test/test-config.js)
	server = app.listen(PORT, () => {
		logger.info(`Syntasso JS Engine server listening on port ${PORT}...`);
	});
}

socketInstance = new Socket(server).instance;

module.exports = { server, socketInstance, client };

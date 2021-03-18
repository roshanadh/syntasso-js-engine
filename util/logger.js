const log4js = require("log4js");

const { NODE_ENV } = process.env;

log4js.configure({
	appenders: {
		console: { type: "console" },
		// rolling file appender
		file: {
			type: "file",
			filename: "./logs/application.logs",
			maxLogSize: 5000,
			backups: 5,
		},
	},
	categories: {
		default: {
			appenders: ["console", "file"],
			level: "all",
		},
		dev: {
			appenders: ["console"],
			level: "all",
		},
		prod: {
			appenders: ["file"],
			level: "warn",
		},
	},
});

class SharedLogger {
	_logger = undefined;

	static getSharedLogger() {
		if (!this._logger) {
			this._logger = log4js.getLogger(
				NODE_ENV === "dev" ? "dev" : "default"
			);
		}
		return this._logger;
	}
}

module.exports = SharedLogger.getSharedLogger();

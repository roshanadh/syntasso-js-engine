const log4js = require("log4js");

log4js.configure({
	appenders: {
		console: { type: "console" },
		// rolling file appender
		file: {
			type: "file",
			filename: "../logs/application.logs",
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

module.exports = log4js;

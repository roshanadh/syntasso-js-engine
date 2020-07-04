const fs = require("fs");
const path = require("path");

const { SECRET_DIVIDER_TOKEN } = require("../config.js");

module.exports = (socketId, code) => {
	return new Promise((resolve, reject) => {
		let filePath = path.resolve(
			__dirname,
			"..",
			"client-files",
			socketId,
			"submission.js"
		);
		// wrap user-submitted code inside a try-catch block
		let finalCode =
			`
		"use strict";
		try {
			${code}
		} catch (err) {
			console.log('${SECRET_DIVIDER_TOKEN}');
			console.log(JSON.stringify({ errorName: err.name, errorMessage: err.message, errorStack: err.stack }));
		}
	`;
		/*
		 * /client-files/${socketId} directory may not have been created if ...
		 * ... no sampleInputs and expectedOutputs files have been uploaded ...
		 * since they're created (fs.mkdir) inside the 'destination' function ...
		 * ... of multer.diskStorage.
		 * So, create the required directories if they do not exist yet.
		*/
		let basePath = path.resolve(__dirname, "..", "client-files", socketId);
		// check if ${basePath} dir exits before creating it
		fs.stat(basePath, (err, stats) => {
			if (err) {
				if (err.message.includes("ENOENT: no such file or directory")) {
					fs.mkdir(basePath, (err) => {
						if (err) {
							console.error(`Error while creating client-files/${socketId}/ directory: ${err.stack}`);
							reject(false);
							throw err;
						}
						fs.writeFile(filePath, finalCode, (err) => {
							if (err) {
								console.error(`Error during writing code to file: ${err.stack}`);
								reject(false);
								throw err;
							}
							console.log(`Submitted code written to file: ${filePath}`);
							resolve(true);
							return;
						});
					});
				} else {
					console.error(`Error while reading client-files/${socketId}/ directory: ${err.stack}`);
					reject(false);
					throw err;
				}
			}
			fs.writeFile(filePath, finalCode, (err) => {
				if (err) {
					console.error(`Error during writing code to file: ${err.stack}`);
					reject(false);
					throw err;
				}
				console.log(`Submitted code written to file: ${filePath}`);
				resolve(true);
			});
		});
	});
};

const fs = require("fs");
const path = require("path");

const { SECRET_DIVIDER_TOKEN } = require("../config.js");

module.exports = (socketId) => {
	return new Promise((resolve, reject) => {
		let filePath = path.resolve(
			__dirname,
			"..",
			"client-files",
			socketId,
			"submission.js"
		);
		let fileContent;
		fs.readFile(filePath, (err, data) => {
			if (err) {
				console.error(`Error while reading submission.js: ${err}`);
				reject(false);
				throw err;
			}
			fileContent = data;

			// wrap user-submitted code inside a try-catch block
			let finalCode = `"use strict";\ntry {\n${fileContent}\n} catch (err) {
				console.log('${SECRET_DIVIDER_TOKEN}');
				console.log(JSON.stringify({ errorName: err.name, errorMessage: err.message, errorStack: err.		stack }));
			}`;
			fs.writeFile(filePath, finalCode, (err) => {
				if (err) {
					console.error(`Error during adding divider token to file: ${err}`);
					reject(false);
					throw err;
				}
				console.log(`Divider token added to file: ${filePath}`);
				resolve(true);
			});
		});
	});
}

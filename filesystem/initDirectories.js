const fs = require("fs");
const path = require("path");

module.exports = () => {
	return new Promise((resolve, reject) => {
		let outputsDirPath = path.resolve(
			__dirname,
			"..",
			"client-files",
			"outputs"
		);
		fs.mkdir(outputsDirPath, (err) => {
			if (err && !err.code === "EEXIST") {
				console.error(`Error while creating outputs directory: ${err.stack}`);
				reject(false);
				throw err;
			}
			resolve(true);
		});
	});
}

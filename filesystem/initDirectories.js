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
		fs.stat(outputsDirPath, (err, stats) => {
			if (err) {
				if (err.message.includes("ENOENT: no such file or directory")) {
					fs.mkdir(outputsDirPath, (err) => {
						if (err) {
							console.error(`Error while creating outputs directory: ${err.stack}`);
							reject(false);
							throw err;
						}
						resolve(true);
					});
				} else {
					console.error(`Error while reading outputs directory: ${err.stack}`);
					reject(false);
					throw err;
				}
			}
			resolve(true);
		});
	});
}

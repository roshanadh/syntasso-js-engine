const fs = require("fs");
const path = require("path");

module.exports = socketId => {
	return new Promise(async (resolve, reject) => {
		try {
			await require("./removeTestFiles.js")(socketId);
			const sampleInputsDirPath = path.resolve(
				__dirname,
				"..",
				"client-files",
				socketId,
				"sampleInputs"
			);
			const expectedOutputsDirPath = path.resolve(
				__dirname,
				"..",
				"client-files",
				socketId,
				"expectedOutputs"
			);
			console.log(
				`Creating test case files path for socket ID: ${socketId}...`
			);

			fs.mkdir(sampleInputsDirPath, { recursive: true }, error => {
				if (error) {
					// do nothing if path already exists
					if (error.code === "EEXIST") {
					} else {
						return reject(error);
					}
				}
				fs.mkdir(expectedOutputsDirPath, { recursive: true }, err => {
					if (err) {
						// do nothing if path already exists
						if (err.code === "EEXIST") {
						} else {
							return reject(err);
						}
					}
					console.log(
						`Test case files path created for socket ID: ${socketId}.`
					);
					return resolve(true);
				});
			});
		} catch (error) {
			console.error(`Error inside createTestFilesPath:`, error);
			return reject(error);
		}
	});
};

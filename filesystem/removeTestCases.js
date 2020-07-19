const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");

module.exports = (socketId) => {
	// unlike cleanUpTempFiles.js, removeTestCases.js exports a function that ...
	// ... removes just the uploaded test cases, to prevent a future request from ...
	// ... the same socketID using the previously uploaded test cases, even if the ...
	// ... new request doesn't include any test cases
	let sampleInputsFilesPath = path.resolve(
		__dirname,
		"..",
		"client-files",
		socketId,
		"sampleInputs"
	);
	let expectedOutputsFilesPath = path.resolve(
		__dirname,
		"..",
		"client-files",
		socketId,
		"expectedOutputs"
	);

	return new Promise((resolve, reject) => {
		console.log(`Removing any previously uploaded test cases for ${socketId}...`);
		rimraf(sampleInputsFilesPath, err => {
			if (err && err.code === "ENOENT") {
				console.log("No test cases were found.");
				resolve(true);
				return;
			} else if (err) {
				console.error(`Error while removing test cases file for socket ID: ${socketId}: ${err}`);
				reject(err);
				return;
			} else {
				rimraf(expectedOutputsFilesPath, err => {
					if (err && err.code === "ENOENT") {
						console.log("No test cases were found.");
						resolve(true);
						return;
					} else if (err) {
						console.error(`Error while removing test cases file for socket ID: ${socketId}: ${err}`);
						reject(err);
						return;
					}

					resolve(true);
					return console.log(`Test cases for socket ${socketId} removed.`);
				});
			}
		});
	});
}
const path = require("path");
const rimraf = require("rimraf");

module.exports = socketId => {
	// unlike cleanUpClient.js, removeTestFiles.js exports a function that ...
	// ... removes just the generated files for individual test cases, to prevent ...
	// ... a future request from the same socketID using the previously generated ...
	// ... test case files, even if the new request doesn't include any test cases
	let sampleInputsDirPath = path.resolve(
		__dirname,
		"..",
		"client-files",
		socketId,
		"sampleInputs"
	);
	let expectedOutputsDirPath = path.resolve(
		__dirname,
		"..",
		"client-files",
		socketId,
		"expectedOutputs"
	);

	return new Promise((resolve, reject) => {
		console.log(
			`Removing any previously generated test case files for ${socketId}...`
		);
		rimraf(sampleInputsDirPath, err => {
			if (err && err.code === "ENOENT") {
				console.log("No sample inputs were found.");
				return resolve(true);
			} else if (err) {
				console.error(
					`Error while removing sample input files for socket ID: ${socketId}: ${err}`
				);
				return reject(err);
			} else {
				rimraf(expectedOutputsDirPath, err => {
					if (err && err.code === "ENOENT") {
						console.log("No expected outputs were found.");
						return resolve(true);
					} else if (err) {
						console.error(
							`Error while removing expected output files for socket ID: ${socketId}: ${err}`
						);
						return reject(err);
					}
					resolve(true);
					return console.log(
						`Test case files for socket ${socketId} removed.`
					);
				});
			}
		});
	});
};

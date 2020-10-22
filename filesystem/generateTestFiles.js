const fs = require("fs");
const path = require("path");

module.exports = req => {
	return new Promise(async (resolve, reject) => {
		const { socketId, testCases } = req.body;
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
				`Generating test case files for socket ID ${socketId}...`
			);
			fs.mkdir(sampleInputsDirPath, { recursive: true }, err => {
				if (err) {
					// do nothing if path already exists
					if (err.code === "EEXIST") {
					} else {
						reject(false);
						throw err;
					}
				}
				fs.mkdir(expectedOutputsDirPath, { recursive: true }, err => {
					if (err) {
						// do nothing if path already exists
						if (err.code === "EEXIST") {
						} else {
							reject(false);
							throw err;
						}
					}

					// at this point, both sampleInputs and expectedOutputs dirs have ...
					// ... been created, so write files inside the directories
					let sampleInputFilePath, expectedOutputFilePath;
					try {
						testCases.forEach((element, index) => {
							sampleInputFilePath = path.resolve(
								sampleInputsDirPath,
								`${socketId}-sampleInput-${index}.txt`
							);
							expectedOutputFilePath = path.resolve(
								expectedOutputsDirPath,
								`${socketId}-expectedOutput-${index}.txt`
							);
							try {
								fs.writeFileSync(
									sampleInputFilePath,
									element.sampleInput.toString()
								);
								console.log(
									`${socketId}-sampleInput-${index}.txt generated.`
								);
								fs.writeFileSync(
									expectedOutputFilePath,
									element.expectedOutput.toString()
								);
								console.log(
									`${socketId}-expectedOutput-${index}.txt generated.`
								);
							} catch (err) {
								console.error(
									`Error while writing to test case files for socketId ${socketId}:`,
									err
								);
								return reject(err);
							}
						});
					} catch (err) {
						console.error(
							`Error while writing to test case files for socketId ${socketId}:`,
							err
						);
						return reject(err);
					}
					console.log(
						`Test case files generated for socket ID ${socketId}.`
					);
					return resolve(true);
				});
			});
		} catch (error) {
			console.error(
				`Error while writing to test case files for socketId ${socketId}:`,
				error
			);
			return reject(error);
		}
	});
};

const fs = require("fs");
const path = require("path");

module.exports = (req) => {
	return new Promise((resolve, reject) => {
		const { socketId, testCases } = req.body;
		let sampleInputs = [], expectedOutputs = [];

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

		fs.mkdir(sampleInputsDirPath, { recursive: true }, (err) => {
			if (err) {
				// do nothing if path already exists
				if (err.code === "EEXIST") {}
				else {
					reject(false);
					throw err;
				}
			}
			fs.mkdir(expectedOutputsDirPath, { recursive: true }, (err) => {
				if (err) {
					// do nothing if path already exists
					if (err.code === "EEXIST") { }
					else {
						reject(false);
						throw err;
					}
				}

				// at this point, both sampleInputs and expectedOutputs dirs have ...
				// ... been created, so write files inside the directories
				let sampleInputFilePath,
					expectedOutputFilePath
				testCases.forEach((element, index) => {
					sampleInputs[index] = element.sampleInput;
					expectedOutputs[index] = element.expectedOutput;

					sampleInputFilePath = path.resolve(
						sampleInputsDirPath,
						`${socketId}-sampleInput-${index}.txt`
					);
					expectedOutputFilePath = path.resolve(
						expectedOutputsDirPath,
						`${socketId}-expectedOutput-${index}.txt`
					);
					fs.writeFile(sampleInputFilePath, element.sampleInput, (err) => {
						if (err) {
							reject(false);
							throw err;
						}
						fs.writeFile(expectedOutputFilePath, element.expectedOutput, (err) => {
							if (err) {
								reject(false);
								throw err;
							}
							resolve(true);
						});
					});
				});
			});
		});
	});
}

const fs = require("fs");
const path = require("path");

const logger = require("../util/logger.js");

module.exports = req => {
	return new Promise(async (resolve, reject) => {
		const { socketId, testCases } = req.body;
		try {
			// create new test files directories
			await require("./createTestFilesPath.js")(socketId);

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

			logger.info(
				`Generating test case files for socket ID ${socketId}...`
			);
			// at this point, both sampleInputs and expectedOutputs dirs have ...
			// ... been created, so write files inside the directories
			let sampleInputFilePath, expectedOutputFilePath;
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
					logger.info(
						`${socketId}-sampleInput-${index}.txt generated.`
					);
					fs.writeFileSync(
						expectedOutputFilePath,
						element.expectedOutput.toString()
					);
					logger.info(
						`${socketId}-expectedOutput-${index}.txt generated.`
					);
				} catch (err) {
					logger.error(
						`Error while writing to test case files for socketId ${socketId}:`,
						err
					);
					return reject(err);
				}
			});
			logger.info(`Test case files generated for socket ID ${socketId}.`);
			return resolve(true);
		} catch (error) {
			logger.error(
				`Error while writing to test case files for socketId ${socketId}:`,
				error
			);
			return reject(error);
		}
	});
};

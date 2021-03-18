const fs = require("fs");
const path = require("path");

const logger = require("../util/logger.js");

module.exports = req => {
	const { socketId } = req.body;
	const fileName = `${socketId}.js`;
	const filePath = path.resolve(
		__dirname,
		"..",
		"client-files",
		socketId,
		fileName
	);

	const { code } = req.body;
	return new Promise((resolve, reject) => {
		logger.info(`Generating submission file named ${fileName}`);
		fs.writeFile(filePath, code, error => {
			if (error) {
				logger.error(
					`error while generating submission file: ${error}`
				);
				return reject(error);
			}
			logger.info(`Submission file ${fileName} generated.`);
			return resolve(fileName);
		});
	});
};

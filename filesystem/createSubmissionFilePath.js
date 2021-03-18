const fs = require("fs");
const path = require("path");

const logger = require("../util/logger.js");

module.exports = socketId => {
	return new Promise((resolve, reject) => {
		try {
			logger.info(
				`Creating submission file path for socket ID: ${socketId}...`
			);
			const submissionFilePath = path.resolve(
				__dirname,
				"..",
				"client-files",
				socketId
			);
			fs.mkdir(submissionFilePath, { recursive: true }, (error, path) => {
				if (error && error.code !== "EEXIST") {
					logger.error(
						`Error while creating ${socketId} directory recursively:`,
						error
					);
					return reject(error);
				}
				logger.info(
					`Submission file path created for socket ID: ${socketId}.`
				);
				return resolve(submissionFilePath);
			});
		} catch (error) {
			logger.error(`Error inside createSubmissionFilePath:`, error);
			reject(error);
		}
	});
};

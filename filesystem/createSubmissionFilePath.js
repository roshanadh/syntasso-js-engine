const fs = require("fs");
const path = require("path");

module.exports = socketId => {
	return new Promise((resolve, reject) => {
		try {
			console.log(
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
					console.error(
						`Error while creating ${socketId} directory recursively:`,
						error
					);
					return reject(error);
				}
				console.log(
					`Submission file path created for socket ID: ${socketId}.`
				);
				return resolve(submissionFilePath);
			});
		} catch (error) {
			console.error(`Error inside createSubmissionFilePath:`, error);
			reject(error);
		}
	});
};

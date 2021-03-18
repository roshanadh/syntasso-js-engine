const { exec } = require("child_process");

const logger = require("../util/logger.js");

module.exports = socketId => {
	return new Promise((resolve, reject) => {
		try {
			logger.info(
				"Removing any existing client-files/ contents from container..."
			);
			exec(
				`docker exec -i ${socketId} sh -c "rm -rf sampleInputs; rm -rf expectedOutputs"`,
				(error, stdout, stderr) => {
					if (error) {
						logger.error(
							`Error while removing client-files/ contents from container ${socketId}:`,
							error
						);
						// reject an object with keys error or stderr, because this ...
						// ... makes it easier to check later if an error occurred ...
						// ... or an stderr was generated during the removal process
						return reject({ error });
					}
					if (stderr) {
						logger.error(
							`stderr while removing client-files/ contents from container ${socketId}:`,
							stderr
						);
						// reject an object with keys error or stderr, because this ...
						// ... makes it easier to check later if an error occurred ...
						// ... or an stderr was generated during the removal process
						return reject({ stderr });
					}
					logger.info(
						`client-files/ contents removed from container ${socketId}`
					);
					return resolve(stdout);
				}
			);
		} catch (error) {
			logger.error("Error in removeClientFilesFromNodeContainer:", error);
			return reject({ error });
		}
	});
};

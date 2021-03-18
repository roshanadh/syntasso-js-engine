const path = require("path");
const { exec } = require("child_process");

const logger = require("../util/logger.js");

module.exports = req => {
	return new Promise((resolve, reject) => {
		try {
			const { socketId } = req.session;
			logger.info("Copying client-files/ to container...");
			const localPath = path.resolve(
				__dirname,
				"..",
				"client-files",
				socketId
			);
			exec(
				`docker cp ${localPath}/. ${socketId}:/usr/src/sandbox/`,
				(error, stdout, stderr) => {
					if (error) {
						logger.error(
							`Error while copying client-files/ to container ${socketId}:`,
							error
						);
						// reject an object with keys error or stderr, because this ...
						// ... makes it easier to check later if an error occurred ...
						// ... or an stderr was generated during the copying process
						return reject({ error });
					}
					if (stderr) {
						logger.error(
							`stderr while copying client-files/ to container ${socketId}:`,
							stderr
						);
						// reject an object with keys error or stderr, because this ...
						// ... makes it easier to check later if an error occurred ...
						// ... or an stderr was generated during the copying process
						return reject({ stderr });
					}
					logger.info(
						`stdout after copying client-files/ to container ${socketId}: ${stdout}`
					);
					logger.info(
						`client-files/ copied to container ${socketId}`
					);
					return resolve(stdout);
				}
			);
		} catch (error) {
			logger.error("Error in copyClientFilesToNodeContainer:", error);
			return reject({ error });
		}
	});
};

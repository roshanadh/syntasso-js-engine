const path = require("path");
const { exec } = require("child_process");

module.exports = req => {
	return new Promise((resolve, reject) => {
		try {
			const { socketId } = req.session;
			console.log("Copying client-files/ to container...");
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
						console.error(
							`Error while copying client-files/ to container ${socketId}:`,
							error
						);
						// reject an object with keys error or stderr, because this ...
						// ... makes it easier to check later if an error occurred ...
						// ... or an stderr was generated during the copying process
						return reject({ error });
					}
					if (stderr) {
						console.error(
							`stderr while copying client-files/ to container ${socketId}:`,
							stderr
						);
						// reject an object with keys error or stderr, because this ...
						// ... makes it easier to check later if an error occurred ...
						// ... or an stderr was generated during the copying process
						return reject({ stderr });
					}
					console.log(
						`stdout after copying client-files/ to container ${socketId}: ${stdout}`
					);
					console.log(
						`client-files/ copied to container ${socketId}`
					);
					return resolve(stdout);
				}
			);
		} catch (error) {
			console.error("Error in copyClientFilesToNodeContainer:", error);
			return reject({ error });
		}
	});
};

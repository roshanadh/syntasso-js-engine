const { exec } = require("child_process");

module.exports = socketId => {
	return new Promise((resolve, reject) => {
		try {
			console.log(
				"Removing any existing client-files/ contents from container..."
			);
			exec(
				`docker exec -i ${socketId} sh -c "rm -rf sampleInputs; rm -rf expectedOutputs"`,
				(error, stdout, stderr) => {
					if (error) {
						console.error(
							`Error while removing client-files/ contents from container ${socketId}:`,
							error
						);
						// reject an object with keys error or stderr, because this ...
						// ... makes it easier to check later if an error occurred ...
						// ... or an stderr was generated during the removal process
						return reject({ error });
					}
					if (stderr) {
						console.error(
							`stderr while removing client-files/ contents from container ${socketId}:`,
							stderr
						);
						// reject an object with keys error or stderr, because this ...
						// ... makes it easier to check later if an error occurred ...
						// ... or an stderr was generated during the removal process
						return reject({ stderr });
					}
					console.log(
						`client-files/ contents removed from container ${socketId}`
					);
					return resolve(stdout);
				}
			);
		} catch (error) {
			console.error(
				"Error in removeClientFilesFromNodeContainer:",
				error
			);
			return reject({ error });
		}
	});
};

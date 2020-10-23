const path = require("path");
const rimraf = require("rimraf");

module.exports = socketId => {
	// remove the {socketId} sub-directory inside the client-files directory
	return new Promise((resolve, reject) => {
		let clientFilesSubDirPath;
		try {
			clientFilesSubDirPath = path.resolve(
				__dirname,
				"..",
				"client-files",
				socketId
			);
			console.log(
				`Removing client-files sub-directory for socket ID ${socketId}...`
			);
			if (process.env.NODE_ENV === "test") {
				// if in test env, use the sync method
				rimraf.sync(clientFilesSubDirPath);
				console.log(
					`Removed client-files sub-directory for socket ID ${socketId}.`
				);
				return resolve(clientFilesSubDirPath);
			} else {
				// if in env other than test, use the async method
				rimraf(clientFilesSubDirPath, error => {
					if (error && error.code !== "ENOENT") {
						console.error(
							`error while removing client-files sub-directory for socket ID ${socketId}:`,
							error
						);
						return reject(error);
					}
					console.log(
						`Removed client-files sub-directory for socket ID ${socketId}.`
					);
					return resolve(clientFilesSubDirPath);
				});
			}
		} catch (error) {
			if (error.code === "ENOENT") return resolve(clientFilesSubDirPath);
			console.error(`error inside cleanUpClientFiles:`, error);
			reject(error);
		}
	});
};

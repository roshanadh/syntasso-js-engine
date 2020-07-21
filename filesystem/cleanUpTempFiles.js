const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");

module.exports = (socketId) => {
	let tempFilesPath = path.resolve(
		__dirname,
		"..",
		"client-files",
		socketId
	);
	let outputFilePath = path.resolve(
		__dirname,
		"..",
		"client-files",
		"outputs",
		`${socketId}.txt`
	);

	const NODE_ENV = process.env.NODE_ENV;
	if (NODE_ENV === "test") {
		// use synchronous function rimraf.sync() for testing
		try {
			rimraf.sync(tempFilesPath);
			console.log(`Temporary client files for socket ${socketId} removed because of disconnection.`);
		} catch (err) {
			err.message.includes("ENOENT")
				? console.log("No temporary client files were found.")
				: console.error(`Error while removing temporary client files file for socket ID: ${socketId}: ${err}`);
		}
		try {
			fs.unlinkSync(outputFilePath);
			console.log(`Temporary output file for socket ${socketId} removed because of disconnection.`);
		} catch (err) {
			err.message.includes("ENOENT")
				? console.log("No temporary output file was found.")
				: console.error(`Error while removing output file '${socketId}.js': ${err}`);
		}
	} else {
		// use asynchronous function rimraf() for dev and prod NODE_ENV
		rimraf(tempFilesPath, err => {
			if (err) {
				return err.message.includes("ENOENT")
					? console.log("No temporary client files were found.")
					: console.error(`Error while removing temporary client files file for socket ID: ${socketId}: ${err}`);
			}
			return console.log(`Temporary client files for socket ${socketId} removed because of disconnection.`);
		});
		fs.unlink(outputFilePath, err => {
			if (err) {
				return err.message.includes("ENOENT")
					? console.log("No temporary output file was found.")
					: console.error(`Error while removing output file '${socketId}.js': ${err}`);
			};
			return console.log(`Temporary output file for socket ${socketId} removed because of disconnection.`);
		});
	}
}

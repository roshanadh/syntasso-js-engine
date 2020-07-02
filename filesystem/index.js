const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");

const { SECRET_DIVIDER_TOKEN } = require("../config.js");

module.exports.initDirectories = () => {
	return new Promise((resolve, reject) => {
		let outputsDirPath = path.resolve(
			__dirname,
			"..",
			"client-files",
			"outputs"
		);
		fs.stat(outputsDirPath, (err, stats) => {
			if (err) {
				if (err.message.includes("ENOENT: no such file or directory")) {
					fs.mkdir(outputsDirPath, (err) => {
						if (err) {
							console.error(`Error while creating outputs directory: ${err.stack}`);
							reject(false);
							throw err;
						}
						resolve(true);
					});
				}
				console.error(`Error while creating outputs directory: ${err.stack}`);
				reject(false);
				throw err;
			} 
			resolve(true);
		});
	});
}

module.exports.updateCodeInFile = (socketId, code) => {
	return new Promise((resolve, reject) => {
		let filePath = path.resolve(
			__dirname,
			"..",
			"client-files",
			socketId,
			"submission.js"
		);
		// wrap user-submitted code inside a try-catch block
		let finalCode =
			`
		"use strict";
		try {
			${code}
		} catch (err) {
			console.log('${SECRET_DIVIDER_TOKEN}');
			console.log(JSON.stringify({ errorName: err.name, errorMessage: err.message, errorStack: err.stack }));
		}
	`;
		/*
		 * /client-files/${socketId} directory may not have been created if ...
		 * ... no sampleInputs and expectedOutputs files have been uploaded ...
		 * since they're created (fs.mkdir) inside the 'destination' function ...
		 * ... of multer.diskStorage.
		 * So, create the required directories if they do not exist yet.
		*/
		let basePath = path.resolve(__dirname, "..", "client-files", socketId);
		// check if ${basePath} dir exits before creating it
		fs.stat(basePath, (err, stats) => {
			if (err) {
				if (err.message.includes("ENOENT: no such file or directory")) {
					fs.mkdir(basePath, (err) => {
						if (err) {
							console.error(`Error while creating client-files/${socketId}/ directory: ${err.stack}`);
							reject(false);
							throw err;
						}
						fs.writeFile(filePath, finalCode, (err) => {
							if (err) {
								console.error(`Error during writing code to file: ${err.stack}`);
								reject(false);
								throw err;
							}
							console.log(`Submitted code written to file: ${filePath}`);
							resolve(true);
						});
					});
				} else {
					console.error(`Error while reading client-files/${socketId}/ directory: ${err.stack}`);
					reject(false);
					throw err;
				}
			}
			fs.writeFile(filePath, finalCode, (err) => {
				if (err) {
					console.error(`Error during writing code to file: ${err.stack}`);
					reject(false);
					throw err;
				}
				console.log(`Submitted code written to file: ${filePath}`);
				resolve(true);
			});
		});
	});
};

module.exports.addDividerToken = (socketId) => {
	return new Promise((resolve, reject) => {
		let filePath = path.resolve(
			__dirname,
			"..",
			"client-files",
			socketId,
			"submission.js"
		);
		let fileContent;
		fs.readFile(filePath, (err, data) => {
			if (err) {
				console.error(`Error while reading submission.js: ${err}`);
				reject(false);
				throw err;
			}
			fileContent = data;

			// wrap user-submitted code inside a try-catch block
			let finalCode = `"use strict";\ntry {\n${fileContent}\n} catch (err) {
				console.log('${SECRET_DIVIDER_TOKEN}');
				console.log(JSON.stringify({ errorName: err.name, errorMessage: err.message, errorStack: err.		stack }));
			}`;
			fs.writeFile(filePath, finalCode, (err) => {
				if (err) {
					console.error(`Error during adding divider token to file: ${err}`);
					reject(false);
					throw err;
				}
				console.log(`Divider token added to file: ${filePath}`);
				resolve(true);
			});
		});
	});
}

module.exports.readOutput = (socketId) => {
	let filePath = path.resolve(
		__dirname,
		"..",
		"client-files",
		"outputs",
		socketId + ".txt"	
	);
	let fileContents = "";
	return new Promise((resolve, reject) => {
		try {
			/*
			 *  Reads output of the user-submitted code.
			 *  Also reads any errors present in the form of the object:
			 *  { errorName: '', errorMessage: '', errorStack: '' }
			 *
			 *  The output is written in output.txt along with the error object.
			 *  To parse the error object safely from the output file, we substring ...
			 *  ... the content of the file output.txt.
			 *  To find the point of substring (i.e. the position of error object) ...
			 *  ... we place a SECRET_DIVIDER_TOKEN in the output.txt file just before the ...
			 *  ... error object and just after the output of the user-submitted code
			 *
			 *  We then search for the SECRET_DIVIDER_TOKEN in the fileContent string to get ...
			 *  ... point of substring.
			 *
			 */
			fs.readFile(filePath, (err, data) => {
				if (err) {
					console.error(`Error during reading output from file: ${err.stack}`);
					reject({ errorInProcess: err });
				}
				fileContents = data;
				if (fileContents.toString().trim() === "")
					// the output file has not been populated
					resolve({
						sampleInputs: null,
						testStatus: null,
						expectedOutput: null,
						observedOutput: null,
						error: null,
						errorInProcess: "The output file has not been populated"
					});
				// fetch fileContents.sampleInputs to get number of test cases
				// and get observed output for each sampleInput
				fileContents = JSON.parse(fileContents.toString());
				
				let sampleInputs = fileContents.sampleInputs;
				let observedOutput = {},
					response = {
						sampleInputs,
					},
					error;
				// else: the output file has been populated ...
				// ... parse the output file to get output for each ...
				// ... sample input

				// if no sampleInput file was uploaded
				if (sampleInputs === 0) {
					observedOutput = fileContents.observedOutput;
					const startIndex = observedOutput.search(SECRET_DIVIDER_TOKEN);

					if (startIndex === -1) {
						// no error was observed if SECRET_DIVIDER_TOKEN ...
						// ... doesn't exist in observedOutput object
						error = null;
					} else {
						// length of SECRET_DIVIDER_TOKEN is 10
						error = observedOutput.substring(startIndex + 10).trim();
						observedOutput = observedOutput.substring(0, startIndex);

						error = JSON.parse(error);
						// parse error line number and column number from errorStack
						let stack = error.errorStack;
						let index = stack.search(`/home/client-files/${socketId}/submission.js:`);

						let str = stack.substring(index + `/home/client-files/${socketId}/submission.js:`.length);
						let lineNumber = str.split(':')[0];
						let columnNumber = str.split(':')[1].split(')')[0];

						// delete errorStack property from error object to reorder its occurrence ...
						// ... below lineNumber and columnNumber
						delete error.errorStack;
						error = {
							...error,
							lineNumber,
							columnNumber,
							errorStack: stack,
						}
					}
					resolve({
						sampleInputs: fileContents.sampleInputs,
						expectedOutput: null,
						observedOutput,
						error
					});
				}
				// else: at least one sample input file has been uploaded
				for (let i = 0; i < sampleInputs; i++) {
					// read observedOutput for each sampleInput
					observedOutput = fileContents[`sampleInput${i}`].observedOutput;

					const startIndex = observedOutput.search(SECRET_DIVIDER_TOKEN);
					if (startIndex === -1) {
						// no error was observed if SECRET_DIVIDER_TOKEN ...
						// ... doesn't exist in observedOutput object
						error = null;
					} else {
						// length of SECRET_DIVIDER_TOKEN is 10
						error = observedOutput.substring(startIndex + 10).trim();
						observedOutput = observedOutput.substring(0, startIndex);

						error = JSON.parse(error);
						// parse error line number and column number from errorStack
						let stack = error.errorStack;
						let index = stack.search(`/home/client-files/${socketId}/submission.js:`);

						let str = stack.substring(index + `/home/client-files/${socketId}/submission.js:`.length);
						let lineNumber = str.split(':')[0];
						let columnNumber = str.split(':')[1].split(')')[0];

						// delete errorStack property from error object to reorder its occurrence ...
						// ... below lineNumber and columnNumber
						delete error.errorStack;
						error = {
							...error,
							lineNumber,
							columnNumber,
							errorStack: stack,
						}
					}
					response[`sampleInput${i}`] = {
						testStatus: fileContents[`sampleInput${i}`].testStatus,
						sampleInput: fileContents[`sampleInput${i}`].sampleInput,
						expectedOutput: fileContents[`sampleInput${i}`].expectedOutput,
						observedOutput,
						error,
						execTimeForProcess: fileContents[`sampleInput${i}`].execTimeForProcess
					}
				}
				resolve({ ...response });
			});

		} catch (err) {
			console.error(`Error during reading output from file: ${err.stack}`);
			reject({ errorInProcess: err });
		}
	});
}

module.exports.removeTempFiles = (socketId) => {
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
		// use synchronous function fs.unlinkSync() for testing
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
		// use asynchronous function fs.unlink() for dev and prod NODE_ENV
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

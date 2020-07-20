const fs = require("fs");
const path = require("path");

const { SECRET_DIVIDER_TOKEN } = require("../config.js");

module.exports = (socketId) => {
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
				if (fileContents.toString().trim() === "") {
					// the output file has not been populated
					resolve({
						sampleInputs: null,
						testStatus: null,
						timedOut: null,
						expectedOutput: null,
						observedOutput: null,
						error: null,
						errorInProcess: "The output file has not been populated"
					});
					return;
				}

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
					// check for null observedOutput
					/*
					 * observedOutput may be null incase of a too long stdout ...
					 * ... when executing submission.js file from inside ...
					 * ... main-wrapper.js
					*/
					if (observedOutput === null) {
						resolve({
							timedOut: fileContents.timedOut,
							sampleInputs: fileContents.sampleInputs,
							expectedOutput: null,
							observedOutput,
							observedOutputTooLong: fileContents.observedOutputTooLong,
							error: null
						});
						return;
					}
					// else: observedOutput is not null
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
						let lineNumber = parseInt(str.split(':')[0]);
						// when wrapping a custom try...catch block around user submitted code ..
						// ...there is one extra line before user's code begins ...
						// ... so to respond with the actual lineNumber, subtract 1
						lineNumber -= 1;
						// SyntaxError's stack may not have any column number, ...
						// ... so check if str.split(':')[1] exists, if it does, ...
						// ... that's the column number.
						// If it doesn't exist, put column number as null
						
						let columnNumber =
							str.split(':')[1]
								? parseInt(str.split(':')[1].split(')')[0])
								: null;

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
						timedOut: fileContents.timedOut,
						sampleInputs: fileContents.sampleInputs,
						expectedOutput: null,
						observedOutput,
						observedOutputTooLong: fileContents.observedOutputTooLong,
						error
					});
					return;
				}
				// else: at least one sample input file has been uploaded
				for (let i = 0; i < sampleInputs; i++) {
					// read observedOutput for each sampleInput
					observedOutput = fileContents[`sampleInput${i}`].observedOutput;

					// check for null observedOutput
					/*
					 * observedOutput may be null incase of a too long stdout ...
					 * ... when executing submission.js file from inside ...
					 * ... main-wrapper.js
					*/
					if (observedOutput === null) {
						response[`sampleInput${i}`] = {
							testStatus: fileContents[`sampleInput${i}`].testStatus,
							timedOut: fileContents[`sampleInput${i}`].timedOut,
							sampleInput: fileContents[`sampleInput${i}`].sampleInput,
							expectedOutput: fileContents[`sampleInput${i}`].expectedOutput,
							observedOutput,
							observedOutputTooLong: fileContents[`sampleInput${i}`].observedOutputTooLong,
							error: null,
							execTimeForProcess: fileContents[`sampleInput${i}`].execTimeForProcess
						}
						continue;
					}
					// else: observedOutput is not null
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
						let lineNumber = parseInt(str.split(':')[0]);
						// when wrapping a custom try...catch block around user submitted code ..
						// ...there is one extra line before user's code begins ...
						// ... so to respond with the actual lineNumber, subtract 1
						lineNumber -= 1;
						// SyntaxError's stack may not have any column number, ...
						// ... so check if str.split(':')[1] exists, if it does, ...
						// ... that's the column number.
						// If it doesn't exist, put column number as null

						let columnNumber =
							str.split(':')[1]
								? parseInt(str.split(':')[1].split(')')[0])
								: null;

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
						timedOut: fileContents[`sampleInput${i}`].timedOut,
						sampleInput: fileContents[`sampleInput${i}`].sampleInput,
						expectedOutput: fileContents[`sampleInput${i}`].expectedOutput,
						observedOutput,
						observedOutputTooLong: fileContents[`sampleInput${i}`].observedOutputTooLong,
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

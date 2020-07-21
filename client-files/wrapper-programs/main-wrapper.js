"use strict";
/*
 *	Instead of compiling submission.js inside the container using ...
 *	... 'docker exec', compile main-wrapper.js
 *	This wrapper program will spawn n Node.js processes for n sampleInputs ...
 *	... and compile submission.js inside each process, all the while passing ...
 *	... corresponding sampleInput to the process.stdin of the corresponding ...
 *	... spawned Node.js process
 *
 */
const path = require("path");
const { spawnSync } = require("child_process");
const { performance } = require("perf_hooks");

const { read } = require("./uploaded-files-reader.js");
const { parseError } = require("./error-parser.js");

/*
 * Constraints for executing submission.js:
 * 1. Time constraint for time-outs
 * 2. Length constraint for restricting outputs that are too long
 * 
*/
// execution of each .js file times out after a certain period
const EXECUTION_TIME_OUT_IN_MS = 2000;
// max length of stdout for each nodeProcess
const MAX_LENGTH_STDOUT = 2000;

let sampleInputFileContents = "";
let expectedOutputFileContents = "";

const socketId = process.env.socketId.trim();
const secret_divider_token = process.env.SECRET_DIVIDER_TOKEN.trim();
// main-wrapper.js is in the location: home/client-files/main-wrapper.js inside the container
// submission.js is in the location: home/client-files/${socketId}/submission.js inside the container
const submissionFilePath = path.resolve(
	__dirname,
	socketId,
	"submission.js"
);

// array of sampleInput and expectedOutput filenames
let sampleInputs,
	expectedOutputs;

let nodeProcess,
	execTimeForProcess,
	response = {
		type: "full-response",
	};

/*
 * @Response types:
 * If response.type = "full-response", it signifies to any process ...
 * ... running 'node main-wrapper.js' and listening for its stdout that ...
 * ... the response it's receiving is a full-body response and not individual ...
 * ... 'test is complete' events emitted by main-wrapper.js
 */

/*
 * @stdout and @stderr:
 * Since the user-submitted code isn't wrapped in any try...catch block ...
 * ... any errors during the execution of the user-submitted code will be ...
 * ... obtained from stderr
 * However, if the code runs without any error, the output of the code will be ...
 * ... obtained from stdout
 */

try {
	read(socketId)
		.then(response => {
			sampleInputs = response.sampleInputs;
			expectedOutputs = response.expectedOutputs;

			main();
		})
		.catch(err => {
			if (
				err.message === "No test files have been uploaded" ||
				err.message === "Number of sampleInput and expectedOutput files mismatch"
			) {
				// spawn one process and do not pass any sample input to it
				try {
					nodeProcess = spawnSync("node", [submissionFilePath], {
						timeout: EXECUTION_TIME_OUT_IN_MS
					});

					const io = nodeProcess.output;
					const stdout = io[1].toString().length <= MAX_LENGTH_STDOUT
						? io[1].toString()
						: null;
					const stderr = io[2].toString();

					if (stderr === "") {
						// no stderr was observed
						// testStatus null because no test files have been uploaded
						let testStatus = null;
						
						response = {
							sampleInputs: 0,
							testStatus,
							// if nodeProcess timed out, its signal would be SIGTERM by default ...
							// ... otherwise, its signal would be null
							timedOut:
								nodeProcess.signal === "SIGTERM"
									? true
									: false,
							expectedOutput: null,
							observedOutput: stdout,
							// if length of stdout is larger than MAX length permitted, ...
							// ... set stdout as null and specify reason in response object
							observedOutputTooLong: stdout === null
								? true
								: false,
						}
						// NOTE: Do not log to the console or write to stdout ...
						// ... from inside main-wrapper.js except for the response ...
						// ... object itself
						// Any console.log or process.stdout.write from inside main-wrapper.js ...
						// ... writes to the output file and may cause error during JSON.parse ...
						// ... of the contents obtained from the output file
						process.stdout.write(Buffer.from(JSON.stringify(response)));
					} else {
						// parse error from stderr
						const { outputPart, errorBody } = parseError(stderr, stdout, socketId);
						
						response = {
							sampleInputs: 0,
							testStatus: false,
							// if nodeProcess timed out, its signal would be SIGTERM by default ...
							// ... otherwise, its signal would be null
							timedOut:
								nodeProcess.signal === "SIGTERM"
									? true
									: false,
							expectedOutput: null,
							// the presence of a SECRET_DIVIDER_TOKEN in observedOutput indicates ...
							// ... to the readOutput function that an error was observed during ...
							//...execution
							observedOutput: `${outputPart}${secret_divider_token}\n${errorBody}`,
							// if length of stdout is larger than MAX length permitted, ...
							// ... set stdout as null and specify reason in response object
							observedOutputTooLong: stdout === null
								? true
								: false,
						}
						// NOTE: Do not log to the console or write to stdout ...
						// ... from inside main-wrapper.js except for the response ...
						// ... object itself
						// Any console.log or process.stdout.write from inside main-wrapper.js ...
						// ... writes to the output file and may cause error during JSON.parse ...
						// ... of the contents obtained from the output file
						process.stdout.write(Buffer.from(JSON.stringify(response)));
					}
				} catch (err) {
					throw new Error(err);
				}
			} else throw new Error(err);
		});
} catch (err) {
	throw new Error(err);
}

const main = () => {
	// spawn n Node.js processes for n sampleInputs
	response["sampleInputs"] = sampleInputs.length;
	for (let i = 0; i < sampleInputs.length; i++) {
		try {
			execTimeForProcess = performance.now();
			nodeProcess = spawnSync("node", [submissionFilePath], {
				input: writeToStdin(sampleInputs.files[i]),
				timeout: EXECUTION_TIME_OUT_IN_MS
			});
			execTimeForProcess = performance.now() - execTimeForProcess;

			const io = nodeProcess.output;
			const stdout = io[1].toString().length <= MAX_LENGTH_STDOUT
				? io[1].toString()
				: null;
			const stderr = io[2].toString();

			if (stderr === "") {
				// no stderr was observed
				expectedOutputFileContents = expectedOutputs.fileContents[expectedOutputs.files[i]].toString();

				let testStatus = true;
				
				if (expectedOutputFileContents !== stdout)
					testStatus = false;
				/*
				 * response object looks like following:
				 * {
				 *		sampleInput0: {
				 *			testStatus: true | false | null,
				 *			sampleInput: "Hello World!\n",
				 *			expectedOutput: "Hello World!\n",
				 *			observedOutput: "Hello World!\n",
				 *			execTimeForProcess: 65,
				 *		}
				 *		...
				 * }
				 * 
				 */
				response[`sampleInput${i}`] = {
					testStatus,
					timedOut:
						nodeProcess.signal === "SIGTERM"
							? true
							: false,
					sampleInput: sampleInputs.fileContents[sampleInputs.files[i]].toString(),
					expectedOutput: expectedOutputFileContents.toString(),
					observedOutput: stdout,
					// if length of stdout is larger than MAX length permitted, ...
					// ... set stdout as null and specify reason in response object
					observedOutputTooLong: stdout === null
						? true
						: false,
					execTimeForProcess,
				}

				// write to stdout to indicate completion of test #i
				process.stdout.write(Buffer.from(JSON.stringify({
					type: "test-status",
					process: i,
					testStatus,
					timedOut:
						nodeProcess.signal === "SIGTERM"
							? true
							: false,
					// if length of stdout is larger than MAX length permitted, ...
					// ... set stdout as null and specify reason in response object
					observedOutputTooLong: stdout === null
						? true
						: false,
				})));
			} else {
				// parse error from stderr
				const { outputPart, errorBody } = parseError(stderr, stdout, socketId);
				
				expectedOutputFileContents = expectedOutputs.fileContents[expectedOutputs.files[i]].toString();

				let testStatus = false;

				response[`sampleInput${i}`] = {
					testStatus,
					timedOut:
						nodeProcess.signal === "SIGTERM"
							? true
							: false,
					sampleInput: sampleInputs.fileContents[sampleInputs.files[i]].toString(),
					expectedOutput: expectedOutputFileContents.toString(),
					observedOutput: `${outputPart}${secret_divider_token}\n${errorBody}`,
					// if length of stdout is larger than MAX length permitted, ...
					// ... set stdout as null and specify reason in response object
					observedOutputTooLong: stdout === null
						? true
						: false,
					execTimeForProcess,
				}

				// write to stdout to indicate completion of test #i
				process.stdout.write(Buffer.from(JSON.stringify({
					type: "test-status",
					process: i,
					testStatus,
					timedOut:
						nodeProcess.signal === "SIGTERM"
							? true
							: false,
					// if length of stdout is larger than MAX length permitted, ...
					// ... set stdout as null and specify reason in response object
					observedOutputTooLong: stdout === null
						? true
						: false,
				})));
			}
		} catch (err) {
			throw new Error(err);
		}
	}
	// NOTE: Do not log to the console or write to stdout ...
	// ... from inside main-wrapper.js except for the response ...
	// ... object itself
	// Any console.log or process.stdout.write from inside main-wrapper.js ...
	// ... writes to the output file and may cause error during JSON.parse ...
	// ... of the contents obtained from the output file
	process.stdout.write(Buffer.from(JSON.stringify(response)));
}

const writeToStdin = sampleInput => {
	sampleInputFileContents = sampleInputs.fileContents[sampleInput].toString();
	sampleInputFileContents = sampleInputFileContents.split("\n");
	sampleInputFileContents = JSON.stringify(sampleInputFileContents);

	return JSON.stringify({
		sampleInputId: sampleInput,
		fileContents: sampleInputFileContents,
	});
}

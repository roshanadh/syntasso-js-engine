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

const writeErrorToStderr = error => {
	process.stderr.write(
		Buffer.from(
			JSON.stringify({
				message: error.message,
				name: error.name,
				stack: error.stack,
			})
		)
	);
};

process.on("uncaughtException", writeErrorToStderr);

const { spawnSync } = require("child_process");
const { performance } = require("perf_hooks");

const readTestFiles = require("./read-test-files.js");
const { parseError } = require("./error-parser.js");

/*
 * Constraints for executing submission.js:
 * 1. Time constraint for time-outs
 * 2. Length constraint for restricting outputs that are too long
 *
 */
const socketId = process.env.socketId.trim();

// execution of each submission file times out after a certain period
const EXECUTION_TIME_OUT_IN_MS = parseInt(process.env.EXECUTION_TIME_OUT_IN_MS);
// max length of stdout for each nodeProcess
const MAX_LENGTH_STDOUT = parseInt(process.env.MAX_LENGTH_STDOUT);

const submissionFileName = `${socketId}.js`;

// JSON object containing an array of sampleInput files and another...
// ... array of the contents of those files
let sampleInputsData,
	// JSON object containing an array of expectedOutput files and another...
	// ... array of the contents of those files
	expectedOutputsData;

let sampleInputFileContents,
	expectedOutputFileContents,
	// response object to be sent to the process that executes main-wrapper.js
	response = {
		type: "full-response",
		timeOutLength: EXECUTION_TIME_OUT_IN_MS,
		observedOutputMaxLength: MAX_LENGTH_STDOUT,
	},
	processes = [];

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
	readTestFiles(socketId)
		.then(response => {
			({ sampleInputsData, expectedOutputsData } = response);
			main();
		})
		.catch(err => {
			if (
				err.message === "No test files have been generated" ||
				err.message ===
					"Number of sampleInput and expectedOutput files mismatch"
			) {
				// spawn one process and do not pass any sample input to it
				try {
					let executionTimeForProcess = performance.now();
					let nodeProcess = spawnSync("node", [submissionFileName], {
						timeout: EXECUTION_TIME_OUT_IN_MS,
						killSignal: "SIGTERM",
					});
					executionTimeForProcess =
						performance.now() - executionTimeForProcess;
					const io = nodeProcess.output;
					const stdout =
						io[1].toString().length <= MAX_LENGTH_STDOUT
							? io[1].toString()
							: null;
					const stderr =
						io[2].toString().trim() !== ""
							? io[2].toString().trim()
							: null;
					// testStatus will be null because no test files have been ...
					// ... generated
					let testStatus = null;
					let observedOutput = stdout,
						error = null;
					if (stderr) {
						const { errorInParser, errorBody } = parseError(
							stderr,
							socketId
						);
						if (errorInParser) {
							return writeErrorToStderr(errorInParser);
						}
						error = errorBody;
					}
					response = {
						type: "full-response",
						sampleInputs: 0,
						testStatus,
						// if nodeProcess timed out, its signal would be SIGTERM by default ...
						// ... otherwise, its signal would be null
						timedOut:
							nodeProcess.signal === "SIGTERM" ? true : false,
						timeOutLength: EXECUTION_TIME_OUT_IN_MS,
						expectedOutput: null,
						observedOutput,
						error,
						// if length of stdout is larger than MAX length permitted, ...
						// ... set stdout as null and specify reason in response object
						observedOutputTooLong: stdout === null ? true : false,
						observedOutputMaxLength: MAX_LENGTH_STDOUT,
						executionTimeForProcess,
					};
					// NOTE: Do not log to the console or write to stdout ...
					// ... from inside main-wrapper.js except for the response ...
					// ... object itself
					// Any console.log or process.stdout.write from inside main-wrapper.js ...
					// ... writes to the output file and may cause error during JSON.parse ...
					// ... of the contents obtained from the output file
					process.stdout.write(Buffer.from(JSON.stringify(response)));
				} catch (err) {
					writeErrorToStderr(err);
				}
			} else writeErrorToStderr(err);
		});
} catch (err) {
	writeErrorToStderr(err);
}

const main = () => {
	// spawn n Node.js processes for n sampleInputs
	response["sampleInputs"] = sampleInputsData.length;
	for (let i = 0; i < sampleInputsData.length; i++) {
		try {
			let executionTimeForProcess = performance.now();
			let nodeProcess = spawnSync(
				"node",
				[
					submissionFileName,
					passSampleInputsAsArg(sampleInputsData.files[i]),
				],
				{
					timeout: EXECUTION_TIME_OUT_IN_MS,
					killSignal: "SIGTERM",
				}
			);
			executionTimeForProcess =
				performance.now() - executionTimeForProcess;
			const io = nodeProcess.output;
			const stdout =
				io[1].toString().length <= MAX_LENGTH_STDOUT
					? io[1].toString()
					: null;
			const stderr =
				io[2].toString().trim() !== "" ? io[2].toString().trim() : null;

			expectedOutputFileContents =
				expectedOutputsData.fileContents[
					expectedOutputsData.files[i]
				].toString();

			let expectedOutput = expectedOutputFileContents.toString(),
				observedOutput = stdout,
				error = null,
				errorInParser,
				errorBody;
			if (stderr) {
				({ errorInParser, errorBody } = parseError(stderr, socketId));
				if (errorInParser) {
					return writeErrorToStderr(errorInParser);
				}
				error = errorBody;
			}
			let testStatus = observedOutput === expectedOutput;

			processes[i] = {
				id: i,
				testStatus,
				timedOut: nodeProcess.signal === "SIGTERM" ? true : false,
				sampleInput:
					sampleInputsData.fileContents[
						sampleInputsData.files[i]
					].toString(),
				expectedOutput,
				observedOutput,
				error,
				// if length of stdout is larger than MAX length permitted, ...
				// ... set stdout as null and specify reason in response object
				observedOutputTooLong: stdout === null ? true : false,
				executionTimeForProcess,
			};
			// write to stdout to indicate completion of test #i
			process.stdout.write(
				Buffer.from(
					JSON.stringify({
						type: "test-status",
						process: i,
						testStatus,
						timedOut:
							nodeProcess.signal === "SIGTERM" ? true : false,
						// if length of stdout is larger than MAX length permitted, ...
						// ... set stdout as null and specify reason in response object
						observedOutputTooLong: stdout === null ? true : false,
					})
				)
			);
		} catch (err) {
			return writeErrorToStderr(err);
		}
	}
	response = {
		...response,
		processes,
	};
	// NOTE: Do not log to the console or write to stdout ...
	// ... from inside main-wrapper.js except for the response ...
	// ... object itself
	// Any console.log or process.stdout.write from inside main-wrapper.js ...
	// ... writes to the output file and may cause error during JSON.parse ...
	// ... of the contents obtained from the output file
	process.stdout.write(Buffer.from(JSON.stringify(response)));
};

const passSampleInputsAsArg = sampleInputFile => {
	// pass sample inputs as command-line arguments
	let sampleInputFileContent =
		sampleInputsData.fileContents[sampleInputFile].toString();
	return sampleInputFileContent;
};

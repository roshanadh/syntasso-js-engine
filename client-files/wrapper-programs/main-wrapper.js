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
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { performance } = require("perf_hooks");

const { read } = require("./uploaded-files-reader.js");

let sampleInputFileContents = "";
let expectedOutputFileContents = "";

let socketId = process.env.socketId.trim();

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
	response = {};

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
				err.message === "Number of sampleInput and expectedOutput files"
			) {
				// spawn one process and do not pass any sample input to it
				try {
					nodeProcess = spawnSync("node", [submissionFilePath]);

					const io = nodeProcess.output;
					const stdout = io[1];
					const stderr = io[2].toString();

					if (stderr === "") {
						// no stderr was observed
						let testStatus = null;
						response = {
							sampleInputs: 0,
							testStatus,
							expectedOutput: null,
							observedOutput: stdout.toString()
						}
						// NOTE: Do not log to the console or write to stdout ...
						// ... from inside main-wrapper.js except for the response ...
						// ... object itself
						// Any console.log or process.stdout.write from inside main-wrapper.js ...
						// ... writes to the output file and may cause error during JSON.parse ...
						// ... of the contents obtained from the output file
						process.stdout.write(Buffer.from(JSON.stringify(response)));
					} else {
						throw new Error(`stderr during execution of submission.js: ${stderr}`)
					}
				} catch (err) {
					throw err;
				}
			}
			else throw err;
		});
} catch (err) {
	throw err;
}

const main = () => {
	// spawn n Node.js processes for n sampleInputs
	response["sampleInputs"] = sampleInputs.length;
	for (let i = 0; i < sampleInputs.length; i++) {
		try {
			execTimeForProcess = performance.now();
			nodeProcess = spawnSync("node", [submissionFilePath], {
				input: writeToStdin(sampleInputs.files[i]),
			});
			execTimeForProcess = performance.now() - execTimeForProcess;

			const io = nodeProcess.output;
			const stdout = io[1];
			const stderr = io[2].toString();

			if (stderr === "") {
				// no stderr was observed
				expectedOutputFileContents = expectedOutputs.fileContents[expectedOutputs.files[i]].toString();
				let testStatus = true;
				if (expectedOutputFileContents !== stdout.toString())
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
					sampleInput: sampleInputs.fileContents[sampleInputs.files[i]].toString(),
					expectedOutput: expectedOutputFileContents.toString(),
					observedOutput: stdout.toString(),
					execTimeForProcess,
				}
			} else {
				throw new Error(`stderr during execution of submission.js: ${stderr}`)
			}
		} catch (err) {
			throw err;
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

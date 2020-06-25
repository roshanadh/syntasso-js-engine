"use strict";
/*
 *	Instead of compiling submission.js inside the container using ...
 *	... 'docker exec', compile main-wrapper.js
 *	This wrapper program will spawn a new Node.js process and compile ...
 *	... submission.js inside the process, all the while passing sampleInputs ...
 *	... to the process.stdin of the spawned Node.js process
 * 
*/
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

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
const sampleInputFilePath = path.resolve(
	__dirname,
	socketId,
	"sampleInputs",
	`${socketId}-sampleInput-0.txt`
);

const expectedOutputFilePath = path.resolve(
	__dirname,
	socketId,
	"expectedOutputs",
	`${socketId}-expectedOutput-0.txt`
);

const writeToStdin = () => {
	fs.readFile(sampleInputFilePath, (err, data) => {
		if (err) {
			if (err.message.includes("ENOENT"))
				// write empty string to nodeProcess.stdin if ...
				// ... no sampleInputs file has been uploaded
				return "";

			console.error(`Error while reading sampleInput file: ${err}`);
			throw new Error(`Error while reading sampleInput file: ${err}`);
		} else {
			sampleInputFileContents = data.toString();
			sampleInputFileContents = sampleInputFileContents.split("\n");
			sampleInputFileContents = JSON.stringify(sampleInputFileContents);

			return sampleInputFileContents;
		}
	});
}
try {
	const nodeProcess = spawnSync("node", [submissionFilePath], {
		input: writeToStdin()
	});

	const io = nodeProcess.output;
	const stdout = io[1].toString();
	const stderr = io[2].toString();

	if (stderr === "") {
		// no stderr was observed
		let response = {};
		fs.readFile(expectedOutputFilePath, (err, data) => {
			if (err) {
				if (err.message.includes("ENOENT")) {
					// no expectedOutputs file has been uploaded ...
					// ... so testStatus and expectedOutput are non-existent
					response = {
						testStatus: null,
						expectedOutput: null,
						observedOutput: stdout
					}
				} else {
					console.error(`Error while reading expectedOutput file: ${err}`);
					throw new Error(`Error while reading expectedOutput file: ${err}`);
				}
			} else {
				expectedOutputFileContents = data.toString();
				let testStatus = true;
				if (expectedOutputFileContents !== stdout)
					testStatus = false;

				response = {
					testStatus,
					expectedOutput: expectedOutputFileContents.toString(),
					observedOutput: stdout.toString()
				}
			}
			console.log(JSON.stringify(response));
		});
	} else {
		throw new Error(`stderr during execution of submission.js: ${stderr}`)
	}
} catch (err) {
	throw new Error(err);
}

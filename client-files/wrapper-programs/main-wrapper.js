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
const { spawn } = require("child_process");

const ErrorWithStatus = require("../../utils/ErrorWithStatus.js");

const socketId = process.env.socketId.trim();

let submissionFileContents = "";
let sampleInputFileContents = "";
let expectedOutputFileContents = "";

// main-wrapper.js is in the location: home/main-wrapper.js inside the container
// submission.js is in the location: home/submission.js inside the container
const submissionFilePath = path.resolve(
	`${socketId}.js`
);

const sampleInputFilePath = path.resolve(
	__dirname,
	"..",
	"tests",
	"sampleInputs",
	`${socketId}-sampleInput-0.txt`
);

const expectedOutputFilePath = path.resolve(
	__dirname,
	"..",
	"tests",
	"expectedOutputs",
	`${socketId}-expectedOutput-0.txt`
);

const nodeProcess = spawn("node", [submissionFilePath]);

nodeProcess.stdout.on("data", stdout => {
	fs.readFile(expectedOutputFilePath, (err, data) => {
		if (err) {
			console.error(`Error while reading expectedOutput file:${socketId}.js: ${err}`);
			throw new ErrorWithStatus(500, "Error while reading submitted expected output");
		}
		expectedOutputFileContents = data;
		let testStatus = true;
		if (expectedOutputFileContents !== stdout) {
			console.error(`Expected output doesn't match observed output for socketId: ${socketId}`);
			testStatus = false;
		}
		return {
			testStatus,
			expectedOutput: expectedOutputFileContents.toString(),
			observedOutput: stdout.toString()
		};
	});
});

fs.readFile(sampleInputFilePath, (err, data) => {
	if (err) {
		console.error(`Error while reading sampleInput file:${socketId}.js: ${err}`);
		throw new ErrorWithStatus(500, "Error while reading submitted sample input");
	}
	sampleInputFileContents = data.toString();
	sampleInputFileContents = sampleInputFileContents.split("\n");
	sampleInputFileContents = JSON.stringify(sampleInputFileContents);
	
	nodeProcess.stdin.write(sampleInputFileContents, err => {
		if (err) {
			console.error(`Error while passing sample input to submission file:${socketId}.js: ${err}`);
			throw new ErrorWithStatus(500, "Error while passing sample input to the submitted program");
		}
	});
	nodeProcess.stdin.end();
});

fs.readFile(submissionFilePath, (err, data) => {
	if (err) {
		console.error(`Error while reading submission file:${socketId}.js: ${err}`);
		throw new ErrorWithStatus(500, "Error while reading submitted program");
	}
	submissionFileContents = data;
});

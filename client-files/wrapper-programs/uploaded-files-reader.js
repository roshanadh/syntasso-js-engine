const fs = require("fs");
const path = require("path");

let socketId = "";

// path to sampleInputs directory
let sampleInputsPath = "";

// path to expectedOutputs directory
let expectedOutputsPath = "";

let sampleInputs,
	expectedOutputs;

const readFiles = () => {
	const len_sampleInputs = sampleInputs.length;
	const len_expectedOutputs = expectedOutputs.length;

	let sampleInputsContents = {};
	let expectedOutputsContents = {};

	let sampleInputFilePath,
		expectedOutputFilePath;

	if (len_sampleInputs !== len_expectedOutputs)
		throw new Error("Number of sampleInput and expectedOutput files");

	for (let i = 0; i < len_sampleInputs; i++) {
		sampleInputFilePath = path.resolve(
			sampleInputsPath,
			sampleInputs[i]
		);
		expectedOutputFilePath = path.resolve(
			expectedOutputsPath,
			expectedOutputs[i]
		);
		try {
			sampleInputsContents[sampleInputs[i]] = fs.readFileSync(sampleInputFilePath);
			try {
				expectedOutputsContents[expectedOutputs[i]] = fs.readFileSync(expectedOutputFilePath);
			} catch (err) {
				throw new Error(`Error while reading expectedOutput file #${i}: ${err}`);
			}
		} catch (err) {
			throw new Error(`Error while reading sampleInput file #${i}: ${err}`);
		}
	}

	return {
		sampleInputs: {
			length: len_sampleInputs,
			files: sampleInputs,
			fileContents: sampleInputsContents
		},
		expectedOutputs: {
			length: len_expectedOutputs,
			files: expectedOutputs,
			fileContents: expectedOutputsContents
		}
	}
}

const readDirs = async () => {
	try {
		sampleInputs = fs.readdirSync(sampleInputsPath);
		expectedOutputs = fs.readdirSync(expectedOutputsPath);
		if (sampleInputs.length === 0 || expectedOutputs.length === 0)
			throw new Error("No test files have been uploaded")
		return await readFiles();
	} catch (err) {
		if (err.message === "Number of sampleInput and expectedOutput files")
			throw err;
		if (err.message === "No test files have been uploaded")
			throw err;
		if (err.message.includes("ENOENT"))
			throw new Error("No test files have been uploaded")
		throw new Error(`Error during reading sampleInputs and expectedOutputs directories: ${err}`);
	}
}

module.exports.read = async identifier => {
	return new Promise(async (resolve, reject) => {
		try {
			socketId = identifier;
			sampleInputsPath = path.resolve(
				__dirname,
				socketId,
				"sampleInputs",
			);

			expectedOutputsPath = path.resolve(
				__dirname,
				socketId,
				"expectedOutputs",
			);
			
			let res = await readDirs();
			resolve(res);
		} catch (err) {
			reject(err);
		}
	});
}

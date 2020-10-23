const fs = require("fs");
const path = require("path");

let socketId = "";

// path to sampleInputs directory
let sampleInputsPath = "";

// path to expectedOutputs directory
let expectedOutputsPath = "";

let sampleInputs, expectedOutputs;

const readFiles = () => {
	const len_sampleInputs = sampleInputs.length;
	const len_expectedOutputs = expectedOutputs.length;

	let sampleInputsContents = [];
	let expectedOutputsContents = [];

	let sampleInputFilePath, expectedOutputFilePath;

	if (len_sampleInputs !== len_expectedOutputs)
		throw new Error(
			"Number of sampleInput and expectedOutput files mismatch"
		);

	for (let i = 0; i < len_sampleInputs; i++) {
		sampleInputFilePath = path.resolve(sampleInputsPath, sampleInputs[i]);
		expectedOutputFilePath = path.resolve(
			expectedOutputsPath,
			expectedOutputs[i]
		);
		try {
			sampleInputsContents[sampleInputs[i]] = fs.readFileSync(
				sampleInputFilePath
			);
			try {
				expectedOutputsContents[expectedOutputs[i]] = fs.readFileSync(
					expectedOutputFilePath
				);
			} catch (err) {
				throw new Error(
					`Error while reading expectedOutput file #${i}: ${err}`
				);
			}
		} catch (err) {
			throw new Error(
				`Error while reading sampleInput file #${i}: ${err}`
			);
		}
	}

	return {
		sampleInputsData: {
			length: len_sampleInputs,
			files: sampleInputs,
			fileContents: sampleInputsContents,
		},
		expectedOutputsData: {
			length: len_expectedOutputs,
			files: expectedOutputs,
			fileContents: expectedOutputsContents,
		},
	};
};

const readDirs = async () => {
	try {
		sampleInputs = fs.readdirSync(sampleInputsPath);
		expectedOutputs = fs.readdirSync(expectedOutputsPath);
		if (sampleInputs.length === 0 || expectedOutputs.length === 0)
			throw new Error("No test files have been generated");
		return await readFiles();
	} catch (err) {
		if (
			err.message ===
			"Number of sampleInput and expectedOutput files mismatch"
		)
			throw err;
		if (err.message === "No test files have been generated") throw err;
		if (err.message.includes("ENOENT"))
			throw new Error("No test files have been generated");
		throw new Error(
			`Error during reading sampleInputs and expectedOutputs directories: ${err}`
		);
	}
};

module.exports = async identifier => {
	return new Promise(async (resolve, reject) => {
		try {
			socketId = identifier;
			sampleInputsPath = path.resolve(__dirname, "sampleInputs");

			expectedOutputsPath = path.resolve(__dirname, "expectedOutputs");

			let res = await readDirs();
			resolve(res);
		} catch (err) {
			reject(err);
		}
	});
};

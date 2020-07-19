const initDirectories = require("./initDirectories.js");
const generateTestFiles = require("./generateTestFiles.js");
const updateCodeInFile = require("./updateCodeInFile.js");
const addDividerToken = require("./addDividerToken.js");
const readOutput = require("./readOutput.js");
const cleanUpTempFiles = require("./cleanUpTempFiles.js");
const removeTestCases = require("./removeTestCases.js");

module.exports = {
	initDirectories,
	generateTestFiles,
	updateCodeInFile,
	addDividerToken,
	readOutput,
	cleanUpTempFiles,
	removeTestCases,
}

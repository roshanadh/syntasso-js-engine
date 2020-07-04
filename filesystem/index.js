const initDirectories = require("./initDirectories.js");
const generateTestFiles = require("./generateTestFiles.js");
const updateCodeInFile = require("./updateCodeInFile.js");
const addDividerToken = require("./addDividerToken.js");
const readOutput = require("./readOutput.js");
const removeTempFiles = require("./removeTempFiles.js");

module.exports = {
	initDirectories,
	generateTestFiles,
	updateCodeInFile,
	addDividerToken,
	readOutput,
	removeTempFiles,
}

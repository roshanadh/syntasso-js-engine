const {
	handleContainerTasks,
	handle403Response,
} = require("../handlers/index.js");
const {
	createTestFilesPath,
	createSubmissionFilePath,
	generateTestFiles,
	generateSubmissionFile,
} = require("../filesystem/index.js");

module.exports = async (req, res, next) => {
	try {
		await createSubmissionFilePath(req.body.socketId);
		await generateSubmissionFile(req);
		await createTestFilesPath(req.body.socketId);
		await generateTestFiles(req);
		await handleContainerTasks(req, res, next);
	} catch (error) {
		/*
		 * error.errorInGenerateTestFiles exists if some error occurred mid-generation of ...
		 * ... test files
		 */
		if (error.errorInGenerateTestFiles) {
			return handle403Response(
				res,
				"Re-request with both sampleInput and expectedOutput in each dictionary of testCases array"
			);
		}
		error.status = 503;
		next(error);
	}
};

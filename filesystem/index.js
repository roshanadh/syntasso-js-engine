const fs = require("fs");
const path = require("path");

const { SECRET_DIVIDER_TOKEN } = require("../config.js");

module.exports.updateCodeInFile = async (socketId, code) => {
	let filePath = path.resolve(
		__dirname,
		"..",
		"client-files",
		socketId,
		"submission.js"
	);
	// wrap user-submitted code inside a try-catch block
	let finalCode =
	`
		"use strict";
		try {
			${code}
		} catch (err) {
			console.log('${SECRET_DIVIDER_TOKEN}');
			console.log(JSON.stringify({ errorName: err.name, errorMessage: err.message, errorStack: err.stack }));
		}
	`;
	try {
		/*
		 * /client-files/${socketId} directory may not have been created if ...
		 * ... no sampleInputs and expectedOutputs files have been uploaded ...
		 * since they're created (fs.mkdir) inside the 'destination' function ...
		 * ... of multer.diskStorage.
		 * So, create the required directories if they do not exist yet.
		*/
		let basePath = path.resolve(__dirname, "..", "client-files", socketId);
		if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);
		fs.writeFileSync(filePath, finalCode);
		console.log(`Submitted code written to file: ${filePath}`);
	} catch (err) {
		return console.error(`Error during writing code to file: ${err.stack}`);
	}
};

module.exports.addDividerToken = async (socketId) => {
	let filePath = path.resolve(
		__dirname,
		"..",
		"client-files",
		socketId,
		"submission.js"
	);

	let fileContent = fs.readFileSync(filePath);

	// wrap user-submitted code inside a try-catch block
	let finalCode = `"use strict";\ntry {\n${fileContent}\n} catch (err) {
		console.log('${SECRET_DIVIDER_TOKEN}');
		console.log(JSON.stringify({ errorName: err.name, errorMessage: err.message, errorStack: err.stack }));
	}`;
	try {
		fs.writeFileSync(filePath, finalCode);
		console.log(`Divider token added to file: ${filePath}`);
	} catch (err) {
		return console.error(`Error during adding divider token to file: ${err}`);
	}
}

module.exports.readOutput = async (socketId) => {
	let filePath = path.resolve(
		__dirname,
		"..",
		"client-files",
		"outputs",
		socketId + ".txt"	
	);
	try {
	/*
	 *  Reads output of the user-submitted code.
	 *  Also reads any errors present in the form of the object:
	 *  { errorName: '', errorMessage: '', errorStack: '' }
	 *
	 *  The output is written in output.txt along with the error object.
	 *  To parse the error object safely from the output file, we substring ...
	 *  ... the content of the file output.txt.
	 *  To find the point of substring (i.e. the position of error object) ...
	 *  ... we place a SECRET_DIVIDER_TOKEN in the output.txt file just before the ...
	 *  ... error object and just after the output of the user-submitted code
	 *
	 *  We then search for the SECRET_DIVIDER_TOKEN in the fileContent string to get ...
	 *  ... point of substring.
	 *
	 */
	const fileContent = await fs.readFileSync(filePath).toString("utf-8");
	const startIndex = await fileContent.search(SECRET_DIVIDER_TOKEN);
	let error, output;
	if (startIndex === -1) {
		output = fileContent;
		error = null;
	} else {
	  	// length of SECRET_DIVIDER_TOKEN is 10
		error = fileContent.substring(startIndex + 10).trim();
		output = fileContent.substring(0, startIndex);

		error = JSON.parse(error);
		// parse error line number and column number from errorStack
		let stack = error.errorStack;
		let index = stack.search('/home/submission.js:');

		let str = stack.substring(index + '/home/submission.js:'.length);
		let lineNumber = str.split(':')[0];
		let columnNumber = str.split(':')[1].split(')')[0];

	  // delete errorStack property from error object to reorder its occurrence ...
	  // ... below lineNumber and columnNumber
		delete error.errorStack;
		error = {
			...error,
			lineNumber,
			columnNumber,
			errorStack: stack,
		}
	}
	return { output, error }
	} catch (err) {
		return console.error(`Error during reading output from file: ${err}`);
	}
}

module.exports.removeTempFiles = (socketId) => {
	let filePath = path.resolve(
		__dirname,
		"..",
		"client-files",
	);
	let jsFilePath = path.resolve(filePath, "submissions", `${socketId}.js`),
		outputFilePath = path.resolve(filePath, "outputs", `${socketId}.txt`);

	let sampleInputsPath = path.resolve(filePath, "tests", "sampleInputs"),
		expectedOutputsPath = path.resolve(filePath, "tests", "expectedOutputs");

	const NODE_ENV = process.env.NODE_ENV;
	if (NODE_ENV === "test") {
		// use synchronous function fs.unlinkSync() for testing
		try {
			fs.unlinkSync(jsFilePath);
			console.log(`Temporary JavaScript file for socket ${socketId} removed because of disconnection.`);
		} catch (err) {
			err.message.includes("ENOENT")
				? console.log("No temporary JavaScript file was found.")
				: console.error(`Error while removing JavaScript file '${socketId}.js': ${err}`);
		}
		try {
			fs.unlinkSync(outputFilePath);
			console.log(`Temporary output file for socket ${socketId} removed because of disconnection.`);
		} catch (err) {
			err.message.includes("ENOENT")
				? console.log("No temporary output file was found.")
				: console.error(`Error while removing output file '${socketId}.js': ${err}`);
		}
		// remove sampleInputs
		try {
			const sampleInputFiles = fs.readdirSync(sampleInputsPath);
			sampleInputFiles.forEach(sampleInputFile => {
				let fileNames = sampleInputFile.split(".");
				// remove .txt files
				if (fileNames[fileNames.length - 1] === "txt") {
					fs.unlinkSync(path.resolve(sampleInputsPath, sampleInputFile));
					console.log(`Temporary sample input file(s) for socket ${socketId} removed because of disconnection.`);
				}	
			});
			if (sampleInputFiles.length === 0)
				console.log("No temporary sample input file was found.");
		
		} catch (err) {
			console.error(`Error while removing sample input file '${socketId}.js': ${err}`);
		}
		// remove expectedOutputs
		try {
			const expectedOutputFiles = fs.readdirSync(expectedOutputsPath);
			expectedOutputFiles.forEach(expectedOutputFile => {
				let fileNames = expectedOutputFile.split(".");
				// remove .txt files
				if (fileNames[fileNames.length - 1] === "txt") {
					fs.unlinkSync(path.resolve(expectedOutputsPath, expectedOutputFile));
					console.log(`Temporary expected output file(s) for socket ${socketId} removed because of disconnection.`);
				}
			});
			if (expectedOutputFiles.length === 0)
				console.log("No temporary expected output file was found.");
		} catch (err) {
			console.error(`Error while removing expected output file '${socketId}.js': ${err}`);
		}
	} else {
		// use asynchronous function fs.unlink() for dev and prod NODE_ENV
		fs.unlink(jsFilePath, err => {
			if (err) {
				return err.message.includes("ENOENT")
					? console.log("No temporary JavaScript file was found.")
					: console.error(`Error while removing JavaScript file '${socketId}.js': ${err}`);
			}
			return console.log(`Temporary JavaScript file for socket ${socketId} removed because of disconnection.`);
		});
		fs.unlink(outputFilePath, err => {
			if (err) {
				return err.message.includes("ENOENT")
					? console.log("No temporary output file was found.")
					: console.error(`Error while removing output file '${socketId}.js': ${err}`);
			};
			return console.log(`Temporary output file for socket ${socketId} removed because of disconnection.`);
		});
		fs.unlink(outputFilePath, err => {
			if (err) {
				return err.message.includes("ENOENT")
					? console.log("No temporary output file was found.")
					: console.error(`Error while removing output file '${socketId}.js': ${err}`);
			};
			return console.log(`Temporary output file for socket ${socketId} removed because of disconnection.`);
		});
		// remove sampleInputs
		fs.readdir(sampleInputsPath, (err, files) => {
			if (err)
				return console.error(`Error while reading sample input file for socket ID: ${socketId}: ${err}`);
			files.forEach(sampleInputFile => {
				let fileNames = sampleInputFile.split(".");
				let extension = fileNames[fileNames.length - 1];

				let tokens = sampleInputFile.split("-");
				let parsedSocketId = `${tokens[0]}-${tokens[1]}`;
				// remove .txt files
				if (parsedSocketId === socketId && fileNames[fileNames.length - 1] === "txt") {
					fs.unlink(path.resolve(sampleInputsPath, sampleInputFile), err => {
						if (err)
							return console.error(`Error while removing sample input file for socket ID: ${socketId}: ${err}`);
						return console.log(`Temporary sample input file(s) for socket ${socketId} removed because of disconnection.`);
					});
					
				}	
			});

			if (files.length === 0)
				console.log("No temporary sample input file was found.");
		});
		// remove expectedOutputs
		fs.readdir(expectedOutputsPath, (err, files) => {
			if (err)
				console.error(`Error while reading expected output file for socket ID: ${socketId}: ${err}`);
			files.forEach(expectedOutputFile => {
				let fileNames = expectedOutputFile.split(".");
				let extension = fileNames[fileNames.length - 1];

				let tokens = expectedOutputFile.split("-");
				let parsedSocketId = `${tokens[0]}-${tokens[1]}`;
				// remove .txt files
				if (parsedSocketId === socketId && fileNames[fileNames.length - 1] === "txt") {
					fs.unlink(path.resolve(expectedOutputsPath, expectedOutputFile), err => {
						if (err)
							console.error(`Error while removing expected output file for socket ID: ${socketId}: ${err}`);
						return console.log(`Temporary expected output file(s) for socket ${socketId} removed because of disconnection.`);
					});
				}
			});
			
			if (files.length === 0)
				console.log("No temporary expected output file was found.");
		});
	}	
}

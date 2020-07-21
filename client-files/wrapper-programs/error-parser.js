module.exports.parseError = (stderr, stdout,socketId) => {
	let errorString = stderr;
	try {
		let outputPart,
			errorPart,
			errorStack,
			errorName,
			errorMessage,
			lineNumber,
			columnNumber = null
		;

		const errors = ["ReferenceError", "SyntaxError", "RangeError"];
		const filePath = `/home/client-files/${socketId}/submission.js:`;

		// errorPart is any thing other than the output part and path of the ... 
		// ... file that are logged to console
		errorPart = errorString.substring(errorString.indexOf(filePath) + filePath.length);

		// check if it's a ReferenceError or SyntaxError
		errors.forEach(error => {
			if (errorPart.includes(error)) errorName = error;
		});

		// if the error part doesn't include any of ReferenceError or ...
		// ... SyntaxError, throw an error
		if (!errorName) throw new Error(`Error name received during code execution (stderr: ${stderr}) did not match any of ${errors}`);

		// in case of a SyntaxError, there's no output part ...
		// ... as it is similar to a Compile Time Error, i.e, ...
		// ... a SyntaxError is thrown by Node.js before any execution ...
		// ... starts
		if (errorName === "SyntaxError") outputPart = "";
		else outputPart = stdout;

		lineNumber = parseInt(errorPart.split("\n")[0]);
		errorStack = errorPart.substring(errorPart.indexOf(errorName));
		errorMessage = errorStack
			.split(`${errorName}: `)[1]
			.split("\n")[0]
		;

		// a SyntaxError instance doesn't log any column number, so eval column ...
		// ... number only if it's not a SyntaxError
		if (errorName !== "SyntaxError")
			columnNumber =
				parseInt(errorStack
					.substring(errorStack.indexOf(`${filePath}${lineNumber}:`) + `${filePath}${lineNumber}:`.length)
					.split(")")[0])
		;

		const errorBody = JSON.stringify({
			errorName,
			errorMessage,
			lineNumber,
			columnNumber,
			errorStack
		});

		return {
			outputPart,
			errorBody
		}
	} catch (err) {
		throw new Error(`Error during execution of submission.js: ${err}`);
	}
}

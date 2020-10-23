module.exports.parseError = (stderr, socketId) => {
	let errorString = stderr;
	try {
		let errorPart,
			errorStack,
			errorName,
			errorMessage,
			lineNumber = null,
			columnNumber = null;
		const errors = [
			"ReferenceError",
			"SyntaxError",
			"RangeError",
			"TypeError",
			"AssertionError",
			// when an instance of Error is thrown
			"Error",
		];
		const filePath = `/usr/src/sandbox/${socketId}.js:`;

		// errorPart is any thing other than the output part and path of the ...
		// ... file that are logged to console
		errorPart = errorString.substring(
			errorString.indexOf(filePath) + filePath.length
		);

		// check if it's a ReferenceError or SyntaxError
		errors.forEach(error => {
			if (errorPart.includes(`\n${error}:`)) errorName = error;
		});
		try {
			lineNumber = parseInt(errorPart.split("\n")[0]);
		} catch (error) {
			lineNumber = null;
		}

		// return the full error stack if an error name cannot be resolved ...
		// ...this may be the case when some exception is thrown
		if (!errorName)
			return {
				errorBody: {
					lineNumber,
					fullError: stderr,
				},
			};

		// look for string "ErrorName: " to begin substring, ...
		// ... example: "RangeError: "
		errorStack = errorPart.substring(errorPart.indexOf(`${errorName}: `));
		errorMessage = errorStack.split(`${errorName}: `)[1].split("\n")[0];

		// a SyntaxError instance doesn't log any column number, so eval column ...
		// ... number only if it's not a SyntaxError
		if (errorName !== "SyntaxError")
			columnNumber = parseInt(
				errorStack
					.substring(
						errorStack.indexOf(`${filePath}${lineNumber}:`) +
							`${filePath}${lineNumber}:`.length
					)
					.split(")")[0]
			);

		return {
			errorBody: {
				errorName,
				errorMessage,
				lineNumber,
				columnNumber,
				errorStack,
				fullError: stderr,
			},
		};
	} catch (err) {
		// throw new Error(err);
		return {
			errorInParser: err,
		};
	}
};

// module.exports.parseError = (stderr, socketId) => {

// }

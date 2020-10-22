module.exports = time => {
	/*
	 * Performance times (imageBuildTime, containerCreateTime, and containerStartTime) ...
	 * ... are in the form '0m0.000s'
	 * We need to return these times in the form of milliseconds
	 */
	try {
		let minutes = parseInt(time.split("m")[0]);
		// remove trailing 's'
		let seconds = parseFloat(time.split("m")[1].replace("s", ""));
		// return the time in terms of milliseconds
		return (minutes * 60 + seconds) * 1000;
	} catch (err) {
		throw new Error(err);
	}
};

module.exports = (error, req, res, next) => {
	// this is the error-handling middleware
	console.error("Error caught by the error-handling middleware:", error);
	return res.status(error.status || 503).json({
		error: "Service unavailable due to server conditions",
	});
};

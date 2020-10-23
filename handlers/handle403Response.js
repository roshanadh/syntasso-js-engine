module.exports = (res, message) => {
	return res.status(403).json({
		error: message,
	});
};

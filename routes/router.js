const express = require('express');
const router = express.Router();

const executionController = require('../controllers/executionController.js');
const uploadController = require('../controllers/uploadController.js');
const submitController = require('../controllers/submitController.js');

router.get('/', (req, res) => {
	console.log("GET request received at /");
	res.send("Hello World!");
});

// POST with code snippet and optional ...
// ... sample input and expected output files
router.post('/execute', executionController);
// POST with .js file and optional ...
// ... sample input and expected output files
router.post('/upload', uploadController);
// POST with code snippet and sample input and ...
// ... expected output data (no file upload)
router.post('/submit', submitController);

module.exports = router;

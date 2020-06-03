const express = require('express');
const router = express.Router();

const executionController = require('../controllers/executionController.js');
const uploadController = require('../controllers/uploadController.js');

router.get('/', (req, res) => {
    console.log("GET request received at /");
    res.send("Hello World!");
});

router.post('/execute', executionController);
router.post('/upload', uploadController);

module.exports = router;

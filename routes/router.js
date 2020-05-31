const express = require('express');
const router = express.Router();

const socketController = require('../controllers/socketController.js');
const executionController = require('../controllers/executionController.js');

router.get('/', (req, res) => {
    console.log("GET request received at /");
    res.send("Hello World!");
});

router.post('/execute', socketController, executionController);

module.exports = router;

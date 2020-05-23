const express = require('express');
const router = express.Router();

const executionController = require('../controllers/executionController.js')

router.get('/', (req, res) => {
    console.log("GET request received at /");
    res.send("Hello World!");
});

router.post('/execute', executionController);

module.exports = router;

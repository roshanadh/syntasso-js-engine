const fs = require('fs');

module.exports.updateCodeInFile = (code) => {
    let filePath = __dirname + '/submission.js';
    // wrap user-submitted code inside a try-catch block
    let finalCode =
    `"use strict";
    try {
        ${code}
    } catch (err) {
        console.dir({
            errorName: err.name,
            errorMessage: err.message,
            errorStack: err.stack,
        });
    }`;
    try {
        fs.writeFileSync(filePath, finalCode);
        console.log(`Submitted code written to file: ${finalCode} > ${filePath}`);
    } catch (err) {
        return console.error(`Error during writing code to file: ${err}`);
    }
}

module.exports.readOutput = () => {
    let filePath = __dirname + '/output.txt';
    try {
        return fs.readFileSync(filePath);
    } catch (err) {
        return console.error(`Error during reading output from file: ${err}`);
    }
}

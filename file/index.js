const fs = require('fs');

module.exports.updateCodeInFile = (code) => {
    let filePath = __dirname + '/submission.js';
    try {
        fs.writeFileSync(filePath, code);
        console.log(`Submitted code written to file: ${code} > ${filePath}`);
    } catch (err) {
        return console.error(`Error during writing code to file: ${err}`);
    }
}

module.exports.readOutput = () => {
    let filePath = __dirname + '/.output';
    try {
        return fs.readFileSync(filePath);
    } catch (err) {
        return console.error(`Error during reading output from file: ${err}`);
    }
}
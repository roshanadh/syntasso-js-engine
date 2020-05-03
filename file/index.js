const fs = require('fs');

module.exports.updateCodeInFile = (code) => {
    let filePath = __dirname + '/submission.js';
    console.log(filePath);
    try {
        fs.writeFileSync(filePath, code);
        console.log(`Submitted code written to file: ${code} > ${filePath}`);
    } catch (err) {
        return console.error(`Error during writing code to file: ${err}`);
    }
}
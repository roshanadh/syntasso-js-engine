const fs = require("fs");
const path = require("path");

const { SECRET_DIVIDER_TOKEN } = require("../config.js");

module.exports.updateCodeInFile = async (socketId, code) => {
  let filePath = path.resolve(
    __dirname,
    "..",
    "client-files",
    "submissions",
    socketId + ".js"
  );
  // wrap user-submitted code inside a try-catch block
  let finalCode = `"use strict";\ntry {\n${code}\n} catch (err) {
        console.log('${SECRET_DIVIDER_TOKEN}');
        console.log(JSON.stringify({ errorName: err.name, errorMessage: err.message, errorStack: err.stack }));
    }`;
  console.log("heher");
  try {
    await fs.writeFileSync(filePath, finalCode);
    console.log(`Submitted code written to file: ${filePath}`);
  } catch (err) {
    return console.error(`Error during writing code to file: ${err}`);
  }
};

module.exports.readOutput = async (socketId) => {
  let filePath = path.resolve(
    __dirname,
    "..",
    "client-files",
    "outputs",
    socketId + ".txt"
  );
  try {
    /*
     *  Reads output of the user-submitted code.
     *  Also reads any errors present in the form of the object:
     *  { errorName: '', errorMessage: '', errorStack: '' }
     *
     *  The output is written in output.txt along with the error object.
     *  To parse the error object safely from the output file, we substring ...
     *  ... the content of the file output.txt.
     *  To find the point of substring (i.e. the position of error object) ...
     *  ... we place a SECRET_DIVIDER_TOKEN in the output.txt file just before the ...
     *  ... error object and just after the output of the user-submitted code
     *
     *  We then search for the SECRET_DIVIDER_TOKEN in the fileContent string to get ...
     *  ... point of substring.
     *
     */
    const fileContent = await fs.readFileSync(filePath).toString("utf-8");
    const startIndex = await fileContent.search(SECRET_DIVIDER_TOKEN);
    let error, output;
    if (startIndex === -1) {
      output = fileContent;
      error = null;
    } else {
      // TODO
      // length of SECRET_DIVIDER_TOKEN is 10
      //   error = fileContent.substring(startIndex).trim();
      //   output = fileContent.substring(0, startIndex);
      //   console.log({ error });
      //   console.log({ output });
      //   error = JSON.parse(error);
      //   // parse error line number and column number from errorStack
      //   let stack = error.errorStack;
      //   let index = stack.search("/home/submission.js:");
      //   let str = stack.substring(index + "/home/submission.js:".length);
      //   let lineNumber = str.split(":")[0];
      //   let columnNumber = str.split(":")[1].split(")")[0];
      //   // delete errorStack property from error object to reorder its occurrence ...
      //   // ... below lineNumber and columnNumber
      //   delete error.errorStack;
      //   error = {
      //     ...error,
      //     lineNumber,
      //     columnNumber,
      //     errorStack: stack,
      //   };
      // }
    }
    const _output = fileContent.substring(startIndex).trim();
    return { output: _output };
  } catch (err) {
    return console.error(`Error during reading output from file: ${err}`);
  }
};

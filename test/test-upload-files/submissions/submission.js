"use strict";

process.stdin.setEncoding("utf-8");
let rawInputString = "",
	jsonInputString = {},
	sampleInputId = "",
	sampleInputFileContents = [];

process.stdin.on("data", data => {
	if (data.toString().trim() !== "") rawInputString += data;
});

process.stdin.on("end", () => {
	if (rawInputString.trim() !== "") {
		jsonInputString = JSON.parse(rawInputString);
		sampleInputId = jsonInputString.sampleInputId;
		sampleInputFileContents = JSON.parse(jsonInputString.fileContents);

		// remove any empty elements from the array sampleInputFileContents
		sampleInputFileContents = sampleInputFileContents.filter(el => el.trim() !== "");
	}
	main();
});

const main = () => {
	// check if jsonInputString is empty
	if (JSON.stringify(jsonInputString) === "{}")
		process.stdout.write(Buffer.from("No sample input was passed"));
	else
		process.stdout.write(Buffer.from("Hello World!\n"));
}

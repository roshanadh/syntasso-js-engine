"use strict";

process.stdin.setEncoding("utf-8");
let rawInputString = "",
	jsonInputString = {},
	sampleInputId = "",
	currentLine = 0,
	sampleInputFileContents = [];

const { SECRET_DIVIDER_TOKEN } = process.env;

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
	try {
		main();
	} catch (err) {
		process.stdout.write(`${SECRET_DIVIDER_TOKEN}`);
		process.stdout.write(JSON.stringify({ errorName: err.name, errorMessage: err.message, errorStack: err.stack }));
	}
});

const readLine = () => sampleInputFileContents[currentLine++];

function calcSum(size, array) {
	let string = "";
	// infinite loop
	for (let i = 0; i > -1; i++) {
		string += i
	}
	return string;
}

const main = () => {
	if (rawInputString.trim() === "") {
		process.stdout.write("No Input Provided");
		return;
	}
	let size, array;
	size = readLine();
	array = readLine();
	array = array.split(" ");

	let output = calcSum(size, array);
	process.stdout.write(output.toString());
}
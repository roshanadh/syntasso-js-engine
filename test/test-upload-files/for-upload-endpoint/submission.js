"use strict";

process.stdin.setEncoding("utf-8");
let inputString = "";

process.stdin.on("data", data => {
	if (data.toString().trim() !== "") inputString += data;
});

process.stdin.on("end", () => {
	if (inputString.trim() !== "") inputString = inputString.toString();
	main();
});

const main = () => {
	console.log(
		inputString === ""
			? "Hello World!"
			: inputString
	);
}

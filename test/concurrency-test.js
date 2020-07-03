const { performance } = require("perf_hooks");
const chai = require("chai");
const chaiHttp = require("chai-http");
const io = require("socket.io-client");
const path = require('path');
const fs = require('fs');
const { Worker, isMainThread, threadId } = require("worker_threads");

chai.use(chaiHttp);

const sendRequest = () => {
	return new Promise((resolve, reject) => {
		try {
			socket = io.connect("http://127.0.0.1:8080");

			socket.on("disconnect", reason => {
				console.dir({
					message: "Socket disconnected for " + threadId,
					reason
				});
			});
			socket.on("connect", () => {
				socketCreation = performance.now();
				socketId = socket.id;
				console.dir({
					message: `Socket ${socketId} connected`
				})
				testFilesPath = path.resolve(__dirname, "test-upload-files", "for-execute-endpoint");
				uploadedFilesPath = path.resolve(__dirname, "..", "client-files", socketId);

				requestSent = performance.now();
				chai.request('http://localhost:8080')
					.post("/execute")
					.field("socketId", socketId)
					.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-0.txt"))
					.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-1.txt"))
					.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-2.txt"))
					.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-0.txt"))
					.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-1.txt"))
					.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-2.txt"))
					.field("dockerConfig", "0")
					.field("code", "console.log('Hello World!')")
					.end((err, res) => {
						console.dir({
							forThread: threadId,
							socketId,
							requestSent,
							responseReceived: performance.now(),
							timeInBetween: performance.now() - requestSent,
							responseBody: res.body
						});
						const sampleInputs = [
							"sampleInput-0.txt",
							"sampleInput-1.txt",
							"sampleInput-2.txt",
						];
						const expectedOutputs = [
							"expectedOutput-0.txt",
							"expectedOutput-1.txt",
							"expectedOutput-2.txt",
						];

						sampleInputs.forEach((sampleInput, index) => {
							let fileName = `${socketId}-sampleInput-${index}.txt`;
							if (!fs.existsSync(path.resolve(uploadedFilesPath, "sampleInputs", fileName)))
								throw new Error(`${fileName} file hasn't been uploaded!`);
						});
						expectedOutputs.forEach((expectedOutput, index) => {
							let fileName = `${socketId}-expectedOutput-${index}.txt`;
							if (!fs.existsSync(path.resolve(uploadedFilesPath, "expectedOutputs", fileName)))
								throw new Error(`${expectedOutput} file hasn't been uploaded!`);
						});
					});
			});
		} catch (err) {
			console.error("For thread: " + threadId);
			throw err;
		}
	})
}

let numOfWorkers = parseInt(process.argv[2]);
let workers = [];
if (isMainThread) {
	for (let i = 0; i < numOfWorkers; i++)
		workers[i] = new Worker("./test/concurrency-test.js");
} else {
	console.dir({
		message: "Thread " + threadId + " created",
		threadCreationTime: performance.now()
	});
	sendRequest();
}

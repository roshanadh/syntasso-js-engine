const fs = require("fs");
const path = require("path");

const { server, chai, mocha, should, expect } = require("./test-config.js");

describe("Test generation of files at /submit:", () => {
	let socket,
		socketId,
		submissionFilePath,
		sampleInputsDirPath,
		expectedOutputsDirPath;
	before(async () => {
		const { getConnection } = require("./test-config.js");
		socket = await getConnection();
		socketId = socket.id;

		submissionFilePath = path.resolve(
			__dirname,
			"..",
			"client-files",
			socketId,
			`${socketId}.js`
		);
		sampleInputsDirPath = path.resolve(
			__dirname,
			"..",
			"client-files",
			socketId,
			"sampleInputs"
		);
		expectedOutputsDirPath = path.resolve(
			__dirname,
			"..",
			"client-files",
			socketId,
			"expectedOutputs"
		);
	});
	it("should generate submission .js file", done => {
		const payload = {
			socketId,
			code: "process.stdout.write('Hello World!');",
			testCases: [{ sampleInput: 0, expectedOutput: 0 }],
		};
		chai.request(server)
			.post("/submit")
			.send(payload)
			.end((err, res) => {
				expect(err).to.be.null;
				res.body.should.be.a("object");
				res.body.processes[0].observedOutput.should.equal(
					"Hello World!"
				);
				expect(fs.existsSync(submissionFilePath)).to.be.true;
				done();
			});
	});
	it("should generate 3 sampleInput files", done => {
		const payload = {
			socketId,
			code: "process.stdout.write('Hello World!');",
			testCases: [
				{ sampleInput: 0, expectedOutput: 0 },
				{ sampleInput: 0, expectedOutput: 0 },
				{ sampleInput: 0, expectedOutput: 0 },
			],
		};
		const sampleInputFileNames = [
			`${socketId}-sampleInput-0.txt`,
			`${socketId}-sampleInput-1.txt`,
			`${socketId}-sampleInput-2.txt`,
		];
		chai.request(server)
			.post("/submit")
			.send(payload)
			.end((err, res) => {
				expect(err).to.be.null;
				res.body.should.be.a("object");
				res.body.processes[0].observedOutput.should.equal(
					"Hello World!"
				);
				expect(fs.existsSync(sampleInputsDirPath)).to.be.true;

				let dirContents = fs.readdirSync(sampleInputsDirPath);
				let exists = true;
				dirContents.forEach(fileName => {
					if (!sampleInputFileNames.includes(fileName))
						exists = false;
				});
				expect(exists).to.be.true;
				done();
			});
	});
	it("should generate 3 expectedOutput files", done => {
		const payload = {
			socketId,
			code: "process.stdout.write('Hello World!');",
			testCases: [
				{ sampleInput: 0, expectedOutput: 0 },
				{ sampleInput: 0, expectedOutput: 0 },
				{ sampleInput: 0, expectedOutput: 0 },
			],
		};
		const expectedOutputFileNames = [
			`${socketId}-expectedOutput-0.txt`,
			`${socketId}-expectedOutput-1.txt`,
			`${socketId}-expectedOutput-2.txt`,
		];
		chai.request(server)
			.post("/submit")
			.send(payload)
			.end((err, res) => {
				expect(err).to.be.null;
				res.body.should.be.a("object");
				res.body.processes[0].observedOutput.should.equal(
					"Hello World!"
				);
				expect(fs.existsSync(expectedOutputsDirPath)).to.be.true;

				let dirContents = fs.readdirSync(expectedOutputsDirPath);
				let exists = true;
				dirContents.forEach(fileName => {
					if (!expectedOutputFileNames.includes(fileName))
						exists = false;
				});
				expect(exists).to.be.true;
				done();
			});
	});
});

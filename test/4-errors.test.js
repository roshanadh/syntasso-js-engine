const {
	mocha,
	chai,
	should,
	expect,
	server,
	fs,
	path,
} = require("./test-config.js");

describe("4. Test submission programs at /submit", () => {
	let socket, socketId, uploadedFilesPath;
	before(() => {
		const { getConnection } = require("./test-config.js");
		socket = getConnection();
		socketId = socket.id;
		uploadedFilesPath = path.resolve(
			__dirname,
			"..",
			"client-files",
			socketId
		);
	});

	describe("POST with errorful code and dockerConfig = 2 at /submit", () => {
		it("should respond with ReferenceError", done => {
			let payload = {
				socketId,
				code: `console.log("Hello World!");\nwhile(i <= 10) {\nconsole.log(k);\ni++;\n}`,
				dockerConfig: "2",
				testCases: [
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("executionTime");
					res.body.processes[0].should.be.a("object");
					res.body.processes[0].should.have.property("testStatus");
					expect(res.body.processes[0].testStatus).to.be.false;
					res.body.processes[0].should.have.property("timedOut");
					expect(res.body.processes[0].timedOut).to.be.false;
					res.body.processes[0].should.have.property("sampleInput");
					expect(res.body.processes[0].sampleInput).to.equal(
						payload.testCases[0].sampleInput
					);
					res.body.processes[0].should.have.property(
						"expectedOutput"
					);
					expect(res.body.processes[0].expectedOutput).to.equal(
						payload.testCases[0].expectedOutput
					);
					res.body.processes[0].should.have.property(
						"observedOutput"
					);
					expect(res.body.processes[0].observedOutput).to.equal(
						"Hello World!\n"
					);
					res.body.processes[0].should.have.property(
						"observedOutputTooLong"
					);
					expect(res.body.processes[0].observedOutputTooLong).to.be
						.false;
					res.body.processes[0].should.have.property(
						"execTimeForProcess"
					);
					res.body.processes[0].error.should.be.a("object");
					res.body.processes[0].error.errorName.should.equal(
						"ReferenceError"
					);
					expect(res.body.processes[0].error.lineNumber).to.equal(2);
					expect(res.body.processes[0].error.columnNumber).to.equal(
						9
					);
					expect(res.body.processes[0].error.errorStack).to.not.equal(
						null
					);
					expect(res.body.executionTime).to.not.be.null;
					expect(
						fs.existsSync(
							path.resolve(uploadedFilesPath, "sampleInputs")
						)
					).to.be.true;
					expect(
						fs.existsSync(
							path.resolve(uploadedFilesPath, "expectedOutputs")
						)
					).to.be.true;
					done();
				});
		});

		it("should respond with SyntaxError", done => {
			let payload = {
				socketId,
				code: `console.log(1`,
				dockerConfig: "2",
				testCases: [
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("executionTime");
					res.body.processes[0].should.be.a("object");
					res.body.processes[0].should.have.property("testStatus");
					expect(res.body.processes[0].testStatus).to.be.false;
					res.body.processes[0].should.have.property("timedOut");
					expect(res.body.processes[0].timedOut).to.be.false;
					res.body.processes[0].should.have.property("sampleInput");
					expect(res.body.processes[0].sampleInput).to.equal(
						payload.testCases[0].sampleInput
					);
					res.body.processes[0].should.have.property(
						"expectedOutput"
					);
					expect(res.body.processes[0].expectedOutput).to.equal(
						payload.testCases[0].expectedOutput
					);
					res.body.processes[0].should.have.property(
						"observedOutput"
					);
					expect(res.body.processes[0].observedOutput).to.equal("");
					res.body.processes[0].should.have.property(
						"observedOutputTooLong"
					);
					expect(res.body.processes[0].observedOutputTooLong).to.be
						.false;
					res.body.processes[0].should.have.property(
						"execTimeForProcess"
					);
					res.body.processes[0].error.should.be.a("object");
					res.body.processes[0].error.errorName.should.equal(
						"SyntaxError"
					);
					expect(res.body.processes[0].error.lineNumber).to.equal(1);
					expect(res.body.processes[0].error.columnNumber).to.be.null;
					expect(res.body.processes[0].error.errorStack).to.not.equal(
						null
					);
					expect(
						fs.existsSync(
							path.resolve(uploadedFilesPath, "sampleInputs")
						)
					).to.be.true;
					expect(
						fs.existsSync(
							path.resolve(uploadedFilesPath, "expectedOutputs")
						)
					).to.be.true;
					done();
				});
		});

		it("should respond with RangeError", done => {
			let payload = {
				socketId,
				code: `console.log("Hello World!");\nthrow new RangeError("A range error");\n`,
				dockerConfig: "2",
				testCases: [
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("executionTime");
					res.body.processes[0].should.be.a("object");
					res.body.processes[0].should.have.property("testStatus");
					expect(res.body.processes[0].testStatus).to.be.false;
					res.body.processes[0].should.have.property("timedOut");
					expect(res.body.processes[0].timedOut).to.be.false;
					res.body.processes[0].should.have.property("sampleInput");
					expect(res.body.processes[0].sampleInput).to.equal(
						payload.testCases[0].sampleInput
					);
					res.body.processes[0].should.have.property(
						"expectedOutput"
					);
					expect(res.body.processes[0].expectedOutput).to.equal(
						payload.testCases[0].expectedOutput
					);
					res.body.processes[0].should.have.property(
						"observedOutput"
					);
					expect(res.body.processes[0].observedOutput).to.equal(
						"Hello World!\n"
					);
					res.body.processes[0].should.have.property(
						"observedOutputTooLong"
					);
					expect(res.body.processes[0].observedOutputTooLong).to.be
						.false;
					res.body.processes[0].should.have.property(
						"execTimeForProcess"
					);
					res.body.processes[0].error.should.be.a("object");
					res.body.processes[0].error.errorName.should.equal(
						"RangeError"
					);
					expect(res.body.processes[0].error.lineNumber).to.equal(2);
					expect(res.body.processes[0].error.columnNumber).to.equal(
						7
					);
					expect(res.body.processes[0].error.errorStack).to.not.equal(
						null
					);
					expect(res.body.executionTime).to.not.be.null;
					expect(
						fs.existsSync(
							path.resolve(uploadedFilesPath, "sampleInputs")
						)
					).to.be.true;
					expect(
						fs.existsSync(
							path.resolve(uploadedFilesPath, "expectedOutputs")
						)
					).to.be.true;
					done();
				});
		});

		it("should respond with TypeError", done => {
			let payload = {
				socketId,
				code: `console.log("Hello World!");\nthrow new TypeError("A type error");\n`,
				dockerConfig: "2",
				testCases: [
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("executionTime");
					res.body.processes[0].should.be.a("object");
					res.body.processes[0].should.have.property("testStatus");
					expect(res.body.processes[0].testStatus).to.be.false;
					res.body.processes[0].should.have.property("timedOut");
					expect(res.body.processes[0].timedOut).to.be.false;
					res.body.processes[0].should.have.property("sampleInput");
					expect(res.body.processes[0].sampleInput).to.equal(
						payload.testCases[0].sampleInput
					);
					res.body.processes[0].should.have.property(
						"expectedOutput"
					);
					expect(res.body.processes[0].expectedOutput).to.equal(
						payload.testCases[0].expectedOutput
					);
					res.body.processes[0].should.have.property(
						"observedOutput"
					);
					expect(res.body.processes[0].observedOutput).to.equal(
						"Hello World!\n"
					);
					res.body.processes[0].should.have.property(
						"observedOutputTooLong"
					);
					expect(res.body.processes[0].observedOutputTooLong).to.be
						.false;
					res.body.processes[0].should.have.property(
						"execTimeForProcess"
					);
					res.body.processes[0].error.should.be.a("object");
					res.body.processes[0].error.errorName.should.equal(
						"TypeError"
					);
					expect(res.body.processes[0].error.lineNumber).to.equal(2);
					expect(res.body.processes[0].error.columnNumber).to.equal(
						7
					);
					expect(res.body.processes[0].error.errorStack).to.not.equal(
						null
					);
					expect(res.body.executionTime).to.not.be.null;
					expect(
						fs.existsSync(
							path.resolve(uploadedFilesPath, "sampleInputs")
						)
					).to.be.true;
					expect(
						fs.existsSync(
							path.resolve(uploadedFilesPath, "expectedOutputs")
						)
					).to.be.true;
					done();
				});
		});

		it("should respond with Error", done => {
			let payload = {
				socketId,
				code: `console.log("Hello World!");\nthrow new Error("A custom error");\n`,
				dockerConfig: "2",
				testCases: [
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("executionTime");
					res.body.processes[0].should.be.a("object");
					res.body.processes[0].should.have.property("testStatus");
					expect(res.body.processes[0].testStatus).to.be.false;
					res.body.processes[0].should.have.property("timedOut");
					expect(res.body.processes[0].timedOut).to.be.false;
					res.body.processes[0].should.have.property("sampleInput");
					expect(res.body.processes[0].sampleInput).to.equal(
						payload.testCases[0].sampleInput
					);
					res.body.processes[0].should.have.property(
						"expectedOutput"
					);
					expect(res.body.processes[0].expectedOutput).to.equal(
						payload.testCases[0].expectedOutput
					);
					res.body.processes[0].should.have.property(
						"observedOutput"
					);
					expect(res.body.processes[0].observedOutput).to.equal(
						"Hello World!\n"
					);
					res.body.processes[0].should.have.property(
						"observedOutputTooLong"
					);
					expect(res.body.processes[0].observedOutputTooLong).to.be
						.false;
					res.body.processes[0].should.have.property(
						"execTimeForProcess"
					);
					res.body.processes[0].error.should.be.a("object");
					res.body.processes[0].error.errorName.should.equal("Error");
					expect(res.body.processes[0].error.lineNumber).to.equal(2);
					expect(res.body.processes[0].error.columnNumber).to.equal(
						7
					);
					expect(res.body.processes[0].error.errorStack).to.not.equal(
						null
					);
					expect(res.body.executionTime).to.not.be.null;
					expect(
						fs.existsSync(
							path.resolve(uploadedFilesPath, "sampleInputs")
						)
					).to.be.true;
					expect(
						fs.existsSync(
							path.resolve(uploadedFilesPath, "expectedOutputs")
						)
					).to.be.true;
					done();
				});
		});
	});

	describe("Infinite loop tests:", () => {
		it("should respond with timedOut set to true", done => {
			let payload = {
				socketId,
				code: `while(true) {}`,
				dockerConfig: "2",
				testCases: [
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.sampleInputs.should.equal(1);
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					expect(res.body.executionTime).to.not.be.null;
					expect(res.body.processes[0].testStatus).to.be.false;
					expect(res.body.processes[0].timedOut).to.be.true;
					expect(
						fs.existsSync(
							path.resolve(uploadedFilesPath, "sampleInputs")
						)
					).to.be.true;
					expect(
						fs.existsSync(
							path.resolve(uploadedFilesPath, "expectedOutputs")
						)
					).to.be.true;
					done();
				});
		});

		it("should respond with timedOut and observedOutputTooLong set to true", done => {
			let payload = {
				socketId,
				code: `let i = 0; while(true) { console.log(i++) }`,
				dockerConfig: "2",
				testCases: [
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.sampleInputs.should.equal(1);
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					expect(res.body.sampleInputs).to.equal(1);
					expect(res.body.executionTime).to.not.be.null;
					expect(res.body.processes[0].testStatus).to.be.false;
					expect(res.body.processes[0].timedOut).to.be.true;
					expect(res.body.processes[0].sampleInput).to.equal(
						payload.testCases[0].sampleInput
					);
					expect(res.body.processes[0].expectedOutput).to.equal(
						payload.testCases[0].expectedOutput
					);
					expect(res.body.processes[0].observedOutput).to.be.null;
					expect(res.body.processes[0].observedOutputTooLong).to.be
						.true;
					expect(res.body.processes[0].error).to.be.null;
					expect(
						res.body.processes[0].execTimeForProcess
					).to.not.equal(null);
					expect(
						fs.existsSync(
							path.resolve(uploadedFilesPath, "sampleInputs")
						)
					).to.be.true;
					expect(
						fs.existsSync(
							path.resolve(uploadedFilesPath, "expectedOutputs")
						)
					).to.be.true;
					done();
				});
		});
	});
});

const { mocha, chai, should, expect, server, fs, path } = require("./test-config.js");

describe("4. POST requests at /submit", () => {
	let socket, socketId, uploadedFilesPath;
	before(() => {
		const { getConnection } = require("./test-config.js");
		socket = getConnection();
		socketId = socket.id;
		uploadedFilesPath = path.resolve(__dirname, "..", "client-files", socketId);
	});

	describe("4a. POST without socketId at /submit", () => {
		it("should not POST without socketId param", done => {
			let payload = {
				code: "console.log('Hello World!')"
			}
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("error");
					res.body.error.should.equal("Bad Request: No Socket ID Provided!");
					done();
				});
		});
	});

	describe("4b. POST without code at /submit", () => {
		it("should not POST without code param", done => {
			let payload = {
				socketId
			}
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.should.have.status(400);
					res.body.should.be.a("object");
					res.body.should.have.property("error");
					res.body.error.should.equal("Bad Request: No Code Provided!");
					done();
				});
		});
	});

	describe("4c. POST without dockerConfig at /submit", () => {
		it("should not POST without dockerConfig param", done => {
			let payload = {
				socketId,
				code: "console.log('Hello World!')"
			}
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.should.have.status(400);
					res.body.should.be.a("object");
					res.body.should.have.property("error");
					res.body.error.should.equal("Bad Request: No Docker Configuration Instruction Provided!");
					done();
				});
		});
	});

	describe("4d. POST without testCases at /submit", () => {
		it("should not POST without testCases param", done => {
			let payload = {
				socketId,
				code: "console.log('Hello World!')",
				dockerConfig: "0",
			}
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.should.have.status(400);
					res.body.should.be.a("object");
					res.body.should.have.property("error");
					res.body.error.should.equal("Bad Request: No test cases provided!");
					done();
				});
		});
	});

	describe("4e. POST with incorrect socketId at /submit", () => {
		it("should not POST without correct socketId param", done => {
			let payload = {
				socketId: "abcd",
				code: "console.log('Hello World!')",
				dockerConfig: "2",
				testCases: [
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					}
				]
			}
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a("object");
					res.body.should.have.property("error");
					res.body.error.should.equal("Unauthorized Request: Socket ID Not Recognized!");
					done();
				});
		});
	});

	describe("4f. POST with socketId, code, one testCase, and dockerConfig = 0 at /submit", () => {
		it("should POST with all parameters provided, one test case, and dockerConfig = 0", done => {
			let payload = {
				socketId,
				code: "console.log('Hello World!')",
				dockerConfig: "0",
				testCases: [
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					}
				]
			}
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("imageBuildTime");
					res.body.should.have.property("containerCreateTime");
					res.body.should.have.property("containerStartTime");
					res.body.should.have.property("responseTime");
					res.body.sampleInputs.should.equal(1);
					res.body.sampleInput0.observedOutput.should.equal("Hello World!\n");
					expect(res.body.imageBuildTime).to.not.be.null;
					expect(res.body.containerCreateTime).to.not.be.null;
					expect(res.body.containerStartTime).to.not.be.null;
					expect(res.body.responseTime).to.not.be.null;
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"sampleInputs"
					))).to.be.true;
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"expectedOutputs"
					))).to.be.true;
					done();
				});
		});
	});

	describe("4g. POST with socketId, code, testCases, and dockerConfig = 1 at /submit", () => {
		it("should POST with all parameters provided, one test case, and dockerConfig = 1", done => {
			let payload = {
				socketId,
				code: "console.log('Hello World!')",
				dockerConfig: "1",
				testCases: [
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					}
				]
			}
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("containerStartTime");
					res.body.should.have.property("responseTime");
					res.body.sampleInputs.should.equal(1);
					res.body.sampleInput0.observedOutput.should.equal("Hello World!\n");
					expect(res.body.containerStartTime).to.not.be.null;
					expect(res.body.responseTime).to.not.be.null;
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"sampleInputs"
					))).to.be.true;
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"expectedOutputs"
					))).to.be.true;
					done();
				});
		});
	});

	describe("4h. POST with socketId, code, testCases, and dockerConfig = 2 at /submit", () => {
		it("should POST with all parameters provided, ten test cases, and dockerConfig = 2", done => {
			let payload = {
				socketId,
				code: "console.log('Hello World!')",
				dockerConfig: "2",
				testCases: [
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					},
				]
			}
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("responseTime");
					res.body.sampleInputs.should.equal(10);
					res.body.sampleInput0.observedOutput.should.equal("Hello World!\n");
					expect(res.body.responseTime).to.not.be.null;
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"sampleInputs"
					))).to.be.true;
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"expectedOutputs"
					))).to.be.true;
					done();
				});
		});

		it("should POST with all parameters provided, one test case, and dockerConfig = 2", done => {
			let payload = {
				socketId,
				code: "console.log('Hello World!')",
				dockerConfig: "2",
				testCases: [
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					}
				]
			}
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("responseTime");
					res.body.sampleInputs.should.equal(1);
					res.body.sampleInput0.observedOutput.should.equal("Hello World!\n");
					expect(res.body.responseTime).to.not.be.null;
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"sampleInputs"
					))).to.be.true;
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"expectedOutputs"
					))).to.be.true;
					done();
				});
		});
	});

	describe("4i. POST with errorful code and dockerConfig = 2 at /submit", () => {
		it("should respond with ReferenceError", done => {
			let payload = {
				socketId,
				code: `console.log("Hello World!");\nwhile(i <= 10) {\nconsole.log(k);\ni++;\n}`,
				dockerConfig: "2",
				testCases: [
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					}
				]
			}
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					console.dir({
						code: payload.code,
						res: res.body
					})
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("responseTime");
					res.body.sampleInput0.should.be.a("object");
					res.body.sampleInput0.should.have.property("testStatus");
					expect(res.body.sampleInput0.testStatus).to.be.false;
					res.body.sampleInput0.should.have.property("timedOut");
					expect(res.body.sampleInput0.timedOut).to.be.false;
					res.body.sampleInput0.should.have.property("sampleInput");
					expect(res.body.sampleInput0.sampleInput).to.equal(payload.testCases[0].sampleInput);
					res.body.sampleInput0.should.have.property("expectedOutput");
					expect(res.body.sampleInput0.expectedOutput).to.equal(payload.testCases[0].expectedOutput);
					res.body.sampleInput0.should.have.property("observedOutput");
					expect(res.body.sampleInput0.observedOutput).to.equal("Hello World!\n");
					res.body.sampleInput0.should.have.property("observedOutputTooLong");
					expect(res.body.sampleInput0.observedOutputTooLong).to.be.false;
					res.body.sampleInput0.should.have.property("execTimeForProcess");
					res.body.sampleInput0.error.should.be.a("object");
					res.body.sampleInput0.error.errorName.should.equal("ReferenceError");
					expect(res.body.sampleInput0.error.lineNumber).to.equal(2);
					expect(res.body.sampleInput0.error.columnNumber).to.equal(9);
					expect(res.body.sampleInput0.error.errorStack).to.not.equal(null);
					expect(res.body.responseTime).to.not.be.null;
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"sampleInputs"
					))).to.be.true;
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"expectedOutputs"
					))).to.be.true;
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
					}
				]
			}
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("responseTime");
					res.body.sampleInput0.should.be.a("object");
					res.body.sampleInput0.should.have.property("testStatus");
					expect(res.body.sampleInput0.testStatus).to.be.false;
					res.body.sampleInput0.should.have.property("timedOut");
					expect(res.body.sampleInput0.timedOut).to.be.false;
					res.body.sampleInput0.should.have.property("sampleInput");
					expect(res.body.sampleInput0.sampleInput).to.equal(payload.testCases[0].sampleInput);
					res.body.sampleInput0.should.have.property("expectedOutput");
					expect(res.body.sampleInput0.expectedOutput).to.equal(payload.testCases[0].expectedOutput);
					res.body.sampleInput0.should.have.property("observedOutput");
					expect(res.body.sampleInput0.observedOutput).to.equal("");
					res.body.sampleInput0.should.have.property("observedOutputTooLong");
					expect(res.body.sampleInput0.observedOutputTooLong).to.be.false;
					res.body.sampleInput0.should.have.property("execTimeForProcess");
					res.body.sampleInput0.error.should.be.a("object");
					res.body.sampleInput0.error.errorName.should.equal("SyntaxError");
					expect(res.body.sampleInput0.error.lineNumber).to.equal(1);
					expect(res.body.sampleInput0.error.columnNumber).to.be.null;
					expect(res.body.sampleInput0.error.errorStack).to.not.equal(null);
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"sampleInputs"
					))).to.be.true;
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"expectedOutputs"
					))).to.be.true;
					done();
				});
		});
	});

	describe("4j. POST with infinitely looping code, one test case, and dockerConfig = 2 at /submit", () => {
		it("should respond with timedOut set to true", done => {
			let payload = {
				socketId,
				code: `while(true) {}`,
				dockerConfig: "2",
				testCases: [
					{
						sampleInput: "1\n2 3 4 5",
						expectedOutput: "25",
					}
				]
			}
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.sampleInputs.should.equal(1);
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					expect(res.body.responseTime).to.not.be.null;
					expect(res.body.sampleInput0.testStatus).to.be.false;
					expect(res.body.sampleInput0.timedOut).to.be.true;
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"sampleInputs"
					))).to.be.true;
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"expectedOutputs"
					))).to.be.true;
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
					}
				]
			}
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.sampleInputs.should.equal(1);
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					expect(res.body.sampleInputs).to.equal(1);
					expect(res.body.responseTime).to.not.be.null;
					expect(res.body.sampleInput0.testStatus).to.be.false;
					expect(res.body.sampleInput0.timedOut).to.be.true;
					expect(res.body.sampleInput0.sampleInput).to.equal(payload.testCases[0].sampleInput);
					expect(res.body.sampleInput0.expectedOutput).to.equal(payload.testCases[0].expectedOutput);
					expect(res.body.sampleInput0.observedOutput).to.be.null;
					expect(res.body.sampleInput0.observedOutputTooLong).to.be.true;
					expect(res.body.sampleInput0.error).to.be.null;
					expect(res.body.sampleInput0.execTimeForProcess).to.not.equal(null);
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"sampleInputs"
					))).to.be.true;
					expect(fs.existsSync(path.resolve(
						uploadedFilesPath,
						"expectedOutputs"
					))).to.be.true;
					done();
				});
		});
	});
});

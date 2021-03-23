const {
	mocha,
	chai,
	should,
	expect,
	server,
	fs,
	path,
} = require("./test-config.js");

describe("Test response structures for POST /submit", () => {
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

	describe("POST with clean code at /submit", () => {
		it("should respond with structure for clean execution", done => {
			let payload = {
				socketId,
				code: `process.stdout.write("Hello World!");`,
				testCases: [
					{
						sampleInput: "",
						expectedOutput: "Hello World!",
					},
					{
						sampleInput: "0",
						expectedOutput: "Hello World!",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("timeOutLength");
					res.body.should.have.property("observedOutputMaxLength");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("processes");
					res.body.should.have.property("executionTime");
					expect(res.body.processes).to.be.an("array");
					expect(res.body.processes.length).to.equal(2);
					res.body.processes.forEach(process => {
						process.should.have.property("id");
						process.should.have.property("testStatus");
						process.should.have.property("timedOut");
						process.should.have.property("sampleInput");
						process.should.have.property("expectedOutput");
						process.should.have.property("observedOutput");
						process.should.have.property("error");
						process.should.have.property("observedOutputTooLong");
						process.should.have.property("executionTimeForProcess");
					});
					done();
				});
		});

		it("should respond with proper values for each property for clean execution", done => {
			let payload = {
				socketId,
				code: `process.stdout.write("Hello World!");`,
				testCases: [
					{
						sampleInput: "",
						expectedOutput: "Hello World!",
					},
					{
						sampleInput: "0",
						expectedOutput: "Hello World!",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.processes.forEach(process => {
						expect(process.id).to.be.oneOf([0, 1]);
						expect(process.testStatus).to.be.true;
						expect(process.timedOut).to.be.false;
						expect(process.sampleInput).to.be.oneOf(["", "0"]);
						expect(process.expectedOutput).to.equal("Hello World!");
						expect(process.observedOutput).to.equal(
							process.expectedOutput
						);
						expect(process.error).to.be.null;
						expect(process.observedOutputTooLong).to.be.false;
						expect(process.executionTimeForProcess).to.not.be.NaN;
					});
					expect(res.body.timeOutLength).to.equal(2000);
					expect(res.body.observedOutputMaxLength).to.equal(2000);
					expect(res.body.sampleInputs).to.equal(2);
					expect(res.body.executionTime).to.not.be.NaN;
					done();
				});
		});
	});

	describe("POST with ReferenceError code at /submit", () => {
		it("should respond with structure for ReferenceError", done => {
			let payload = {
				socketId,
				code: `process.stdout.write(i);`,
				testCases: [
					{
						sampleInput: "",
						expectedOutput: "Hello World!",
					},
					{
						sampleInput: "0",
						expectedOutput: "Hello World!",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("timeOutLength");
					res.body.should.have.property("observedOutputMaxLength");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("processes");
					res.body.should.have.property("executionTime");
					expect(res.body.processes).to.be.an("array");
					expect(res.body.processes.length).to.equal(2);
					res.body.processes.forEach(process => {
						process.should.have.property("id");
						process.should.have.property("testStatus");
						process.should.have.property("timedOut");
						process.should.have.property("sampleInput");
						process.should.have.property("expectedOutput");
						process.should.have.property("observedOutput");
						process.should.have.property("error");

						process.error.should.be.a("object");
						process.error.should.have.property("lineNumber");
						process.error.should.have.property("columnNumber");
						process.error.should.have.property("errorMessage");
						process.error.should.have.property("errorName");
						process.error.should.have.property("errorStack");
						process.error.should.have.property("fullError");

						process.should.have.property("observedOutputTooLong");
						process.should.have.property("executionTimeForProcess");
					});
					done();
				});
		});

		it("should respond with proper values for each property for ReferenceError", done => {
			let payload = {
				socketId,
				code: `process.stdout.write(i);`,
				testCases: [
					{
						sampleInput: "",
						expectedOutput: "Hello World!",
					},
					{
						sampleInput: "0",
						expectedOutput: "Hello World!",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.processes.forEach(process => {
						expect(process.id).to.be.oneOf([0, 1]);
						expect(process.testStatus).to.be.false;
						expect(process.timedOut).to.be.false;
						expect(process.sampleInput).to.be.oneOf(["", "0"]);
						expect(process.expectedOutput).to.equal("Hello World!");
						expect(process.observedOutput).to.equal("");
						expect(process.error.lineNumber).to.equal(1);
						expect(process.error.columnNumber).to.equal(22);
						expect(process.error.errorMessage).to.equal(
							"i is not defined"
						);
						expect(process.error.errorStack).to.not.be.null;
						expect(process.error.fullError).to.not.be.null;
						expect(process.error.errorName).to.equal(
							"ReferenceError"
						);
						expect(process.observedOutputTooLong).to.be.false;
						expect(process.executionTimeForProcess).to.not.be.NaN;
					});
					expect(res.body.timeOutLength).to.equal(2000);
					expect(res.body.observedOutputMaxLength).to.equal(2000);
					expect(res.body.sampleInputs).to.equal(2);
					expect(res.body.executionTime).to.not.be.NaN;
					done();
				});
		});
	});

	describe("POST with SyntaxError code at /submit", () => {
		it("should respond with structure for SyntaxError", done => {
			let payload = {
				socketId,
				code: `console.log(1`,
				testCases: [
					{
						sampleInput: "",
						expectedOutput: "Hello World!",
					},
					{
						sampleInput: "0",
						expectedOutput: "Hello World!",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("timeOutLength");
					res.body.should.have.property("observedOutputMaxLength");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("processes");
					res.body.should.have.property("executionTime");
					expect(res.body.processes).to.be.an("array");
					expect(res.body.processes.length).to.equal(2);
					res.body.processes.forEach(process => {
						process.should.have.property("id");
						process.should.have.property("testStatus");
						process.should.have.property("timedOut");
						process.should.have.property("sampleInput");
						process.should.have.property("expectedOutput");
						process.should.have.property("observedOutput");
						process.should.have.property("error");

						process.error.should.be.a("object");
						process.error.should.have.property("lineNumber");
						process.error.should.have.property("columnNumber");
						process.error.should.have.property("errorMessage");
						process.error.should.have.property("errorName");
						process.error.should.have.property("errorStack");
						process.error.should.have.property("fullError");

						process.should.have.property("observedOutputTooLong");
						process.should.have.property("executionTimeForProcess");
					});
					done();
				});
		});

		it("should respond with proper values for each property for SyntaxError", done => {
			let payload = {
				socketId,
				code: `console.log(1`,
				testCases: [
					{
						sampleInput: "",
						expectedOutput: "Hello World!",
					},
					{
						sampleInput: "0",
						expectedOutput: "Hello World!",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.processes.forEach(process => {
						expect(process.id).to.be.oneOf([0, 1]);
						expect(process.testStatus).to.be.false;
						expect(process.timedOut).to.be.false;
						expect(process.sampleInput).to.be.oneOf(["", "0"]);
						expect(process.expectedOutput).to.equal("Hello World!");
						expect(process.observedOutput).to.equal("");
						expect(process.error.lineNumber).to.equal(1);
						expect(process.error.columnNumber).to.be.null;
						expect(process.error.errorMessage).to.equal(
							"missing ) after argument list"
						);
						expect(process.error.errorStack).to.not.be.null;
						expect(process.error.fullError).to.not.be.null;
						expect(process.error.errorName).to.equal("SyntaxError");
						expect(process.observedOutputTooLong).to.be.false;
						expect(process.executionTimeForProcess).to.not.be.NaN;
					});
					expect(res.body.timeOutLength).to.equal(2000);
					expect(res.body.observedOutputMaxLength).to.equal(2000);
					expect(res.body.sampleInputs).to.equal(2);
					expect(res.body.executionTime).to.not.be.NaN;
					done();
				});
		});
	});

	describe("POST with TypeError code at /submit", () => {
		it("should respond with structure for TypeError", done => {
			let payload = {
				socketId,
				code: `process.stdout.write("Hello World!");\nthrow new TypeError("This is a TypeError");`,
				testCases: [
					{
						sampleInput: "",
						expectedOutput: "Hello World!",
					},
					{
						sampleInput: "0",
						expectedOutput: "Hello World!",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("timeOutLength");
					res.body.should.have.property("observedOutputMaxLength");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("processes");
					res.body.should.have.property("executionTime");
					expect(res.body.processes).to.be.an("array");
					expect(res.body.processes.length).to.equal(2);
					res.body.processes.forEach(process => {
						process.should.have.property("id");
						process.should.have.property("testStatus");
						process.should.have.property("timedOut");
						process.should.have.property("sampleInput");
						process.should.have.property("expectedOutput");
						process.should.have.property("observedOutput");
						process.should.have.property("error");

						process.error.should.be.a("object");
						process.error.should.have.property("lineNumber");
						process.error.should.have.property("columnNumber");
						process.error.should.have.property("errorMessage");
						process.error.should.have.property("errorName");
						process.error.should.have.property("errorStack");
						process.error.should.have.property("fullError");

						process.should.have.property("observedOutputTooLong");
						process.should.have.property("executionTimeForProcess");
					});
					done();
				});
		});

		it("should respond with proper values for each property for TypeError", done => {
			let payload = {
				socketId,
				code: `process.stdout.write("Hello World!");\nthrow new TypeError("This is a TypeError");`,
				testCases: [
					{
						sampleInput: "",
						expectedOutput: "Hello World!",
					},
					{
						sampleInput: "0",
						expectedOutput: "Hello World!",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.processes.forEach(process => {
						expect(process.id).to.be.oneOf([0, 1]);
						expect(process.testStatus).to.be.true;
						expect(process.timedOut).to.be.false;
						expect(process.sampleInput).to.be.oneOf(["", "0"]);
						expect(process.expectedOutput).to.equal("Hello World!");
						expect(process.observedOutput).to.equal(
							process.expectedOutput
						);
						expect(process.error.lineNumber).to.equal(2);
						expect(process.error.columnNumber).to.equal(7);
						expect(process.error.errorMessage).to.equal(
							"This is a TypeError"
						);
						expect(process.error.errorStack).to.not.be.null;
						expect(process.error.fullError).to.not.be.null;
						expect(process.error.errorName).to.equal("TypeError");
						expect(process.observedOutputTooLong).to.be.false;
						expect(process.executionTimeForProcess).to.not.be.NaN;
					});
					expect(res.body.timeOutLength).to.equal(2000);
					expect(res.body.observedOutputMaxLength).to.equal(2000);
					expect(res.body.sampleInputs).to.equal(2);
					expect(res.body.executionTime).to.not.be.NaN;
					done();
				});
		});
	});

	describe("POST with RangeError code at /submit", () => {
		it("should respond with structure for RangeError", done => {
			let payload = {
				socketId,
				code: `process.stdout.write("Hello World!");\nthrow new RangeError("This is a RangeError");`,
				testCases: [
					{
						sampleInput: "",
						expectedOutput: "Hello World!",
					},
					{
						sampleInput: "0",
						expectedOutput: "Hello World!",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("timeOutLength");
					res.body.should.have.property("observedOutputMaxLength");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("processes");
					res.body.should.have.property("executionTime");
					expect(res.body.processes).to.be.an("array");
					expect(res.body.processes.length).to.equal(2);
					res.body.processes.forEach(process => {
						process.should.have.property("id");
						process.should.have.property("testStatus");
						process.should.have.property("timedOut");
						process.should.have.property("sampleInput");
						process.should.have.property("expectedOutput");
						process.should.have.property("observedOutput");
						process.should.have.property("error");

						process.error.should.be.a("object");
						process.error.should.have.property("lineNumber");
						process.error.should.have.property("columnNumber");
						process.error.should.have.property("errorMessage");
						process.error.should.have.property("errorName");
						process.error.should.have.property("errorStack");
						process.error.should.have.property("fullError");

						process.should.have.property("observedOutputTooLong");
						process.should.have.property("executionTimeForProcess");
					});
					done();
				});
		});

		it("should respond with proper values for each property for RangeError", done => {
			let payload = {
				socketId,
				code: `process.stdout.write("Hello World!");\nthrow new RangeError("This is a RangeError");`,
				testCases: [
					{
						sampleInput: "",
						expectedOutput: "Hello World!",
					},
					{
						sampleInput: "0",
						expectedOutput: "Hello World!",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.processes.forEach(process => {
						expect(process.id).to.be.oneOf([0, 1]);
						expect(process.testStatus).to.be.true;
						expect(process.timedOut).to.be.false;
						expect(process.sampleInput).to.be.oneOf(["", "0"]);
						expect(process.expectedOutput).to.equal("Hello World!");
						expect(process.observedOutput).to.equal(
							process.expectedOutput
						);
						expect(process.error.lineNumber).to.equal(2);
						expect(process.error.columnNumber).to.equal(7);
						expect(process.error.errorMessage).to.equal(
							"This is a RangeError"
						);
						expect(process.error.errorStack).to.not.be.null;
						expect(process.error.fullError).to.not.be.null;
						expect(process.error.errorName).to.equal("RangeError");
						expect(process.observedOutputTooLong).to.be.false;
						expect(process.executionTimeForProcess).to.not.be.NaN;
					});
					expect(res.body.timeOutLength).to.equal(2000);
					expect(res.body.observedOutputMaxLength).to.equal(2000);
					expect(res.body.sampleInputs).to.equal(2);
					expect(res.body.executionTime).to.not.be.NaN;
					done();
				});
		});
	});

	describe("POST with custom error code at /submit", () => {
		it("should respond with structure for a custom error", done => {
			let payload = {
				socketId,
				code: `process.stdout.write("Hello World!");\nthrow new Error("This is an Error");`,
				testCases: [
					{
						sampleInput: "",
						expectedOutput: "Hello World!",
					},
					{
						sampleInput: "0",
						expectedOutput: "Hello World!",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("timeOutLength");
					res.body.should.have.property("observedOutputMaxLength");
					res.body.should.have.property("sampleInputs");
					res.body.should.have.property("processes");
					res.body.should.have.property("executionTime");
					expect(res.body.processes).to.be.an("array");
					expect(res.body.processes.length).to.equal(2);
					res.body.processes.forEach(process => {
						process.should.have.property("id");
						process.should.have.property("testStatus");
						process.should.have.property("timedOut");
						process.should.have.property("sampleInput");
						process.should.have.property("expectedOutput");
						process.should.have.property("observedOutput");
						process.should.have.property("error");

						process.error.should.be.a("object");
						process.error.should.have.property("lineNumber");
						process.error.should.have.property("columnNumber");
						process.error.should.have.property("errorMessage");
						process.error.should.have.property("errorName");
						process.error.should.have.property("errorStack");
						process.error.should.have.property("fullError");

						process.should.have.property("observedOutputTooLong");
						process.should.have.property("executionTimeForProcess");
					});
					done();
				});
		});

		it("should respond with proper values for each property for a custom error", done => {
			let payload = {
				socketId,
				code: `process.stdout.write("Hello World!");\nthrow new Error("This is an Error");`,
				testCases: [
					{
						sampleInput: "",
						expectedOutput: "Hello World!",
					},
					{
						sampleInput: "0",
						expectedOutput: "Hello World!",
					},
				],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					res.body.processes.forEach(process => {
						expect(process.id).to.be.oneOf([0, 1]);
						expect(process.testStatus).to.be.true;
						expect(process.timedOut).to.be.false;
						expect(process.sampleInput).to.be.oneOf(["", "0"]);
						expect(process.expectedOutput).to.equal("Hello World!");
						expect(process.observedOutput).to.equal(
							process.expectedOutput
						);
						expect(process.error.lineNumber).to.equal(2);
						expect(process.error.columnNumber).to.equal(7);
						expect(process.error.errorMessage).to.equal(
							"This is an Error"
						);
						expect(process.error.errorStack).to.not.be.null;
						expect(process.error.fullError).to.not.be.null;
						expect(process.error.errorName).to.equal("Error");
						expect(process.observedOutputTooLong).to.be.false;
						expect(process.executionTimeForProcess).to.not.be.NaN;
					});
					expect(res.body.timeOutLength).to.equal(2000);
					expect(res.body.observedOutputMaxLength).to.equal(2000);
					expect(res.body.sampleInputs).to.equal(2);
					expect(res.body.executionTime).to.not.be.NaN;
					done();
				});
		});
	});
});

const { mocha, chai, should, expect, server, fs, path } = require("./test-config.js");

describe("2. POST requests at /execute", () => {
	let socket, socketId, testFilesPath, uploadedFilesPath;
	before(() => {
		const { getConnection } = require("./test-config.js");
		socket = getConnection();
		socketId = socket.id;
		testFilesPath = path.resolve(__dirname, "test-upload-files", "for-execute-endpoint");
		uploadedFilesPath = path.resolve(__dirname, "..", "client-files", socketId);

	});
	
	describe("2a. POST without socketId at /execute", () => {
		it("should not POST without socketId param", done => {
			let payload = {
				code: "console.log('Hello World!')"
			}
			chai.request(server)
				.post("/execute")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("error");
					res.body.error.should.equal("Bad Request: No Socket ID Provided!");
					done();
				});
		});
	});

	describe("2b. POST without code at /execute", () => {
		it("should not POST without code param", done => {
			let payload = {
				socketId
			}
			chai.request(server)
				.post("/execute")
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

	describe("2c. POST without dockerConfig at /execute", () => {
		it("should not POST without dockerConfig param", done => {
			let payload = {
				socketId,
				code: "console.log('Hello World!')"
			}
			chai.request(server)
				.post("/execute")
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

	describe("2d. POST with incorrect socketId at /execute", () => {
		it("should not POST without correct socketId param", done => {
			let payload = {
				socketId: "abcd",
				code: "console.log('Hello World!')",
				dockerConfig: "2"
			}
			chai.request(server)
				.post("/execute")
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

	describe("2e. POST with socketId, code and dockerConfig = 0 at /execute", () => {
		it("should POST with all parameters provided and dockerConfig = 0", done => {
			let payload = {
				socketId,
				code: "console.log('Hello World!')",
				dockerConfig: "0"
			}
			chai.request(server)
				.post("/execute")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("observedOutput");
					res.body.should.have.property("error");
					res.body.should.have.property("imageBuildTime");
					res.body.should.have.property("containerCreateTime");
					res.body.should.have.property("containerStartTime");
					res.body.should.have.property("execTime");
					res.body.observedOutput.should.equal("Hello World!\n");
					expect(res.body.error).to.be.null;
					done();
				});
		});
	});

	describe("2f. POST with socketId, code and dockerConfig = 1 at /execute", () => {
		it("should POST with all parameters provided and dockerConfig = 1", done => {
			let payload = {
				socketId,
				code: "console.log('Hello World!')",
				dockerConfig: "1"
			}
			chai.request(server)
				.post("/execute")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("observedOutput");
					res.body.should.have.property("error");
					res.body.should.have.property("containerStartTime");
					res.body.should.have.property("execTime");
					res.body.observedOutput.should.equal("Hello World!\n");
					expect(res.body.error).to.be.null;
					done();
				});
		});
	});

	describe("2g. POST with socketId, code and dockerConfig = 2 at /execute", () => {
		it("should POST with all parameters provided and dockerConfig = 2", done => {
			let payload = {
				socketId,
				code: "console.log('Hello World!')",
				dockerConfig: "1"
			}
			chai.request(server)
				.post("/execute")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("observedOutput");
					res.body.should.have.property("error");
					res.body.should.have.property("execTime");
					res.body.observedOutput.should.equal("Hello World!\n");
					expect(res.body.error).to.be.null;
					done();
				});
		});
	});

	describe("2h. POST with errorful code and dockerConfig = 2 at /execute", () => {
		it("should respond with ReferenceError", done => {
			let payload = {
				socketId,
				code: `while(i <= 10) {\nconsole.log(k);\ni++;\n}`,
				dockerConfig: "2"
			}
			chai.request(server)
				.post("/execute")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("observedOutput");
					res.body.should.have.property("error");
					res.body.should.have.property("execTime");
					expect(res.body.observedOutput).to.be.empty;
					res.body.error.should.have.property("errorName");
					res.body.error.should.have.property("errorMessage");
					res.body.error.should.have.property("lineNumber");
					res.body.error.should.have.property("columnNumber");
					res.body.error.should.have.property("errorStack");
					res.body.error.errorName.should.equal("ReferenceError");
					done();
				});
		});
	});
	describe("2i. POST with sampleInputs, expectedOutputs, and dockerConfig = 2 at /execute", () => {
		it("should not POST without .txt file extension", done => {
			chai.request(server)
				.post("/execute")
				.field("socketId", socketId)
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput0.md"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput0.md"))
				.field("dockerConfig", "2")
				.field("code", "console.log('Hello World!')")
				.end((err, res) => {
					res.should.have.status(503);
					res.body.should.be.a("object");
					res.body.should.have.property("error");
					res.body.should.have.property("message");
					res.body.message.should.equal("Only .txt files can be uploaded as sampleInputs or expectedOutputs");
					done();
				});
		});

		it("should not POST with file name containing more than 1 period (.)", done => {
			chai.request(server)
				.post("/execute")
				.field("socketId", socketId)
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput0.md.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput0.md.txt"))
				.field("dockerConfig", "2")
				.field("code", "console.log('Hello World!')")
				.end((err, res) => {
					res.should.have.status(503);
					res.body.should.be.a("object");
					res.body.should.have.property("error");
					res.body.should.have.property("message");
					res.body.message.should.equal("File name cannot contain more than one period (.)");
					done();
				});
		});

		it("should upload 3 sampleInput files and 3 expectedOutput files", done => {
			chai.request(server)
				.post("/execute")
				.field("socketId", socketId)
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput0.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput1.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput2.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput0.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput1.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput2.txt"))
				.field("dockerConfig", "2")
				.field("code", "console.log('Hello World!')")
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("observedOutput");
					res.body.should.have.property("error");
					res.body.should.have.property("execTime");
					res.body.observedOutput.should.equal("Hello World!\n");
					expect(res.body.error).to.be.null;
					const sampleInputs = [
						"sampleInput0.txt",
						"sampleInput1.txt",
						"sampleInput2.txt",
					];
					const expectedOutputs = [
						"expectedOutput0.txt",
						"expectedOutput1.txt",
						"expectedOutput2.txt",
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
					done();
				});
		});

		it("should not upload 10 sampleInput files and 10 expectedOutput files", done => {
			chai.request(server)
				.post("/execute")
				.field("socketId", socketId)
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput0.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput1.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput2.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput0.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput1.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput2.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput0.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput1.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput2.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput0.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput0.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput1.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput2.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput0.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput1.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput2.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput0.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput1.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput2.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput0.txt"))
				.field("dockerConfig", "2")
				.field("code", "console.log('Hello World!')")
				.end((err, res) => {
					res.should.have.status(503);
					res.body.should.be.a("object");
					res.body.should.have.property("error");
					res.body.should.have.property("message");
					res.body.message.should.equal("Unexpected field");
					done();
				});
		});
	});
});
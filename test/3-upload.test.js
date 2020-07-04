const { mocha, chai, should, expect, server, fs, path } = require("./test-config.js");

describe("3. POST requests at /upload", () => {
	let socket, socketId, testFilesPath, uploadedFilesPath;
	before(() => {
		const { getConnection } = require("./test-config.js");
		socket = getConnection();
		socketId = socket.id;
		testFilesPath = path.resolve(__dirname, "test-upload-files", "for-execute-endpoint");
		uploadedFilesPath = path.resolve(__dirname, "..", "client-files", socketId);
	});


	describe("3a. POST without socketId at /upload", () => {
		it("should not POST without socketId param", done => {
			let payload = {}
			chai.request(server)
				.post("/upload")
				.send(payload)
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("error");
					res.body.error.should.equal("Bad Request: No Socket ID Provided!");
					done();
				});
		});
	});

	describe("3b. POST without JavaScript file at /upload", () => {
		it("should not POST without JavaScript file uploaded", done => {
			chai.request(server)
				.post("/upload")
				.field("socketId", socketId)
				.end((err, res) => {
					res.should.have.status(400);
					res.body.should.be.a("object");
					res.body.should.have.property("error");
					res.body.error.should.equal("Bad Request: No JavaScript File Provided!");
					done();
				});
		});
	});

	describe("3c. POST without dockerConfig at /upload", () => {
		it("should not POST without dockerConfig param", done => {
			chai.request(server)
				.post("/upload")
				.field("socketId", socketId)
				.attach("submission", path.resolve("test", "test-upload-files", "for-upload-endpoint", "submission.js"))
				.end((err, res) => {
					res.should.have.status(400);
					res.body.should.be.a("object");
					res.body.should.have.property("error");
					res.body.error.should.equal("Bad Request: No Docker Configuration Instruction Provided!");
					done();
				});
		});
	});

	describe("3d. POST with incorrect socketId at /upload", () => {
		it("should not POST without correct socketId param", done => {
			chai.request(server)
				.post("/upload")
				.field("socketId", "abcd")
				.attach("submission", path.resolve("test", "test-upload-files", "for-upload-endpoint", "submission.js"))
				.field("dockerConfig", "0")
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a("object");
					res.body.should.have.property("error");
					res.body.error.should.equal("Unauthorized Request: Socket ID Not Recognized!");
					done();
				});
		});
	});

	describe("3e. POST with incorrect JS file names at /upload", () => {
		it("should not POST without .js file extension", done => {
			chai.request(server)
				.post("/upload")
				.field("socketId", socketId)
				.attach("submission", path.resolve("test", "test-upload-files", "for-upload-endpoint", "submission.ts"))
				.field("dockerConfig", "0")
				.end((err, res) => {
					res.should.have.status(503);
					res.body.should.be.a("object");
					res.body.should.have.property("error");
					res.body.should.have.property("message");
					res.body.error.should.equal("An error occurred while uploading the submitted JavaScript file!");
					res.body.message.should.equal("Only .js files can be uploaded as submission");
					done();
				});
		});

		it("should not POST with file name containing more than 1 period (.)", done => {
			chai.request(server)
				.post("/upload")
				.field("socketId", socketId)
				.attach("submission", path.resolve("test", "test-upload-files", "for-upload-endpoint", "submission.a.js"))
				.field("dockerConfig", "0")
				.end((err, res) => {
					res.should.have.status(503);
					res.body.should.be.a("object");
					res.body.should.have.property("error");
					res.body.should.have.property("message");
					res.body.error.should.equal("An error occurred while uploading the submitted JavaScript file!");
					res.body.message.should.equal("File name cannot contain more than one period (.)");
					done();
				});
		});
	});

	describe("3f. POST with socketId, JS file and dockerConfig = 0 at /upload", () => {
		it("should POST with all parameters provided and dockerConfig = 0", done => {
			chai.request(server)
				.post("/upload")
				.field("socketId", socketId)
				.attach("submission", path.resolve("test", "test-upload-files", "for-upload-endpoint", "submission.js"))
				.field("dockerConfig", "0")
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("observedOutput");
					res.body.should.have.property("error");
					res.body.should.have.property("imageBuildTime");
					res.body.should.have.property("containerCreateTime");
					res.body.should.have.property("containerStartTime");
					res.body.should.have.property("responseTime");
					res.body.observedOutput.should.equal("Hello World!\n");
					expect(res.body.error).to.be.null;
					done();
				});
		});
	});

	describe("3g. POST with socketId, JS file and dockerConfig = 1 at /upload", () => {
		it("should POST with all parameters provided and dockerConfig = 1", done => {
			chai.request(server)
				.post("/upload")
				.field("socketId", socketId)
				.attach("submission", path.resolve("test", "test-upload-files", "for-upload-endpoint", "submission.js"))
				.field("dockerConfig", "1")
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("observedOutput");
					res.body.should.have.property("error");
					res.body.should.have.property("containerStartTime");
					res.body.should.have.property("responseTime");
					res.body.observedOutput.should.equal("Hello World!\n");
					expect(res.body.error).to.be.null;
					done();
				});
		});
	});

	describe("3h. POST with socketId, JS file and dockerConfig = 2 at /upload", () => {
		it("should POST with all parameters provided and dockerConfig = 2", done => {
			chai.request(server)
				.post("/upload")
				.field("socketId", socketId)
				.attach("submission", path.resolve("test", "test-upload-files", "for-upload-endpoint", "submission.js"))
				.field("dockerConfig", "2")
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("observedOutput");
					res.body.should.have.property("error");
					res.body.should.have.property("responseTime");
					res.body.observedOutput.should.equal("Hello World!\n");
					expect(res.body.error).to.be.null;
					done();
				});
		});
	});

	describe("3i. POST with socketId, errorful JS file and dockerConfig = 2 at /upload", () => {
		it("should respond with ReferenceError", done => {
			chai.request(server)
				.post("/upload")
				.field("socketId", socketId)
				.attach("submission", path.resolve("test", "test-upload-files", "for-upload-endpoint", "submission-incorrect.js"))
				.field("dockerConfig", "2")
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("observedOutput");
					res.body.should.have.property("error");
					res.body.should.have.property("responseTime");
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

	describe("3j. POST with sampleInputs, expectedOutputs, and dockerConfig = 2 at /upload", () => {
		it("should not POST without .txt file extension", done => {
			chai.request(server)
				.post("/upload")
				.field("socketId", socketId)
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput0.md"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput0.md"))
				.attach("submission", path.resolve("test", "test-upload-files", "for-upload-endpoint", "submission.js"))
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
				.post("/upload")
				.field("socketId", socketId)
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput0.md.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput0.md.txt"))
				.attach("submission", path.resolve("test", "test-upload-files", "for-upload-endpoint", "submission.js"))
				.field("dockerConfig", "2")
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
				.post("/upload")
				.field("socketId", socketId)
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-0.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-1.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-2.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-0.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-1.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-2.txt"))
				.attach("submission", path.resolve("test", "test-upload-files", "for-upload-endpoint", "submission.js"))
				.field("dockerConfig", "2")
				.end((err, res) => {
					res.body.should.be.a("object");
					res.body.should.have.property("sampleInputs");
					res.body.sampleInputs.should.equal(3);
					res.body.should.have.property("responseTime");
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
					done();
				});
		});

		it("should not upload 10 sampleInput files and 10 expectedOutput files", done => {
			chai.request(server)
				.post("/upload")
				.field("socketId", socketId)
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-0.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-1.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-2.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-0.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-1.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-2.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-0.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-1.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-2.txt"))
				.attach("sampleInputs", path.resolve(testFilesPath, "sampleInput-0.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-0.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-1.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-2.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-0.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-1.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-2.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-0.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-1.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-2.txt"))
				.attach("expectedOutputs", path.resolve(testFilesPath, "expectedOutput-0.txt"))
				.attach("submission", path.resolve("test", "test-upload-files", "for-upload-endpoint", "submission.js"))
				.field("dockerConfig", "2")
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

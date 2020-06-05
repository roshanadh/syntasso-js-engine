process.env.NODE_ENV = "test";

// test runner - mocha
const mocha = require("mocha");
// testing library - chai
const chai = require("chai");
// plugin for testing over HTTP
const chaiHttp = require("chai-http");
// client API for socket.io
const io = require("socket.io-client");

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const { server } = require("../server.js");

chai.use(chaiHttp);
const should = chai.should();
const expect = chai.expect;

describe("Tests: ", () => {
	let socketId = "";
	let log = console.log;
	// use log in place of console.log for logging during tests
	console.log = msg => {}
	
	before(done => {
		// create socket connection as client
		socket = io.connect("http://localhost:8080", {
			forceNew: true,
		});
		socket.on("connect", () => {
			log("Socket connection successful!");
			socketId = socket.id;
		});
		socket.on("disconnect", () => {
			log("Socket disconnected!");
		});
		done();
	});
	
	describe("1. GET request at /", () => {
		it("should return 'Hello World!' response", done => {
			chai.request(server)
				.get("/")
				.end((err, res) => {
					expect(err).to.be.null;
					res.should.have.status(200);
					res.text.should.be.a("string");
					res.text.should.equal("Hello World!");
					done();
				});
		});
	});
	
	describe("2. POST requests at /execute", () => {
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
						res.body.should.have.property("output");
						res.body.should.have.property("error");
						res.body.should.have.property("imageBuildTime");
						res.body.should.have.property("containerCreateTime");
						res.body.should.have.property("containerStartTime");
						res.body.should.have.property("execTime");
						res.body.output.should.equal("Hello World!\r\n");
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
						res.body.should.have.property("output");
						res.body.should.have.property("error");
						res.body.should.have.property("containerStartTime");
						res.body.should.have.property("execTime");
						res.body.output.should.equal("Hello World!\r\n");
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
						res.body.should.have.property("output");
						res.body.should.have.property("error");
						res.body.should.have.property("execTime");
						res.body.output.should.equal("Hello World!\r\n");
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
						res.body.should.have.property("output");
						res.body.should.have.property("error");
						res.body.should.have.property("execTime");
						expect(res.body.output).to.be.empty;
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
	});
	
	describe("3. POST requests at /upload", () => {
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
					.attach("submission", path.resolve("test", "test-upload-files", "submission.js"))
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
					.attach("submission", path.resolve("test", "test-upload-files", "submission.js"))
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
					.attach("submission", path.resolve("test", "test-upload-files", "submission.ts"))
					.field("dockerConfig", "0")
					.end((err, res) => {
						res.should.have.status(503);
						res.body.should.be.a("object");
						res.body.should.have.property("error");
						res.body.should.have.property("message");
						res.body.error.should.equal("An error occurred while uploading the submitted JavaScript file!");
						res.body.message.should.equal("Only .js files can be uploaded");
						done();
					});
			});
			
			it("should not POST with file name containing more than 1 period (.)", done => {
				chai.request(server)
					.post("/upload")
					.field("socketId", socketId)
					.attach("submission", path.resolve("test", "test-upload-files", "submission.a.js"))
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
					.attach("submission", path.resolve("test", "test-upload-files", "submission.js"))
					.field("dockerConfig", "0")
					.end((err, res) => {
						res.body.should.be.a("object");
						res.body.should.have.property("output");
						res.body.should.have.property("error");
						res.body.should.have.property("imageBuildTime");
						res.body.should.have.property("containerCreateTime");
						res.body.should.have.property("containerStartTime");
						res.body.should.have.property("execTime");
						res.body.output.should.equal("Hello World!\r\n");
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
					.attach("submission", path.resolve("test", "test-upload-files", "submission.js"))
					.field("dockerConfig", "1")
					.end((err, res) => {
						res.body.should.be.a("object");
						res.body.should.have.property("output");
						res.body.should.have.property("error");
						res.body.should.have.property("containerStartTime");
						res.body.should.have.property("execTime");
						res.body.output.should.equal("Hello World!\r\n");
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
					.attach("submission", path.resolve("test", "test-upload-files", "submission.js"))
					.field("dockerConfig", "2")
					.end((err, res) => {
						res.body.should.be.a("object");
						res.body.should.have.property("output");
						res.body.should.have.property("error");
						res.body.should.have.property("execTime");
						res.body.output.should.equal("Hello World!\r\n");
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
					.attach("submission", path.resolve("test", "test-upload-files", "submission-incorrect.js"))
					.field("dockerConfig", "2")
					.end((err, res) => {
						res.body.should.be.a("object");
						res.body.should.have.property("output");
						res.body.should.have.property("error");
						res.body.should.have.property("execTime");
						expect(res.body.output).to.be.empty;
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
	});

	describe("4. Clean up files after socket disconnect", () => {
		before(done => {
			if (socket.connected) {
				log("Disconnecting socket...");
				socket.disconnect();
			} else {
				log("No socket connection exists!");
			}
			done();
		});
		
		it("should remove the docker container if it was created", done => {
			let filter = `\"name=${socketId}\"`;
			const searchContainerOutput = execSync(`docker ps -aqf ${filter}`, {
				stdio: ["pipe", "pipe", "pipe"]
			});
			expect(searchContainerOutput.toString().trim()).to.be.empty;
			done();
		});
		it("should remove the JavaScript file if it was created", done => {
			const filePath = path.resolve("client-files", "submissions", `${socketId}.js`);
			expect(fs.existsSync(filePath)).to.be.false;
			done();
		});
		it("should remove the output file if it was created", done => {
			const filePath = path.resolve("client-files", "outputs", `${socketId}.txt`);
			expect(fs.existsSync(filePath)).to.be.false;
			done();
		});
	});
});
const { server, chai, mocha, should, expect } = require("./test-config.js");

describe("Test POST /submit:", () => {
	let socket, socketId;
	before(async () => {
		const { getConnection } = require("./test-config.js");
		socket = await getConnection();
		socketId = socket.id;
	});
	describe("Incorrect params tests:", () => {
		it("should not POST without socketId", done => {
			const payload = {
				code: "process.stdout.write('Hello World!')",
				dockerConfig: 0,
				testCases: [{ sampleInput: 0, expectedOutput: 0 }],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					expect(err).to.be.null;
					res.body.should.be.a("object");
					res.body.error.should.equal("No socket ID provided");
					done();
				});
		});

		it("should not POST with incorrect socketId", done => {
			const payload = {
				socketId: "abcd1234",
				code: "process.stdout.write('Hello World!')",
				dockerConfig: 0,
				testCases: [{ sampleInput: 0, expectedOutput: 0 }],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					expect(err).to.be.null;
					res.body.should.be.a("object");
					res.body.error.should.equal("Socket ID not recognized");
					done();
				});
		});

		it("should not POST without code", done => {
			const payload = {
				socketId,
				dockerConfig: 0,
				testCases: [{ sampleInput: 0, expectedOutput: 0 }],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					expect(err).to.be.null;
					res.body.should.be.a("object");
					res.body.error.should.equal("No code provided");
					done();
				});
		});

		it("should not POST without dockerConfig", done => {
			const payload = {
				socketId,
				code: "process.stdout.write('Hello World!')",
				testCases: [{ sampleInput: 0, expectedOutput: 0 }],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					expect(err).to.be.null;
					res.body.should.be.a("object");
					res.body.error.should.equal("No dockerConfig provided");
					done();
				});
		});

		it("should not POST with NaN dockerConfig", done => {
			const payload = {
				socketId,
				code: "process.stdout.write('Hello World!')",
				dockerConfig: "abcd",
				testCases: [{ sampleInput: 0, expectedOutput: 0 }],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					expect(err).to.be.null;
					res.body.should.be.a("object");
					res.body.error.should.equal(
						"dockerConfig should be a number; got NaN"
					);
					done();
				});
		});

		it("should not POST with dockerConfig not in [0, 1, 2]", done => {
			const payload = {
				socketId,
				code: "process.stdout.write('Hello World!')",
				dockerConfig: 3,
				testCases: [{ sampleInput: 0, expectedOutput: 0 }],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					expect(err).to.be.null;
					res.body.should.be.a("object");
					res.body.error.should.equal(
						"dockerConfig should be one of [0, 1, 2]"
					);
					done();
				});
		});

		it("should not POST without testCases", done => {
			const payload = {
				socketId,
				code: "process.stdout.write('Hello World!')",
				dockerConfig: 2,
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					expect(err).to.be.null;
					res.body.should.be.a("object");
					res.body.error.should.equal("No test cases provided");
					done();
				});
		});

		it("should not POST with empty test cases", done => {
			const payload = {
				socketId,
				code: "process.stdout.write('Hello World!')",
				dockerConfig: 2,
				testCases: [],
			};
			chai.request(server)
				.post("/submit")
				.send(payload)
				.end((err, res) => {
					expect(err).to.be.null;
					res.body.should.be.a("object");
					res.body.error.should.equal("No test cases provided");
					done();
				});
		});
	});

	describe("Correct params tests:", () => {
		it("should POST with code, testCases, and dockerConfig = 0", done => {
			const payload = {
				socketId,
				code: "process.stdout.write('Hello World!')",
				dockerConfig: "0",
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
					done();
				});
		});

		it("should POST with code, testCases, and dockerConfig = 1", done => {
			const payload = {
				socketId,
				code: "process.stdout.write('Hello World!')",
				dockerConfig: "1",
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
					done();
				});
		});

		it("should POST with code, testCases, and dockerConfig = 2", done => {
			const payload = {
				socketId,
				code: "process.stdout.write('Hello World!')",
				dockerConfig: "2",
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
					done();
				});
		});
	});
});

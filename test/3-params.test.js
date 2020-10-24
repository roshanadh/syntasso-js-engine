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

		it("should not POST without testCases", done => {
			const payload = {
				socketId,
				code: "process.stdout.write('Hello World!')",
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
		it("should POST with socketId, code, and testCases", done => {
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
					res.body.processes[0].observedOutput.should.equal(
						"Hello World!"
					);
					done();
				});
		});
	});
});

const { mocha, chai, should, expect, server } = require("./test-config.js");

describe("Tests: ", () => {
	let socket, socketId;

	const log = console.log;
	// use log in place of console.log for logging during tests
	console.log = msg => { }

	before(async () => {
		const { createConnection } = require("./test-config.js");
		socket = await createConnection();
	});

	describe("1a. Socket connection at http://localhost:8080", () => {
		it("should be connected to a socket", done => {
			expect(socket.connected).to.be.true;
			done();
		});
	});
	
	describe("1b. GET request at /", () => {
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
});
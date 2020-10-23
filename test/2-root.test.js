const { server, chai, mocha, should, expect } = require("./test-config.js");

describe("Test GET /:", () => {
	let socket, socketId;
	before(async () => {
		const { getConnection } = require("./test-config.js");
		socket = await getConnection();
		socketId = socket.id;
	});
	it("should GET Hello World message", done => {
		chai.request(server)
			.get("/")
			.end((err, res) => {
				expect(err).to.be.null;
				res.body.should.be.a("object");
				res.body.message.should.equal("Hello World!");
				done();
			});
	});
});

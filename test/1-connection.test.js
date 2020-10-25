const { mocha, chai, should, expect, server } = require("./test-config.js");

describe("Tests: ", () => {
	let socket, socketId;
	before(async () => {
		const { createConnection } = require("./test-config.js");
		socket = await createConnection();
	});

	describe("Socket connection at http://localhost:8080", () => {
		it("should be connected to a socket", done => {
			expect(socket.connected).to.be.true;
			socket.on("container-ready-status", logs => {
				expect(logs.status).to.equal("ready");
				done();
			});
		});
	});
});

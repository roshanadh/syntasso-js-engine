const { mocha, chai, should, expect, path, fs, execSync } = require("./test-config.js");

describe("4. Clean up files after socket disconnect", () => {
	let socket, socketId;
	before(async () => {
		const { removeConnection } = require("./test-config.js");
		socket= await removeConnection();
		socketId = socket.id;
	});

	it("should disconnect from socket", done => {
		expect(socket.connected).to.be.false;
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
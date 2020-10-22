const {
	mocha,
	chai,
	should,
	expect,
	path,
	fs,
	execSync,
} = require("./test-config.js");

describe("5. Clean up files after socket disconnect", () => {
	let socket, socketId, tempFilesPath, outputFilePath;
	before(async () => {
		const { removeConnection } = require("./test-config.js");
		let removedConnection = await removeConnection();
		socket = removedConnection.socket;
		socketId = removedConnection.socketId;
		tempFilesPath = path.resolve("client-files", socketId);
		outputFilePath = path.resolve(
			"client-files",
			"outputs",
			`${socketId}.txt`
		);
	});

	it("should disconnect from socket", done => {
		expect(socket.connected).to.be.false;
		done();
	});
	it("should remove the docker container if it was created", done => {
		let filter = `\"name=${socketId}\"`;
		const searchContainerOutput = execSync(`docker ps -aqf ${filter}`, {
			stdio: ["pipe", "pipe", "pipe"],
		});
		expect(searchContainerOutput.toString().trim()).to.be.empty;
		done();
	});
	it("should remove the temporary client files if they were created", done => {
		expect(fs.existsSync(tempFilesPath)).to.be.false;
		done();
	});
	it("should remove the output file if it was created", done => {
		expect(fs.existsSync(outputFilePath)).to.be.false;
		done();
	});
});

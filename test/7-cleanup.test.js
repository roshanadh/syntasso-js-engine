const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const { mocha, chai, should, expect } = require("./test-config.js");

describe("Test socket disconnection and cleanup:", () => {
	let socket, socketId, clientFilesSubDirPath;
	before(async () => {
		const { removeConnection } = require("./test-config.js");
		let removedConnection = await removeConnection();
		socket = removedConnection.socket;
		socketId = removedConnection.socketId;
		clientFilesSubDirPath = path.resolve("client-files", socketId);
	});

	it("should disconnect from socket", done => {
		expect(socket.connected).to.be.false;
		done();
	});

	it("should remove the docker container if it was created", done => {
		let filter = `\"name=${socketId}\"`;
		const searchContainerOutput = execSync(`docker ps -aqf ${filter}`);
		expect(searchContainerOutput.toString().trim()).to.be.empty;
		done();
	});

	it("should remove the client-files/{socketId} sub-directory if it was created", done => {
		expect(fs.existsSync(clientFilesSubDirPath)).to.be.false;
		done();
	});
});

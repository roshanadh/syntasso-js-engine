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
	it("should remove any sample input files if they exist", done => {
		const filePath = path.resolve("client-files", "tests", "sampleInputs");
		let count = 0;
		fs.readdirSync(filePath)
			.forEach(sampleInputFile => {
				let fileNames = sampleInputFile.split("-");
				let parsedSocketId = `${fileNames[0]}-${fileNames[1]}`;
				if (parsedSocketId === socketId) count++;
			});
		expect(count).to.equal(0);
		done();
	});
	it("should remove any expected output files if they exist", done => {
		const filePath = path.resolve("client-files", "tests", "expectedOutputs");
		let count = 0;
		fs.readdirSync(filePath)
			.forEach(expectedOutputFile => {
				let fileNames = expectedOutputFile.split("-");
				let parsedSocketId = `${fileNames[0]}-${fileNames[1]}`;
				if (parsedSocketId === socketId) count++;
			});
		expect(count).to.equal(0);
		done();
	});
});
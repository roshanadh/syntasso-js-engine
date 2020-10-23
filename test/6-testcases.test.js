const { server, chai, mocha, should, expect } = require("./test-config.js");

describe("Test output of test cases at /submit:", () => {
	let socket, socketId;
	before(async () => {
		const { getConnection } = require("./test-config.js");
		socket = await getConnection();
		socketId = socket.id;
	});
	it("should respond with testStatus = true", done => {
		const payload = {
			socketId,
			// stub with code to calculate area of a rectangle
			code: `"use strict"; let rawSampleInput, parsedInput = [], currentLine = 0; function calcArea(length, breadth) { return length * breadth; } const readLine = () => parsedInput[currentLine++]; const main = () => { if (process.argv.length == 3) { rawSampleInput = process.argv[2]; parsedInput = rawSampleInput.split("\\n"); try { let length = parseInt(readLine()); let breadth = parseInt(readLine()); let output = calcArea(length, breadth); process.stdout.write(output.toString()); } catch (error) { process.stderr.write(error); } } else if (process.argv.length > 3) { throw new Error("Too many inputs provided"); } else { throw new Error("No input provided"); } }; main(); `,
			dockerConfig: "2",
			testCases: [{ sampleInput: "5\n2", expectedOutput: "10" }],
		};
		chai.request(server)
			.post("/submit")
			.send(payload)
			.end((err, res) => {
				expect(err).to.be.null;
				res.body.should.be.a("object");
				res.body.sampleInputs.should.equal(1);
				expect(res.body.processes[0].testStatus).to.be.true;
				done();
			});
	});
	it("should respond with testStatus = false", done => {
		const payload = {
			socketId,
			// stub with code to calculate area of a rectangle
			code: `"use strict"; let rawSampleInput, parsedInput = [], currentLine = 0; function calcArea(length, breadth) { return length * breadth; } const readLine = () => parsedInput[currentLine++]; const main = () => { if (process.argv.length == 3) { rawSampleInput = process.argv[2]; parsedInput = rawSampleInput.split("\\n"); try { let length = parseInt(readLine()); let breadth = parseInt(readLine()); let output = calcArea(length, breadth); process.stdout.write(output.toString()); } catch (error) { process.stderr.write(error); } } else if (process.argv.length > 3) { throw new Error("Too many inputs provided"); } else { throw new Error("No input provided"); } }; main(); `,
			dockerConfig: "2",
			testCases: [{ sampleInput: "5\n20", expectedOutput: "10" }],
		};
		chai.request(server)
			.post("/submit")
			.send(payload)
			.end((err, res) => {
				expect(err).to.be.null;
				res.body.should.be.a("object");
				res.body.sampleInputs.should.equal(1);
				expect(res.body.processes[0].testStatus).to.be.false;
				done();
			});
	});
	it("should respond with timedOut = true", done => {
		const payload = {
			socketId,
			// print i after an infinite loop
			code: `for (let i = 0; i < 1; i--) {} console.log(i);`,
			dockerConfig: "2",
			testCases: [{ sampleInput: 0, expectedOutput: 0 }],
		};
		chai.request(server)
			.post("/submit")
			.send(payload)
			.end((err, res) => {
				expect(err).to.be.null;
				res.body.should.be.a("object");
				res.body.sampleInputs.should.equal(1);
				expect(res.body.timeOutLength).to.equal(2000);
				expect(res.body.observedOutputMaxLength).to.equal(2000);
				expect(res.body.processes[0].timedOut).to.be.true;
				expect(res.body.processes[0].observedOutputTooLong).to.be.false;
				expect(res.body.processes[0].testStatus).to.be.false;
				done();
			});
	});
	it("should respond with observedOutputTooLong = true", done => {
		const payload = {
			socketId,
			// print i inside an infinite loop
			code: `for (let i = 0; i < 1; i--) {console.log(i);}`,
			dockerConfig: "2",
			testCases: [{ sampleInput: 0, expectedOutput: 0 }],
		};
		chai.request(server)
			.post("/submit")
			.send(payload)
			.end((err, res) => {
				expect(err).to.be.null;
				res.body.should.be.a("object");
				res.body.sampleInputs.should.equal(1);
				expect(res.body.timeOutLength).to.equal(2000);
				expect(res.body.observedOutputMaxLength).to.equal(2000);
				expect(res.body.processes[0].timedOut).to.be.true;
				expect(res.body.processes[0].observedOutputTooLong).to.be.true;
				expect(res.body.processes[0].testStatus).to.be.false;
				done();
			});
	});
});

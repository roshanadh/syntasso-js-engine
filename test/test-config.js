// test runner - mocha
const mocha = require("mocha");
// testing library - chai
const chai = require("chai");
// plugin for testing over HTTP
const chaiHttp = require("chai-http");
// client API for socket.io
const io = require("socket.io-client");

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const { server } = require("../server.js");

chai.use(chaiHttp);
const should = chai.should();
const expect = chai.expect;

const log = console.log;
// use log in place of console.log for logging during tests
console.log = msg => { }

let socket, socketId;

createConnection = async () => {
	socket = await io.connect("http://localhost:8080");
	socket.on("connect", () => {
		log("Socket connection successful!");
		socketId = socket.id;
	});

	socket.on("disconnect", () => {
		log("Socket disconnected!");
	});
	return socket;
}

removeConnection = async () => {
	if (socket.connected) {
		socket.disconnect();
		return socketId;
	} else {
		log("Socket connection doesn't exist.");
		return null;
	}
}

getConnection = () => {
	return socket;
}

module.exports = {
	mocha,
	chai,
	should,
	expect,
	path,
	fs,
	execSync,
	server,
	createConnection,
	removeConnection,
	getConnection,
}
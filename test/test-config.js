// test runner - mocha
const mocha = require("mocha");
// testing library - chai
const chai = require("chai");
// plugin for testing over HTTP
const chaiHttp = require("chai-http");
// client API for socket.io
const io = require("socket.io-client");

const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const { server } = require("../server.js");

chai.use(chaiHttp);
const should = chai.should();
const expect = chai.expect;

let log = console.log,
  logObj = console.dir,
  logError = console.error;

let socket;

createConnection = async () => {
  socket = await io.connect("http://127.0.0.1:8080");
  return socket;
};

removeConnection = async () => {
  let socketId = socket.id;
  if (socket.connected) {
    socket.disconnect();
    return { socket, socketId };
  } else {
    log("Socket connection doesn't exist.");
    return null;
  }
};

getConnection = () => socket;

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
};

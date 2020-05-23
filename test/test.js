process.env.NODE_ENV = 'test';

// test runner - mocha
const mocha = require('mocha');
// testing library - chai
const chai = require('chai');
// plugin for testing over HTTP
const chaiHttp = require('chai-http');

const server = require('../server.js');

chai.use(chaiHttp);
const should = chai.should();
const expect = chai.expect;

describe('GET method at /', () => {
    it("should return 'Hello World!' response", done => {
        chai.request(server)
            .get('/')
            .end((err, res) => {
                expect(err).to.be.null;
                res.should.have.status(200);
                res.text.should.be.a('string');
                res.text.should.equal('Hello World!');
                done();
            })
    })
})
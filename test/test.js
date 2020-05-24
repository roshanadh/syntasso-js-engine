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

describe('Tests: ', () => {
    // suppress console logs for each test by ...
    // ... modifying the console.log function
    beforeEach(() => {
        console.log = msg => {}
    });
    describe('1. GET request at /', () => {
        it("should return 'Hello World!' response", done => {
            chai.request(server)
                .get('/')
                .end((err, res) => {
                    expect(err).to.be.null;
                    res.should.have.status(200);
                    res.text.should.be.a('string');
                    res.text.should.equal('Hello World!');
                    done();
                });
        });
    });
    
    describe('2. POST requests at /execute', () => {
        describe('2a. POST without code and dockerConfig at /execute', () => {
            it('should not POST without code and dockerConfig', done => {
                chai.request(server)
                    .post('/execute')
                    .end((err, res) => {
                        res.body.should.be.a('object');
                        res.body.should.have.property('error');
                        res.body.error.should.equal('Bad Request: No Code Provided!');
                        done();
                    });
            });
        });
    
        describe('2b. POST with code but without dockerConfig at /execute', () => {
            it('should not POST without dockerConfig', done => {
                let payload = {
                    code: "console.log('Hello World!)"
                }
                chai.request(server)
                    .post('/execute')
                    .send(payload)
                    .end((err, res) => {
                        res.body.should.be.a('object');
                        res.body.should.have.property('error');
                        res.body.error.should.equal('Bad Request: No Docker Configuration Instruction Provided!');
                        done();
                    });
            });
        });
    
        describe('2c. POST without code but with dockerConfig at /execute', () => {
            it('should not POST without dockerConfig', done => {
                let payload = {
                    dockerConfig: 0
                }
                chai.request(server)
                    .post('/execute')
                    .send(payload)
                    .end((err, res) => {
                        res.body.should.be.a('object');
                        res.body.should.have.property('error');
                        res.body.error.should.equal('Bad Request: No Code Provided!');
                        done();
                    });
            });
        });
    
        describe('2d. POST with code and dockerConfig at /execute', () => {
            it('should POST with both parameters provided', done => {
                let payload = {
                    code: "console.log('Hello World!')",
                    dockerConfig: "0"
                }
                chai.request(server)
                    .post('/execute')
                    .send(payload)
                    .end((err, res) => {
                        res.body.should.be.a('object');
                        res.body.should.have.property('output');
                        res.body.should.have.property('imageBuildTime');
                        res.body.should.have.property('containerCreateTime');
                        res.body.should.have.property('containerStartTime');
                        res.body.should.have.property('execTime');
                        res.body.output.should.equal('Hello World!\r\n');
                        done();
                    });
            });
        });
    });
});

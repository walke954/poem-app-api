const chai = require('chai');
const chaiHttp = require('chai-http');

const {app, runServer, closeServer} = require('../server');

const {TEST_DATABASE_URL} = require('../config');
const {JWT_SECRET} = require('../config');

const mongoose = require('mongoose');

const {User} = require('../user/models');
const jwt = require("jsonwebtoken");

const expect = chai.expect;

chai.use(chaiHttp);

describe('Auth Router', function(){
	before(function(){
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function(){ });

	afterEach(function(){
		return User.remove({});
	});

	after(function(){
		return closeServer();
	});

	describe('Create a jwt token and send it back', function(){
		it('should fail if the username field is not filled out', function(){
			return chai.request(app)
				.post('/api/auth/login')
				.send({
					username: null,
					password: 'sldfsdfsdfjoijd',
					displayName: 'sldhfoi'
				})
				.then(function(res){
					expect(res).to.have.status(400);
				});
		});

		it('should fail if the password field is not filled out', function(){
			return chai.request(app)
				.post('/api/auth/login')
				.send({
					username: 'sdifhosijd',
					password: null,
					displayName: 'sldhfoi',
				})
				.then(function(res){
					expect(res).to.have.status(400);
				});
		});

		it('should fail if the password is under ten characters', function(){
			return chai.request(app)
				.post('/api/auth/login')
				.send({
					username: 'sdif',
					password: 'shdofi',
					displayName: 'sldhfoi',
				})
				.then(function(res){
					expect(res).to.have.status(500);
				});
		});

		it('should fail if the username starts with a space', function(){
			return chai.request(app)
				.post('/api/auth/login')
				.send({
					username: ' sdif',
					password: 'shdofi',
					displayName: 'sldhfoi'
				})
				.then(function(res){
					expect(res).to.have.status(500);
				});
		});

		it('should fail if username is not a string', function(){
			return chai.request(app)
				.post('/api/auth/login')
				.send({
					username: 234,
					password: 'shdofi',
					displayName: 'sldhfoi'
				})
				.then(function(res){
					expect(res).to.have.status(500);
				});
		});
	});
});
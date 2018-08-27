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

describe('User Router', function(){
	const username1 = "example";
	const password1 = "examplepassword";
	const displayName = 'Joe T';

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

	describe('POST new user', function(){
		it('should fail if the username field is not filled out', function(){
			return chai.request(app)
				.post('/api/user')
				.send({
					username: null,
					password: 'sldfsdfsdfjoijd',
					diplayName: 'oaisdjof',
					date: new Date()
				})
				.then(function(res){
					expect(res).to.have.status(422);
				});
		});

		it('should fail if the password field is not filled out', function(){
			return chai.request(app)
				.post('/api/user')
				.send({
					username: 'sdifhosijd',
					password: null,
					diplayName: 'oaisdjof',
					date: new Date()
				})
				.then(function(res){
					expect(res).to.have.status(422);
				});
		});

		it('should fail if the displayName field is not filled out', function(){
			return chai.request(app)
				.post('/api/user')
				.send({
					username: 'sdofij',
					password: 'sldfsdfsdfjoijd',
					diplayName: null,
					date: new Date()
				})
				.then(function(res){
					expect(res).to.have.status(422);
				});
		});

		it('should fail if the password is under ten characters', function(){
			return chai.request(app)
				.post('/api/user')
				.send({
					username: 'sdif',
					password: 'shdofi',
					diplayName: 'oaisdjof',
					date: new Date()
				})
				.then(function(res){
					expect(res).to.have.status(422);
				});
		});

		it('should fail if the username starts with a space', function(){
			return chai.request(app)
				.post('/api/user')
				.send({
					username: ' sdif',
					password: 'sldfsdfsdfjoijd',
					diplayName: 'oaisdjof',
					date: new Date()
				})
				.then(function(res){
					expect(res).to.have.status(422);
				});
		});

		it('should fail if username is not a string', function(){
			return chai.request(app)
				.post('/api/user')
				.send({
					username: 234,
					password: 'sldfsdfsdfjoijd',
					diplayName: 'oaisdjof',
					date: new Date()
				})
				.then(function(res){
					expect(res).to.have.status(422);
				});
		});

		it('should fail if username is already taken', function(){
			return User.create({
				username: username1,
				password: password1,
				displayName: displayName,
				date: new Date()
			})

			.then(() => {
				return chai.request(app)
					.post('/api/user')
					.send({
						username: username1,
						password: password1,
						displayName: displayName,
						date: new Date()
					})
			})
			.then(res => {
				expect(res).to.have.status(422);
			});
		});

		it('should create a new user', function(){
			return chai.request(app)
				.post('/api/user')
				.send({
					username: username1,
					password: password1,
					displayName: displayName,
					date: new Date()
				})
				.then(function(res){
					expect(res).to.have.status(201);

					return User.findOne({username: username1});
				})
				.then(function(user){
					expect(user.username).to.equal(username1);

					return user.passwordValidate(password1);
				})
				.then(password =>{
					expect(password).to.be.true;
				});
		});
	});

	describe('DELETE User', function(){
		it('should delete a previous user', function(){
			const token = jwt.sign(
				{
					user: {
						username: username1
					}
				},
				JWT_SECRET,
				{
					algorithm: 'HS256',
					subject: username1,
			  		expiresIn: '7d'
				}
			);

			let id;

			return User.create({
				username: username1,
				password: password1,
				displayName: displayName,
				date: new Date()
			})
			.then(() => {
				return User.findOne({username: username1});
			})
			.then(user => {
				id = user._id;
				
				return chai.request(app)
					.delete('/api/user/' + user._id)
					.set('Authorization', `Bearer ${token}`);
			})
			.then(res => {
				expect(res).to.have.status(204);

				return User.findById(id);
			})
			.then(function(user){
				expect(user).to.be.null;
			});
		})
	});
});
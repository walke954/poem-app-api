const chai = require('chai');
const chaiHttp = require('chai-http');

const {app, runServer, closeServer} = require('../server');

const {TEST_DATABASE_URL} = require('../config');
const {JWT_SECRET} = require('../config');

const mongoose = require('mongoose');

const {User} = require('../user/models');
const {Poem} = require('../poem/models');
const jwt = require("jsonwebtoken");

const expect = chai.expect;

chai.use(chaiHttp);

describe('Test Rest API', function(){
	const username = 'hurt232';
	const password = 'examplepassword';
	const displayName = 'Joe';
	const date = new Date();
	const poems = [];
	const likes = [];

	const workingToken = jwt.sign(
		{
			user: {
				username,
				displayName
			}
		},
		JWT_SECRET,
		{
			algorithm: 'HS256',
			subject: username,
	  		expiresIn: '7d'
		}
	);

	before(function(){
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function(){
		return User.hashPassword(password).then(password => {
			User.create({
				username,
				password,
				displayName,
				date,
				poems,
				likes
			})
		});
	});

	afterEach(function(){
		return User.remove({})
			.then(function(){
				return Poem.remove({});
			});
	});

	after(function(){
		return closeServer();
	});

	describe('POST New Poem', function(){
		const newPoem = {
			title: 'hello',
			content: 'there'
		}

		it('a new poem should be posted to the server and database', function(){
			return chai.request(app)
				.post('/api/poem/')
				.set('Accept','application/json')
				.set('Authorization', `Bearer ${workingToken}`)
				.send(newPoem)
				.then(function(res){
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body).to.include.keys('title');
					expect(res.body).to.include.keys('content');
					expect(res.body).to.include.keys('date');
					
					return Poem.findOne({title: newPoem.title});
				})
				.then(function(poem){
					expect(poem.title).to.equal(newPoem.title);
					expect(poem.content).to.equal(newPoem.content);

					return User.findOne({username: username});
				})
				.then(function(user){
					expect(user.poems).to.be.a('array');
					expect(user.poems[0]).to.be.a('string')
				})
		});
	});

	describe('GET Poem', function(){
		const newPoem = {
			title: 'pizza',
			content: 'earth'
		}

		before(function(){
			return Poem.create({
				title: newPoem.title,
				username,
				displayName,
				date: new Date(),
				content: newPoem.content,
				likes: 0,
				comments: []
			});
		});

		it('should get poem', function(){
			return Poem
				.findOne({title: newPoem.title})
				.then(function(poem){
					const query = `?id=${poem._id}`;

					return chai.request(app)
						.get('/api/poem/' + query)
						.set('Accept','application/json')
						.set('Authorization', `Bearer ${workingToken}`)
						.then(function(res){
							expect(res).to.have.status(200);
							expect(res.body).to.be.a('object');
							expect(res.body.poem).to.be.a('object');
							expect(res.body.poem.title).to.equal(newPoem.title);
						});
				});
		});
	});

	describe('GET Poem List', function(){
		const specUsername = 'Jeb';

		// only two poems have 'Jeb' as the username, and they are the last two
		const poemsIn = [
			{
				title: 'pizza',
				content: 'earth',
				username,
				displayName,
				date: new Date(),
				likes: 0,
				comments: []
			},
			{
				title: 'chili',
				content: 'hotdog',
				username,
				displayName,
				date: new Date(),
				likes: 0,
				comments: []
			},
			{
				title: 'cats',
				content: 'dogs',
				username,
				displayName,
				date: new Date(),
				likes: 0,
				comments: []
			},
			{
				title: 'chimney',
				content: 'casper',
				username,
				displayName,
				date: new Date(),
				likes: 0,
				comments: []
			},
			{
				title: 'fog',
				content: 'wind',
				username: specUsername,
				displayName,
				date: new Date(),
				likes: 0,
				comments: []
			},
			{
				title: 'rain',
				content: 'fire',
				username: specUsername,
				displayName,
				date: new Date(),
				likes: 0,
				comments: []
			}
		]

		beforeEach(function(){
			return Poem.insertMany(poemsIn);
		});

		it('should get a list of poems 5 long', function(){
			const query = `?search=&page=0`;
			return chai.request(app)
				.get('/api/poem/list/' + query)
				.set('Accept','application/json')
				.then(function(res){
					expect(res).to.have.status(200);
					expect(res.body).to.be.a('object');
					expect(res.body.poems).to.be.a('array');
					expect(res.body.poems.length).to.equal(5);
				});
		});

		it('should get a list of two poems from specified username', function(){
			const query = `?username=${specUsername}&page=0`;
			return chai.request(app)
				.get('/api/poem/list/' + query)
				.set('Accept','application/json')
				.then(function(res){
					expect(res).to.have.status(200);
					expect(res.body).to.be.a('object');
					expect(res.body.poems).to.be.a('array');
					expect(res.body.poems.length).to.equal(2);
				});
		});
	});

	describe('DELETE Poem', function(){
		const newPoem = {
			title: 'pizza',
			content: 'earth'
		}

		before(function(){
			return Poem.create({
				title: newPoem.title,
				username,
				displayName,
				date: new Date(),
				content: newPoem.content,
				likes: 0,
				comments: []
			});
		});

		let savedPoem;
		it('should delete a poem based off of an id', function(){
			return Poem
				.findOne({title: newPoem.title})
				.then(function(poem){
					savedPoem = poem;

					// add poem to user's document
					return User.findOne({username: username})
				})
				.then(user => {
					user.poems.push(savedPoem._id);
					user.save();

					return user;
				})
				.then(user => {
					return chai.request(app)
						.delete('/api/poem/' + savedPoem._id)
						.set('Authorization', `Bearer ${workingToken}`);
				})
				.then(function(res){
					expect(res).to.have.status(204);
					return Poem.findById(savedPoem._id);
				})
				.then(function(entryToDelete){
					expect(entryToDelete).to.be.null;
				});
		});
	});

	describe('PUT Poem', function(){
		const newPoem = {
			title: 'pizza',
			content: 'earth'
		}

		before(function(){
			return Poem.create({
				title: newPoem.title,
				username,
				displayName,
				date: new Date(),
				content: newPoem.content,
				likes: 0,
				comments: []
			});
		});

		it('should update and existing poem', function(){
			const updatedContent = {
				title: 'horse',
				content: 'rider'
			}

			let savedPoem;
			return Poem
				.findOne({title: newPoem.title})
				.then(function(poem){
					savedPoem = poem;

					// add poem to user's document
					return User.findOne({username: username})
				})
				.then(user => {
					user.poems.push(savedPoem._id);
					user.save();

					return user;
				})
				.then(user => {
					return chai.request(app)
						.put('/api/poem/' + savedPoem._id)
						.set('Accept','application/json')
						.set('Authorization', `Bearer ${workingToken}`)
						.send(updatedContent);
				})
				.then(function(res){
					expect(res).to.have.status(204);
					return Poem.findById(savedPoem._id);
				})
				.then(function(poem){
					expect(poem.title).to.not.equal(savedPoem.title);
					expect(poem.content).to.not.equal(savedPoem.content);
				});
		});
	});

	describe('PUT Like Poem', function(){
		const newPoem = {
			title: 'pizza',
			content: 'earth'
		}

		const user2 = 'Steve';

		beforeEach(function(){
			return Poem.create({
				title: newPoem.title,
				username,
				displayName,
				date: new Date(),
				content: newPoem.content,
				likes: 0,
				comments: []
			});
		});

		beforeEach(function(){
			return User.create({
				username: user2,
				password,
				displayName,
				date,
				poems,
				likes
			});
		});

		it('should add a like to poem', function(){
			let savedPoem;
			return Poem
				.findOne({title: newPoem.title})
				.then(function(poem){
					savedPoem = poem;

					// add poem to user's document
					return User.findOne({username: user2})
				})
				.then(user => {
					user.poems.push(savedPoem._id);
					user.save();

					return user;
				})
				.then(user => {
					return chai.request(app)
						.put('/api/poem/like/' + savedPoem._id)
						.set('Accept','application/json')
						.set('Authorization', `Bearer ${workingToken}`);
				})
				.then(function(res){
					expect(res).to.have.status(204);
					return Poem.findById(savedPoem._id);
				})
				.then(function(poem){
					expect(poem.likes).to.equal(1);
				});
		});
	});
});
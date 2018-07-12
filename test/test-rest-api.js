// const chai = require('chai');
// const chaiHttp = require('chai-http');

// const {app, runServer, closeServer} = require('../server');

// const {TEST_DATABASE_URL} = require('../config');
// const {JWT_SECRET} = require('../config');

// const mongoose = require('mongoose');

// const {Prompts} = require('../entry/prompts');
// const {User} = require('../user/models');
// const jwt = require("jsonwebtoken");

// const expect = chai.expect;

// chai.use(chaiHttp);

// function seedEntries(){
// 	const entries = [];

// 	for(let i = 0; i < 30; i++){
// 		entries.push(generateRandomEntry());
// 	}

// 	return entries;
// }

// // for seeding db
// function generateRandomEntry(){
// 	const year = 2018;
// 	const month = Math.floor(Math.random() * (new Date().getMonth() + 1));

// 	// obviously most months have 30 or 31 days, but that adds an unnecessary level of complexity, so we will just pretend every month has 28 days.
// 	let date = Math.floor(Math.random() * 28);

// 	//can't post if todays date already has a post, so we need to change it then
// 	if(date === new Date().getDate() && month === new Date().getMonth()){
// 		date++;
// 	}

// 	const emotionStates = ['happy', 'sad', 'angry', 'confused', 'afraid', 'surprised', 'disgusted'];
// 	const randomStrings = [
// 		'laksjdf;lj',
// 		'jsbdo',
// 		'qowri',
// 		'psdkfjoouh',
// 		'owueryhbj',
// 		'lxcoshdfh',
// 		'qwuerhnkl',
// 		'xucghipji',
// 		'asjofubouhf',
// 		'bsjdofnsig',
// 		'coihwur',
// 		'doiwpjhou'
// 	]

// 	let obj = {
// 		date: date,
// 		month: month,
// 		year: year,
// 		'daily_emotion': emotionStates[Math.floor(Math.random() * emotionStates.length)],
// 		'emotion_summary': randomStrings[Math.floor(Math.random() * randomStrings.length)],
// 		'optional_prompts': []
// 	}

// 	for(let i = 0; i < Prompts.length; i++){
// 		if(Math.random() < 0.3){
// 			obj['optional_prompts'].push({
// 				prompt: Prompts[i].prompt,
// 				answer: randomStrings[Math.floor(Math.random() * randomStrings.length)]
// 			});
// 		}
// 	}

// 	return obj;
// }

// // for simulating a POST request
// function generateRandomCreateEntry(){
// 	const emotionStates = ['happy', 'sad', 'angry', 'confused', 'afraid', 'surprised', 'disgusted'];
// 	const randomStrings = [
// 		'laksjdf;lj',
// 		'jsbdo',
// 		'qowri',
// 		'psdkfjoouh',
// 		'owueryhbj',
// 		'lxcoshdfh',
// 		'qwuerhnkl',
// 		'xucghipji',
// 		'asjofubouhf',
// 		'bsjdofnsig',
// 		'coihwur',
// 		'doiwpjhou'
// 	]

// 	let obj = {
// 		'daily_emotion': emotionStates[Math.floor(Math.random() * emotionStates.length)],
// 		'emotion_summary': randomStrings[Math.floor(Math.random() * randomStrings.length)],
// 	}

// 	for(let i = 0; i < Prompts.length; i++){
// 		if(Math.random() > 0.5){
// 			obj[`text-prompt-${i}`] = randomStrings[Math.floor(Math.random() * randomStrings.length)];
// 		}
// 	}

// 	return obj;
// }

// describe('Test Rest API', function(){
// 	const username = "example";
// 	const password = "examplepassword";
// 	const monthCreated = 3;
// 	const yearCreated = 2018;

// 	const workingToken = jwt.sign(
// 		{
// 			user: {
// 				username
// 			}
// 		},
// 		JWT_SECRET,
// 		{
// 			algorithm: 'HS256',
// 			subject: username,
// 	  		expiresIn: '7d'
// 		}
// 	);

// 	before(function(){
// 		return runServer(TEST_DATABASE_URL);
// 	});

// 	beforeEach(function(){
// 		return User.hashPassword(password).then(password => {
// 			User.create({
// 				username,
// 				password,
// 				monthCreated,
// 				yearCreated,
// 				entries: seedEntries()
// 			})
// 		});
// 	});

// 	afterEach(function(){
// 		return User.remove({});
// 	});

// 	after(function(){
// 		return closeServer();
// 	});

// 	describe('Invalid Request', function(){
// 		it('Should reject requests that lacks credentials', function(){
// 			return chai.request(app)
// 				.get('/users/logged')
// 				.then((res) => {
// 					expect(res).to.have.status(401);
// 					return;
// 				})
// 		});
// 	});

// 	describe('Invalid Token', function(){
// 		const token = jwt.sign(
// 			{
// 				username
// 			},
// 			'invalidSecret',
// 			{
// 				algorithm: 'HS256',
//           		expiresIn: '7d'
// 			}
// 		);
// 		it('Should reject requests that lacks a valid token', function(){
// 			return chai.request(app)
// 				.get('/users/logged')
// 				.set('Authorization', `Bearer ${token}`)
// 				.then((res) => {
// 					expect(res).to.have.status(401);
// 					return;
// 				})
// 		});
// 	});

// 	describe('Expired Token', function(){
// 		const token = jwt.sign(
// 			{
// 				user: {
// 					username
// 				},
// 				exp: Math.floor(Date.now() / 1000) - 10
// 			},
// 			JWT_SECRET,
// 			{
// 				algorithm: 'HS256',
//           		subject: username
// 			}
// 		);
// 		it('Should reject requests that have an expired token', function(){
// 			return chai.request(app)
// 				.get('/users/logged')
// 				.set('Authorization', `Bearer ${token}`)
// 				.then((res) => {
// 					expect(res).to.have.status(401);
// 					return;
// 				})
// 		});
// 	});

// 	describe('POST New Entry', function(){
// 		const newEntry1 = generateRandomCreateEntry();

// 		it('a new entry should be posted to the server and database', function(){
// 			return chai.request(app)
// 				.post('/entries/')
// 				.set('Accept','application/json')
// 				.set('Authorization', `Bearer ${workingToken}`)
// 				.send(newEntry1)
// 				.then(function(res){
// 					expect(res).to.have.status(201);
// 					expect(res).to.be.json;
// 					expect(res.body).to.be.a('object');
// 					expect(res.body).to.include.keys('entries');

// 					// go to the 31th entry since that is the one we added (30 entries were seeded earlier)
// 					expect(res.body.entries[30]).to.include.keys('daily_emotion', 'emotion_summary', 'date', 'month', 'year');
// 					expect(res.body.id).to.not.be.null;
// 					expect(res.body.entries[30].date).to.equal(new Date().getDate());
// 					expect(res.body.entries[30].month).to.equal(new Date().getMonth());
// 					expect(res.body.entries[30].year).to.equal(new Date().getFullYear());
// 					expect(res.body.entries[30].daily_emotion).to.equal(newEntry1['daily_emotion']);
// 					expect(res.body.entries[30].emotion_summary).to.equal(newEntry1['emotion_summary']);

// 					const prompts_list = res.body.entries[30].optional_prompts;

// 					expect(prompts_list).to.be.a('array');

// 					// test values inside optional_prompts if they exist and are formatted correctly
// 					if(prompts_list.length > 0){
// 						let prompt_key_ids = Object.keys(newEntry1).filter(key => {
// 							if(key.search('text-prompt') >= 0){
// 								return key;
// 							}
// 						});

// 						prompt_key_ids = prompt_key_ids.map(key => {
// 							return key.split('-')[2];
// 						})

// 						for(let i = 0; i < prompts_list.length; i++){
// 							expect(prompts_list[i].prompt).to.equal(Prompts[prompt_key_ids[i]].prompt);
// 							expect(prompts_list[i].answer).to.equal(newEntry1[`text-prompt-${prompt_key_ids[i]}`]);
// 						}
// 					}
					
// 					return User.findOne({username: username});
// 				})
// 				.then(function(user){
// 					const entry = user.entries[30];
// 					expect(entry.daily_emotion).to.equal(newEntry1['daily_emotion']);
// 					expect(entry.emotion_summary).to.equal(newEntry1['emotion_summary']);
// 				});
// 		});
// 	});

// 	describe('GET Month Entries', function(){
// 		it('should get every entry for a given month', function(){
// 			const queryMonth = Math.floor(Math.random() * (new Date().getMonth() + 1));
// 			const query = `?month=${queryMonth}&year=2018`;

// 			let resEntry;
// 			let index;
// 			return chai.request(app)
// 				.get('/entries' + query)
// 				.set('Accept','application/json')
// 				.set('Authorization', `Bearer ${workingToken}`)
// 				.then(function(res){
// 					expect(res).to.have.status(200);
// 					expect(res.body).to.be.a('object');
// 					expect(res.body.entries).to.be.a('array');

// 					index = res.body.entries.length - 1;

// 					for(let i = 0; i < res.body.entries.length; i++){
// 						expect(res.body.entries[i]).to.be.a('object');
// 						expect(res.body.entries[i]).to.include.keys('_id', 'daily_emotion', 'emotion_summary', 'date', 'month', 'year', 'optional_prompts');
// 					}
// 				});
// 		});
// 	});

// 	describe('GET Prompts', function(){
// 		it('GET and compare all the prompts saved in entryModels.js with what is returned', function(){
// 			let resEntry;
// 			return chai.request(app)
// 				.get('/prompts')
// 				.set('Accept','application/json')
// 				.then(function(res){
// 					expect(res).to.have.status(200);
// 					expect(res.body.prompts).to.be.a('array');

// 					for(let i = 0; i < res.body.prompts.length; i++){
// 						const prompt = res.body.prompts[i].prompt;

// 						expect(prompt).to.equal(Prompts[i].prompt);
// 						expect(i).to.equal(Prompts[i].id);
// 					}
// 				});
// 		});
// 	});

// 	describe('DELETE Entry', function(){
// 		let entry;
// 		it('should delete an entry based off of an id', function(){
// 			return User
// 				.findOne({username: username})
// 				.then(function(user){
// 					const index = Math.floor(Math.random() * user.entries.length);
// 					entry = user.entries[index];
// 					return chai.request(app)
// 						.delete('/entries/' + entry.id)
// 						.set('Authorization', `Bearer ${workingToken}`);
// 				})
// 				.then(function(res){
// 					expect(res).to.have.status(204);
// 					return User.findById(entry.id);
// 				})
// 				.then(function(entryToDelete){
// 					expect(entryToDelete).to.be.null;
// 				});
// 		});
// 	});

// 	describe('PUT Old Entry', function(){
// 		it('should modify an existing entry', function(){
// 			const updateFields = {
// 				emotion_summary: 'hohohhohohohoho',
// 				'text-prompt-1': 'ojojojojojojojoj',
// 				'text-prompt-2': 'dmdmmdmdmdmdmmd'
// 			}

// 			return User
// 				.findOne({username: username})
// 				.then(function(user){
// 					const index = Math.floor(Math.random() * user.entries.length);
// 					const entry = user.entries[index];

// 					updateFields.id = entry.id;
// 					return chai.request(app)
// 						.put('/entries/' + entry.id)
// 						.send(updateFields)
// 						.set('Authorization', `Bearer ${workingToken}`)
// 						.set('Accept','application/json')
// 						.then(function(res){
// 							expect(res).to.have.status(204);

// 							return User.findOne({username: username});
// 						})
// 						.then(function(updatedUser){
// 							const entry = updatedUser.entries.id(updateFields.id);

// 							expect(entry.emotion_summary).to.equal(updateFields.emotion_summary);
// 							expect(entry.optional_prompts[0].prompt).to.equal(Prompts[1].prompt);
// 							expect(entry.optional_prompts[0].answer).to.equal(updateFields['text-prompt-1']);
// 							expect(entry.optional_prompts[1].prompt).to.equal(Prompts[2].prompt);
// 							expect(entry.optional_prompts[1].answer).to.equal(updateFields['text-prompt-2']);
// 						});
// 				})
// 		});
// 	});
// });
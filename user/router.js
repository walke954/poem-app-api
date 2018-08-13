const express = require('express');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const {User} = require('./models');
const {Poem} = require('../poem/models');

const router = express.Router();
const jwt = require("jsonwebtoken");
const {JWT_SECRET} = require('../config');
const passport = require('passport');

const jwtAuth = passport.authenticate('jwt', {session: false});

router.get('/likes/', jwtAuth, (req, res) => {
	const token = req.headers.authorization.split(' ')[1];
	const tokenPayload = jwt.verify(token, JWT_SECRET);

	User
		.findOne({username: tokenPayload.user.username})
		.then(user => {
			res.json({likes: user.likes})
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({message: 'Internal Server Error'});
		});
})

// registering a new user
router.post('/', jsonParser, (req, res) => {
	const required_fields = ['username', 'password', 'displayName'];
	const missing_field = required_fields.find(field => !(field in req.body));

	if(missing_field){
		const message = `missing field '${missing_field}' in request query`;
		console.error(message);
		return res.status(422).send(message);
	}

	const stringFields = ['username', 'password', 'displayName'];
	const nonStringField = stringFields.find(field => field in req.body && typeof req.body[field] !== 'string');

	if(nonStringField){
		const message = `expected type string for field`;
		console.error(message);
		return res.status(422).send(message);
	}

	const trimmedFields = ['username', 'password', 'displayName'];
	const nonTrimmedFields = trimmedFields.find(field => req.body[field].trim() !== req.body[field]);

	if(nonTrimmedFields){
		const message = `fields cannot start or end with whitespace`;
		console.error(message);
		return res.status(422).send(message);
	}

	const fieldSize = {
		username: {
			min: 1
		},
		password: {
			min: 10,
			max: 72
		},
		displayName: {
			min: 1,
		}
	}

	const tooSmall = Object.keys(fieldSize).find(field => 'min' in fieldSize[field] && req.body[field].length < fieldSize[field].min);
	const tooLarge = Object.keys(fieldSize).find(field => 'max' in fieldSize[field] && req.body[field].length > fieldSize[field].max);
	if(tooSmall){
		const message = `fields ${tooSmall} are below the min value of ${fieldSize[tooSmall].min}`;
		console.error(message);
		return res.status(422).send(message);
	}
	if(tooLarge){
		const message = `fields ${tooLarge} are above the max value of ${fieldSize[tooLarge].max}`;
		console.error(message);
		return res.status(422).send(message);
	}

	let {username, password, displayName} = req.body;

	return User.find({username})
		.count()
		.then(count => {
			if(count > 0){
				return Promise.reject({
					code: 422,
					reason: 'ValidationError',
					message: `The username '${username}' is alread taken!`,
					location: 'username'
				});
			}

			return User.hashPassword(password);
		})
		.then(hash => {
			return User.create({
				username,
				password: hash,
				displayName,
				date: new Date()
			});
		})
		.then(user => res.status(201).json(user.serialize(user)))
		.catch(err => {
			if(err.reason === 'ValidationError'){
				return res.status(err.code).json(err);
			}
			console.log(err);
			return res.status(500).json({message: 'Internal Server Error'});
		});
});

// checks to see if user is already logged in
router.get('/log', jwtAuth, (req, res) => {
	const token = req.headers.authorization.split(' ')[1];
	const tokenPayload = jwt.verify(token, JWT_SECRET);
	const _username = tokenPayload.user.username;

	User
		.findOne({username: _username})
		.then(user => {
			return res.send(user.accountBasics());
		})
		.catch(err => {
			console.log(err);
			return res.status(500).json({message: 'User not logged in yet'});
		});
});

router.delete('/:id', jwtAuth, (req, res) => {

	User
		.findById(req.params.id)
		.then(user => {
			return Poem.deleteMany({_id: {$in: user.poems}});
		})
		.then(() => {
			return User.findByIdAndRemove(req.params.id);
		})
		.then(() => {
			console.log('Profile deleted');
			res.status(204).end();
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({message: 'Internal Server Error'});
		});
});

module.exports = router;
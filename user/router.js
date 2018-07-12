const express = require('express');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const {User} = require('./models');

const router = express.Router();
const jwt = require("jsonwebtoken");
const {JWT_SECRET} = require('../config');
const passport = require('passport');

// registering a new user
router.post('/', jsonParser, (req, res) => {
	const required_fields = ['username', 'password', 'firstName', 'lastName'];
	const missing_field = required_fields.find(field => !(field in req.body));

	if(missing_field){
		const message = `missing field '${missing_field}' in request query`;
		console.error(message);
		return res.status(422).send(message);
	}

	const stringFields = ['username', 'password', 'firstName', 'lastName'];
	const nonStringField = stringFields.find(field => field in req.body && typeof req.body[field] !== 'string');

	if(nonStringField){
		const message = `expected type string for field`;
		console.error(message);
		return res.status(422).send(message);
	}

	const trimmedFields = ['username', 'password', 'firstName', 'lastName'];
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
		firstName: {
			min: 1,
		},
		lastName: {
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

	let {username, password, firstName, lastName} = req.body;

	return User.find({username})
		.count()
		.then(count => {
			if(count > 0){
				return Promise.reject({
					code: 422,
					reason: 'ValidationError',
					message: 'username is taken',
					location: 'username'
				});
			}

			return User.hashPassword(password);
		})
		.then(hash => {
			return User.create({
				username,
				password: hash,
				firstName,
				lastName,
				date: new Date()
			});
		})
		.then(user => res.status(201).json(user.serialize(user)))
		.catch(err => {
			if(err === 'ValidationError'){
				res.status(err.code).json(err);
			}
			console.log(err);
			res.status(500).json({message: 'Internal Server Error'});
		});
});

const jwtAuth = passport.authenticate('jwt', {session: false});

// checks to see if user is already logged in
router.get('/logged', jwtAuth, (req, res) => {
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
			return res.status(500).json({message: 'User not logged in yet.'});
		});
});

router.delete('/:id', jwtAuth, (req, res) => {
	User
		.findByIdAndRemove(req.params.id)
		.then(() => {
			console.log('Profile deleted')
			res.status(204).end()
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({message: 'Internal Server Error'});
		});
});

module.exports = router;
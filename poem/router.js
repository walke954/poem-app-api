const express = require('express');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const {User} = require('../user/models');
const {Poem} = require('./models');

const {param, body, query, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');

const router = express.Router();
const jwt = require("jsonwebtoken");
const {JWT_SECRET} = require('../config');
const passport = require('passport');

const jwtAuth = passport.authenticate('jwt', {session: false});

// returns the payload from a request 'authorization' header
function getPayloadFromJwt(req){
	const token = req.headers.authorization.split(' ')[1];
	const tokenPayload = jwt.verify(token, JWT_SECRET);

	return tokenPayload.user;
}

const checkGetById = [
	query('id')
];

router.get('/', jsonParser, checkGetById, (req, res) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(422).json({errors: errors.mapped()});
	}

	Poem
		.findOne({_id: req.query.id})
		.then(poem => {
			res.json({poem});
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({message: 'Internal Server Error'});
		});
});

const checkGetForPage = [
	query('username'),
	query('search'),
	query('page')
];

router.get('/list/', jsonParser, checkGetForPage, (req, res) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(422).json({errors: errors.mapped()});
	}

	if(req.query.page === undefined){
		const message = `a 'page' needs to be specified!`;
		console.error(message);
		return res.status(422).send(message);
	}

	const page_limit = 10;

	if(req.query.username !== undefined){
		Poem
			.find({username: req.query.username})
			.skip(page_limit * page)
			.limit(page_limit)
			.then(poems => {
				poems = poems.map(poem => poem.listItem());
				res.json({poems});
			})
			.catch(err => {
				console.log(err);
				res.status(500).json({message: 'Internal Server Error'});
			});
	}
	else{
		if(req.query.search === undefined){
			const message = `either a 'search' term or a 'username' needs to be queried`;
			console.error(message);
			return res.status(422).send(message);
		}

		Poem
			.find(req.query.search)
			.skip(page_limit * page)
			.limit(page_limit)
			.then(poems => {
				poems = poems.map(poem => poem.listItem());
				res.json({poems});
			})
			.catch(err => {
				console.log(err);
				res.status(500).json({message: 'Internal Server Error'});
			});
	}
});

const checkBody = [
	body('title', `field 'title' does not exist`).exists(),
	body('content', `field 'content' does not exist`).exists()
];

router.post('/', jwtAuth, jsonParser, checkBody, (req, res) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(422).json({errors: errors.mapped()});
	}

	const payload = getPayloadFromJwt(req);

	const date = new Date();

	let poem_id;

	Poem
		.create({
			title: req.body.title,
			username: payload.username,
			firstName: payload.firstName,
			lastName: payload.lastName,
			date: date,
			content: req.body.content,
			likes: 0,
			comments: []
		})
		.then(() => {
			return Poem.findOne({
				username: payload.username, 
				title: req.body.title, 
				content: req.body.content, 
				date: date
			});
		})
		.then(poem => {
			poem_id = poem.id;
			return User.findOne({username: payload.username});
		})
		.then(user => {
			user.poems.push(poem_id);
			user.save();

			return Poem.findOne({
				username: payload.username, 
				title: req.body.title, 
				content: req.body.content, 
				date: date
			});
		})
		.then(poem => {
			res.status(201).json(poem.serialize());
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({message: 'Internal Server Error'});
		});
});

const checkCommentBody = [
	body('poem_id', `field 'poem_id' does not exist`).exists(),
	body('content', `field 'content' does not exist`).exists()
];

router.post('/comment/', jwtAuth, jsonParser, checkCommentBody, (req, res) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(422).json({errors: errors.mapped()});
	}

	const payload = getPayloadFromJwt(req);

	const date = new Date();

	Poem
		.findOne({_id: req.body.poem_id})
		.then(poem => {
			const comment = {
				username: payload.username,
				content: req.body.content,
				date: date,
				replies: []
			}

			poem.comments.push(comment);
			poem.save();

			return comment;
		})
		.then(comment => {
			res.status(201).json(comment);
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({message: 'Internal Server Error'});
		});
});

const checkReplyBody = [
	body('poem_id', `field 'poem_id' does not exist`).exists(),
	body('comment_id', `field 'comment_id' does not exist`).exists(),
	body('content', `field 'content' does not exist`).exists()
];

router.post('/comment/reply/', jwtAuth, jsonParser, checkReplyBody, (req, res) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(422).json({errors: errors.mapped()});
	}

	const payload = getPayloadFromJwt(req);

	const date = new Date();

	Poem
		.findOne({_id: req.body.poem_id})
		.then(poem => {
			const reply = {
				username: payload.username,
				content: req.body.content,
				date: date,
			}
			poem.comments.id(req.body.comment_id).replies.push(reply);
			poem.save();

			return reply;
		})
		.then(reply => {
			res.status(201).json(reply);
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({message: 'Internal Server Error'});
		});
});

router.delete('/:id', jwtAuth, (req, res) => {
	const payload = getPayloadFromJwt(req);

	User
		.findOne({username: payload.username})
		.then(user => {
			const index = user.poems.findIndex(poem => req.params.id === poem);
			
			// if the id cannot be found in the respective user's document, then the deletion process will be stopped because either that specific poem belongs to someone else or it doesn't exist at all.
			if(index === -1){
				const message = `poem not registered for user '${payload.username}'`;
				console.error(message);
				return res.status(422).send(message);
			}

			user.poems.splice(index, 1);
			user.save();

			return Poem.findByIdAndRemove(req.params.id);
		})
		.then(() => res.status(204).end())
		.catch(err => {
			console.log(err);
			res.status(500).json({message: 'Internal Server Error'});
		});
});

router.put('/:id', jwtAuth, jsonParser, (req, res) => {
	const payload = getPayloadFromJwt(req);

	const conditions = {_id: req.params.id};
	const update = {$set: req.body};

	User
		.findOne({username: payload.username})
		.then(user => {
			const index = user.poems.findIndex(poem => req.params.id === poem);
			// stops the process if the user doesn't have acces to this specific poem or if it doesn't exist
			if(index === -1){
				const message = `poem not registered for user '${payload.username}'`;
				console.error(message);
				return res.status(422).send(message);
			}

			return Poem.findOneAndUpdate(conditions, update);
		})
		.then(() => res.status(204).end())
		.catch(err => {
			console.log(err);
			res.status(500).json({message: 'Internal Server Error'});
		});
});



module.exports = router;
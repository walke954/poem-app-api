const express = require('express');
const app = express();

const morgan = require('morgan');

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

mongoose.Promise = global.Promise;

const {JWT_SECRET, PORT, DATABASE_URL} = require('./config');
const {router: authRouter, localStrategy, jwtStrategy} = require('./auth');
const passport = require('passport');

const userRouter = require('./user/router');

app.use(express.static('public'));

app.use(morgan('common'));

app.use(bodyParser.urlencoded({
    extended: true
}));

passport.use(localStrategy);
passport.use(jwtStrategy);

// CORS
app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
	if (req.method === 'OPTIONS') {
		return res.send(204);
	}
	next();
});

const jwtAuth = passport.authenticate('jwt', {session: false});

app.use('/user', userRouter);
app.use('/auth', authRouter);

let server;

function runServer(databaseURL, port = PORT){
	return new Promise((resolve, reject) =>{
		mongoose.connect(databaseURL, err => {
			if(err){
				return reject(err);
			}

			server = app.listen(port, () => {
				console.log(`Your app is listening on Port: ${port}`);
				resolve();
			})
			.on('error', err => {
				mongoose.disconnect();
				reject(err);
			});
		});
	});
}

function closeServer(){
	return mongoose.disconnect().then(() => {
		return new Promise((resolve, reject) => {
			console.log('Closing Server');
			server.close(err => {
				if(err){
					reject(err);
					return;
				}
				resolve();
			});
		});
	});
}

if (require.main === module){
	runServer(DATABASE_URL).catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};
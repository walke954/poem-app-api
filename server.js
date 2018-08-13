const express = require('express');
const app = express();

const morgan = require('morgan');
const cors = require('cors');

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

mongoose.Promise = global.Promise;

const {JWT_SECRET, PORT, DATABASE_URL, CLIENT_ORIGIN} = require('./config');
const {router: authRouter, localStrategy, jwtStrategy} = require('./auth');
const passport = require('passport');

const userRouter = require('./user/router');
const poemRouter = require('./poem/router');

app.use(express.static('public'));

app.use(morgan('common'));

app.use(bodyParser.urlencoded({
    extended: true
}));

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use(
	cors({
		origin: CLIENT_ORIGIN
	})
);

app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/poem', poemRouter);

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
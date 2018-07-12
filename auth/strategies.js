const {Strategy: LocalStrategy} = require('passport-local');

const {Strategy: JwtStrategy, ExtractJwt} = require('passport-jwt');

const mongoose = require('mongoose');
const {User} = require('../user/models');
const {JWT_SECRET} = require('../config');

const localStrategy = new LocalStrategy((username, password, callback) => {
	let user;

	User
		.findOne({username: username})
		.then(_user => {
			user = _user;
			if(!user){
				return Promise.reject({
					reason: 'LoginError',
					message: 'invalid username or password'
				});
			}
			return user.passwordValidate(password);
		})
		.then(isValid => {
			if(!isValid){
				return Promise.reject({
					reason: 'LoginError',
					message: 'invalid username or password'
				});
			}
			return callback(null, user);
		})
		.catch(err => {
			if(err === 'LoginError'){
				return callback(null, false, err);
			}
			console.log(err);
			return callback(err, false);
		});
});

const jwtStrategy = new JwtStrategy(
	{
		secretOrKey: JWT_SECRET,
		jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
		algorithms: ['HS256']
	},
	(payload, done) => {
		done(null, payload.user);
	}
);

module.exports = {localStrategy, jwtStrategy};
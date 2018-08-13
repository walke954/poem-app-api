const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const {poemSchema} = require('../poem/models');

const userSchema = mongoose.Schema({
	username: {type: String, required: true, unique: true},
	password: {type: String, required: true},
	displayName: {type: String, required: true},
	date: {type: Date, required: true},
	poems: [{type: String}],
	likes: [{type: String}]
});

userSchema.methods.serialize = function(){
	return{
		id: this._id,
		username: this.username,
		displayName: this.displayName,
		date: this.date,
		likes: this.likes
	}
}

userSchema.methods.accountBasics = function(){
	return{
		id: this._id,
		username: this.username,
		displayName: this.displayName,
		date: this.date,
		poems: this.poems,
		likes: this.likes
	}
}

userSchema.methods.passwordValidate = function(password){
	return bcryptjs.compare(password, this.password);
}

userSchema.statics.hashPassword = function(password){
	return bcryptjs.hash(password, 12);
}

const User = mongoose.model('User', userSchema);

module.exports = {User};
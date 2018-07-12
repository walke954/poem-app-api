const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const commentSchema = mongoose.Schema({
	username: {type: String, required: true},
	content: {type: String},
	replies: [{
		username: {type: String, required: true},
		content: {type: String, required: true}
	}]
});

const poemSchema = mongoose.Schema({
	title: {type: String, required: true, trim: true},
	username: {type: String, required: true},
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	date: {type: Date, required: true},
	content: {type: String, required: true},
	likes: {type: Number, required: true},
	comments: [commentSchema]
});

poemSchema.methods.serialize = function(){
	return {
		username: this.username,
		firstName: this.firstName,
		lastName: this.lastName,
		date: this.date,
		poem: this.poem
	};
}

poemSchema.methods.getPoem = function(){
	return {
		poem: this.poem
	};
}

const Poem = mongoose.model('Poem', poemSchema);

module.exports = {Poem, poemSchema};
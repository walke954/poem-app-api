const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const commentSchema = mongoose.Schema({
	username: {type: String, required: true},
	displayName: {type: String, required: true},
	content: {type: String, required: true},
	date: {type: Date, required: true},
	replies: [{
		username: {type: String, required: true},
		displayName: {type: String, required: true},
		content: {type: String, required: true},
		date: {type: Date, required: true}
	}]
});

const poemSchema = mongoose.Schema({
	title: {type: String, required: true, trim: true},
	username: {type: String, required: true},
	displayName: {type: String, required: true},
	date: {type: Date, required: true},
	content: {type: String, required: true},
	likes: {type: Number, required: true},
	comments: [commentSchema]
});

poemSchema.methods.serialize = function(){
	return {
		id: this._id,
		title: this.title,
		date: this.date,
		content: this.content
	};
}

poemSchema.methods.listItem = function(){
	return {
		id: this._id,
		title: this.title,
		username: this.username,
		displayName: this.displayName,
		date: this.date,
		likes: this.likes,
		comments: this.comments.length
	};
}

const Poem = mongoose.model('Poem', poemSchema);

module.exports = {Poem, poemSchema};
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

var User = new Schema({
	user_id: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true,
	},
	user_pw: {
		type: String,
		required: true,
		trim: true,
	},
	user_name: {
		type: String,
		required: true,
		trim: true,
	},
	user_email: {
		type: String,
		required: true,
		trim: true,
		unique: true,
	},
	favorite: {
		type: [String],
	},
	role: {
		type: Number,
		required: true,
		default: 0,
	},
	salt: {
		type: String,
		required: true,
	},
	managing: {
		type: String,
	}
});

User.statics.create = async function (user_id, user_pw, user_name, user_email, role, managing) {
	const find_user = await this.findOne({ "user_id": user_id });
	if (find_user) {
		throw 'already user exists';
	}

	const salt = await bcrypt.genSalt(10);
	const hash = await bcrypt.hash(user_pw, salt);

	const user = new this({
		user_id: user_id,
		user_pw: hash,
		user_name: user_name,
		user_email: user_email,
		favorite: [],
		role: role,
		salt: salt,
		managing: managing
	});

	console.log('user 생성: ' + user_id);

	return user.save()
}

User.statics.delete = async function (user_id) {
	const user = await this.findOne({ "user_id": user_id });

	if (user) {
		return this.findOneAndDelete({ "user_id": user_id });
	} else {
		throw 'not exist user';
	}
}

User.statics.findUserById = async function (user_id) {
	const user = await this.findOne({ "user_id": user_id });

	if (user) {
		return user;
	} else {
		throw "not exist user";
	}
}

User.statics.changePw = async function (user_id, change_pw) {
	const user = await this.findOne({ "user_id": user_id });
	const hash = await bcrypt.hash(change_pw, user.salt);

	this.findOneAndUpdate({ "user_id": user_id }, {
		$set: {
			user_pw: hash
		}
	}, { new: true, useFindAndModify: false }, (err, doc) => {
		if (err) {
			throw "fail change password";
		}
	})
}

User.statics.loginCheck = async function (user_id, user_pw) {
	const user = await this.findOne({ "user_id": user_id });
	if (user === null)
		return null
	const result = await bcrypt.compare(user_pw, user.user_pw);
	if (result) {
		return user;
	}
	// (false) wrong password
	return result
}

User.statics.addFavor = async function (user_id, market_id) {
	const user = await this.findOne({ "user_id": user_id });
	if (user === null) throw "not exist user";

	// market_id를 통해 market_id 조회 후 없으면 throw
	var markets = user.favorite;
	markets.push(market_id);

	this.findOneAndUpdate({ "user_id": user_id }, {
		$set: {
			favorite: markets
		}
	}, { new: true, useFindAndModify: false }, (err, doc) => {
		if (err) {
			throw "fail add favorite";
		}
	})
}

User.statics.removeFavor = async function (user_id, market_id) {
	const user = await this.findOne({ "user_id": user_id });
	if (user === null) throw "not exist user";
	
	// market_id를 통해 market_id 조회 후 없으면 throw
	var markets = user.favorite;
	markets.remove(market_id);

	this.findOneAndUpdate({ "user_id": user_id }, {
		$set: {
			favorite: markets
		}
	}, { new: true, useFindAndModify: false }, (err, doc) => {
		if (err) {
			throw "fail remove favorite";
		}
	})
}

module.exports = mongoose.model('users', User);
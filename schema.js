const mongoose = require('mongoose').connect(process.env.MONGODB_URI);

const userSchema = mongoose.Schema({
  userId: String,
  teamId: String,
  user: String,
  list: Array
});

userSchema.methods.addToList = function addToList(params, cb) {
  return this.model('users').update({userId: params.userId}, {$push: {list: params.currency}});
}

exports.User = mongoose.model('users', userSchema);

const mongoose = require('mongoose').connect(process.env.MONGODB_URI);

const userSchema = mongoose.Schema({
  userId: String,
  teamId: String,
  user: String,
  list: Array
});
userSchema.methods.addToList = (cb) => {
  this.model('user').find({userId: })
}
exports.User = mongoose.model('user', userSchema);
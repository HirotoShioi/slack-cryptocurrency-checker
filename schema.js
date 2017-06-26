const mongoose = require('mongoose');
const fetchData = require('./fetch-data').fetchData;

const coinListURL = "https://www.cryptocompare.com/api/data/coinlist/";

const currencySchema = mongoose.Schema({
  createdAt: Date,
  currency: String,
});

const userSchema = mongoose.Schema({
  userId: String,
  teamId: String,
  user: String,
  currencyList: [currencySchema]
});

userSchema.methods.addToList = function addToList(user, currencyName, cb) {
  fetchData(coinListURL).then(coinList =>{
    const availableCoinList = Object.values(coinList.Data).map(data => { return data.Name });
    if(availableCoinList.includes(currencyName)){
      return this.model('users')
      .update({userId: user.userId},
              {userId:user.userId, teamId:user.teamId, user:user.user, $push: {currencyList: currencyName}},{upsert:true},cb);
    } else {
      console.log(cb);
    }
  });
}

exports.User = mongoose.model('users', userSchema);

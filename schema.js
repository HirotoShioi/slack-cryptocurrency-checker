const mongoose = require('mongoose').connect(process.env.MONGODB_URI);

const userSchema = mongoose.Schema({
  userId: String,
  teamId: String,
  user: String,
  list: Array
});

exports.User = mongoose.model('user', userSchema);
/*
2017-06-23T04:49:46.413170+00:00 app[web.1]: { _id: 594c9cab09b7145ee6f2ba31,
2017-06-23T04:49:46.413192+00:00 app[web.1]:   id: 'U5UT9HMHC',
2017-06-23T04:49:46.413193+00:00 app[web.1]:   team_id: 'T5TDDCZNC',
2017-06-23T04:49:46.413194+00:00 app[web.1]:   user: 'shioihigg',
2017-06-23T04:49:46.413195+00:00 app[web.1]:   access_token: 'xoxp-197455441760-198927599590-198182181394-d9a5b0159bd72459dd017886b6156f52',
2017-06-23T04:49:46.413196+00:00 app[web.1]:   scopes: [ 'identify', 'commands' ] }
*/
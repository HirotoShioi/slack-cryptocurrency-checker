var botkit = require('botkit');

var controller = botkit.slackbot({
  debug: false,
  json_file_store: './simple_storage/'
}).configureSlackApp({
  clientId: process.env.BOTKIT_SLACK_CLIENT_ID,
  clientSecret: process.env.BOTKIT_SLACK_CLIENT_SECRET,
  scopes: ['commands']
});

controller.setupWebserver(process.env.PORT, function(err, webserver) {
  controller.createWebhookEndpoints(controller.webserver);
  controller.createOauthEndpoints(controller.webserver, function(err, req, res) {
    if (err) {
      res.status(500).send('Error: ' + JSON.stringify(err));
    } else {
      res.send('Success');
    }
  });
});

controller.on('slash_command', function(bot, message) {
  switch (message.command) {
  case '/omikuji':
    if(message.text === "btc"){
      //lookup btc
      require('request')('http://api.coindesk.com/v1/bpi/currentprice.json',function(error,response,body){
          const bitcoinInformation = JSON.parse(body);
          bot.replyPrivate(message, '<@' + message.user + '> *' + "$" +bitcoinInformation.bpi.rate + '*');
      });
    }
    break;
  }
});

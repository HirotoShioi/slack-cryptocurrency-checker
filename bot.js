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
  console.log(message);
  switch (message.command) {
  case '/currency':
    let replyMessage = `Invalid currency please type in correct one (ex. btc, eth, etc)`;
    
    if(message.text.toUpperCase() === "BTC"){
      //lookup btc
      require('request')('https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=BTC,USD,EUR',function(error,response,body){
          const cryptoCurrencyInformation = JSON.parse(body);
          const { USD } = cryptoCurrencyInformation;
          bot.replyPrivate(message, '<@' + message.user + '> *' + "Current rate for the " + message.text.toUpperCase() + " is " + USD + '*');
      });
    } else {
        bot.replyPrivate(message, '<@' + message.user + '> *' +replyMessage+ '*');
    }

    break;
  }
});

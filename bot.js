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
  case '/omikuji':
    let replyMessage = `Hello ${message.user}`;

    if(message.text === "btc"){
      //lookup btc
      require('request')('http://api.coindesk.com/v1/bpi/currentprice.json',function(error,response,body){
          const bitcoinInformation = JSON.parse(body);
          const { chartName } = bitcoinInformation;
          const { code , rate } = bitcoinInformation.bpi.USD;
          bot.replyPrivate(message, '<@' + message.user + '> *' + "Current rate for the " + chartName + " is " + rate + code + '*');
      });
    } else {
        bot.replyPrivate(message, '<@' + message.user + '> *' +replyMessage+ '*');
    }

    break;
  }
});

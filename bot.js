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
    const currency = message.text.trim().toUpperCase();
    const apiURL = `https://min-api.cryptocompare.com/data/price?fsym=${currency}&tsyms=BTC,USD,EUR`;
    require('request')(apiURL,(error, response, body) => {
      if(error){
        const errorMessage = `Error with the api, please try again`;
        bot.replyPrivate(message, '<@' + message.user + '> *' +errorMessage+ '*');
      } else {
        currencyInformation = JSON.parse(body);
        const { USD } = currencyInformation;
        if(!USD){
          const replyObject = {
              "attachments": [
                  {
                      "fallback": "Invalid input, please type in correct currency - https://www.cryptocompare.com/",
                      "pretext": "Invalid currency",
                      "title": "Invalid currency",
                      "title_link": "https://www.cryptocompare.com/",
                      "text": "Currency was not found, please try again",
                      "color": "#cc0000"
                  }
              ]
          }
          bot.replyPrivate(message, replyObject);
        } else {
          bot.replyPrivate(message, '<@' + message.user + '> *' + "Current rate for the " + currency + " is $" + USD + '*');
        }
      }
    });
    break;
  }
});

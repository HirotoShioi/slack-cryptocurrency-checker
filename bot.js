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
          const errorReplyObject = {
              "attachments": [
                  {
                      "fallback": "Invalid input, please type in correct currency",
                      "pretext": "Invalid currency",
                      "title": "Crypto compare",
                      "text": "Currency was not found, please try again",
                      "color": "#cc0000"
                  }
              ]
          }
          bot.replyPrivate(message, errorReplyObject);
        } else {
          require('request')("https://www.cryptocompare.com/api/data/coinlist/",(error, response, body) => {
          
            const data = JSON.parse(body);
            const { ImageUrl } = data.Data[currency];
            console.log(data);
            const successReplyObject = {
                "attachments": [
                    {
                        "fallback": `Current rate for the ${currency} is $${USD} - https://www.cryptocompare.com/`,
                        "title": `Current rate for the ${currency} is $${USD}`,
                        "title_link": `https://www.cryptocompare.com/coins/${currency.toLowerCase()}/overview/USD`,
                        "text": `Check them on Cryptocompare`,
                        "thumb_url":`https://www.cryptocompare.com/${ImageUrl}`,
                        "color": "#3AA3E3"
                    }
                ]
            }
            bot.replyPrivate(message, successReplyObject);
          });
        }
      }
    });
    break;
  }
});

var botkit = require('botkit');
const Numeral = require('numeral');

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
    const apiURL = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${currency}&tsyms=USD`;
    require('request')(apiURL,(error, response, body) => {
      if(error){
        const errorMessage = `Error with the api, please try again`;
        bot.replyPrivate(message, '<@' + message.user + '> *' +errorMessage+ '*');
      } else {
        currencyInformation = JSON.parse(body);
        const { RAW } = currencyInformation;
        if(!RAW){
          const errorReplyObject = {
              "attachments": [
                  {
                      "fallback": "Invalid input, please type in correct currency",
                      "pretext": "Invalid currency",
                      "title": "Crypto search",
                      "text": "Currency was not found, please try again",
                      "color": "#cc0000"
                  }
              ]
          }
          bot.replyPrivate(message, errorReplyObject);
        } else {
          require('request')("https://www.cryptocompare.com/api/data/coinlist/",(error, response, body) => {      
            const data = JSON.parse(body);
            const { ImageUrl, CoinName } = data.Data[currency];
            const { HIGH24HOUR, LOW24HOUR, PRICE, CHANGE24HOUR } = RAW[currency].USD;
            const change = Math.floor(CHANGE24HOUR / PRICE * 10000) / 100;
            const changeColor = (change < 0) ? "#CC0000" : "#2ab27b";
            const successReplyObject = {
                "attachments": [
                    {
                      "author_name":CoinName,
                      "author_icon":`https://www.cryptocompare.com/${ImageUrl}`,
                      "fallback": `Current rate for the ${currency} is $${Numeral(PRICE).format('0,0.00')} - https://www.cryptocompare.com/`,
                      "title": `$${PRICE} (${change}%)`,
                      "title_link": `https://www.cryptocompare.com/coins/${currency.toLowerCase()}/overview/USD`,
                      "thumb_url":`https://www.cryptocompare.com/${ImageUrl}`,
                      "color": changeColor,
                      "fields": [
                          {
                              "title": "High",
                              "value": `$${Numeral(HIGH24HOUR).format('0,0.00')}`,
                              "short": true
                          },
                          {
                              "title": "Low",
                              "value": `$${Numeral(LOW24HOUR).format('0,0.00')}`,
                              "short": true
                          },
                      ],
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
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
            const { ImageUrl } = data.Data[currency];
            const { HIGH24HOUR, LOW24HOUR, PRICE } = RAW[currency].USD;
            const successReplyObject = {
                "attachments": [
                    {
                        "fallback": `Current rate for the ${currency} is $${PRICE} - https://www.cryptocompare.com/`,
                        "title": `Current rate for the ${currency} is $${PRICE}`,
                        "title_link": `https://www.cryptocompare.com/coins/${currency.toLowerCase()}/overview/USD`,
                        "text": `Check them on Cryptocompare`,
                        "thumb_url":`https://www.cryptocompare.com/${ImageUrl}`,
                        "color": "#3AA3E3",
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
// receive an interactive message, and reply with a message that will replace the original
controller.on('interactive_message_callback', function(bot, message) {

    // check message.actions and message.callback_id to see what action to take...
    console.log(message);
    bot.replyInteractive(message, {
        text: '...',
        attachments: [
            {
                title: 'My buttons',
                callback_id: '123',
                attachment_type: 'default',
            }
        ]
    });

});
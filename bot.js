const botkit = require('botkit');
const request = require('request');

const formatPrice = value => {
  return require('numeral')(value).format('0,0.00[00000]');
};

const sendErrorMessage = (bot, message) => {
    const errorReplyObject = {
        "attachments": [
            {
                "fallback": "Something went wrong with the",
                "pretext": "Check failed",
                "title": "Cryptocurrency checker",
                "text": "There was an error with CCC, please try again",
                "color": "#cc0000"
            }
        ]
    }
    bot.replyPrivate(message, errorReplyObject);
};
const fetchData = (url) => {
  const p = new Promise((resolve, reject) =>{
    request(url, (error, response, body) => {
      resolve(JSON.parse(body));
    });
  });
  return p;
};

async function showCurrencyList(bot, message){
  const apiURL = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC,ETH,ETC,XRP&tsyms=USD`;
  const coinListURL = "https://www.cryptocompare.com/api/data/coinlist/";
  const successReplyObject = {
    "attachments":[]
  };
  const currencyInformation = await fetchData(apiURL);
  const coinList = await fetchData(coinListURL);
  if(!currencyInformation.RAW || coinList.Response !== "Success"){
    sendErrorMessage(bot, message);
  } else {
    const { BTC, ETH, ETC, XRP }= currencyInformation.RAW;
    const currencyAry = [ BTC, ETH, ETC, XRP];
    currencyAry.forEach(currency => {
      const { HIGH24HOUR, LOW24HOUR, PRICE, CHANGE24HOUR, FROMSYMBOL } = currency.USD;
      const { ImageUrl, CoinName } = coinList.Data[FROMSYMBOL];
      const change = Math.floor(CHANGE24HOUR / PRICE * 10000) / 100;
      const changeColor = (change < 0) ? "#CC0000" : "#2ab27b";
      const success = {
        "author_name":CoinName,
        "author_icon":`https://www.cryptocompare.com/${ImageUrl}`,
        "fallback": `Current rate for the ${FROMSYMBOL} is $${formatPrice(PRICE)} - https://www.cryptocompare.com/`,
        "title": `$${formatPrice(PRICE)} (${change}%)`,
        "title_link": `https://www.cryptocompare.com/coins/${FROMSYMBOL.toLowerCase()}/overview/USD`,
        "thumb_url":`https://www.cryptocompare.com/${ImageUrl}`,
        "color": changeColor,
        "fields": [
            {
                "title": "High",
                "value": `$${formatPrice(HIGH24HOUR)}`,
                "short": true
            },
            {
                "title": "Low",
                "value": `$${formatPrice(LOW24HOUR)}`,
                "short": true
            },
        ],
      };
      successReplyObject.attachments.push(success);    
    });
    await bot.replyPrivate(message, successReplyObject);
  }
};

const searchCurrency = (currency, bot , message) => {
  const apiURL = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${currency}&tsyms=USD`;
  request(apiURL,(error, response, body) => {
    if(error){
      sendErrorMessage(bot, message);
    } else {
      currencyInformation = JSON.parse(body);
      const { RAW } = currencyInformation;
      if(!RAW){
        sendErrorMessage(bot, message);
      } else {
        request("https://www.cryptocompare.com/api/data/coinlist/",(error, response, body) => {      
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
                    "fallback": `Current rate for the ${currency} is $${formatPrice(PRICE)} - https://www.cryptocompare.com/`,
                    "title": `$${formatPrice(PRICE)} (${change}%)`,
                    "title_link": `https://www.cryptocompare.com/coins/${currency.toLowerCase()}/overview/USD`,
                    "thumb_url":`https://www.cryptocompare.com/${ImageUrl}`,
                    "color": changeColor,
                    "fields": [
                        {
                            "title": "High",
                            "value": `$${formatPrice(HIGH24HOUR)}`,
                            "short": true
                        },
                        {
                            "title": "Low",
                            "value": `$${formatPrice(LOW24HOUR)}`,
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
}

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
  case '/ccc':
    const [ command ] = message.text.trim().split(" ");
    if(command === "list"){
      showCurrencyList(bot, message);
    } else {
      searchCurrency(command.toUpperCase(), bot ,message);
    }
    break;
  }
});
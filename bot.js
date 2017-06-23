const botkit = require('botkit');
const mongoose = require('mongoose').connect(process.env.MONGODB_URI);
const User = require('./schema').User;

// Format currency price
const formatPrice = (value, exchange) => {
  const formatNumber = require('numeral')(value).format('0,0.00[00000]');
  return (exchange === "USD") ? `$${formatNumber}` : `${formatNumber}${exchange}`;
};
// Fetch data from external api
const fetchData = url => {
  const result = new Promise((resolve, reject) =>{
    require('request')(url, (error, response, body) => {
      if(!error){
        resolve(JSON.parse(body));
      } else {
        reject(JSON.parse(error));
      }
    });
  });
  return result;
};

// Create error message attachment
const createErrorMessage = ( message = "Invalid command. Please try again" ) => {
  const errorReplyObject = {
    "attachments": [
      {
          "fallback": "Something went wrong",
          "pretext": "Check failed",
          "title": "Cryptocurrency checker",
          "text": message,
          "color": "#cc0000"
      }
    ]
  }
  return errorReplyObject;
};

// Filter out coins that are not available on coinlist API
const filterCoins = (currencies = [], exchange = "USD", coinList = {}) => {
  const filteredCurrency = currencies.filter(c => {
    const availableCoinList = Object.values(coinList.Data).map(data => { return data.Name});
    return (c !== exchange || availableCoinList.includes(c));
  });
  return filteredCurrency;
}

// Create success message attachment
const createAttachmentObject = (currency, exchange = "USD", coinList = {}) => {
  const rising = "#2ab27b";
  const falling = "#cc0000";
  const { HIGH24HOUR, LOW24HOUR, PRICE, CHANGE24HOUR, FROMSYMBOL } = currency[exchange];
  const { ImageUrl, CoinName } = coinList.Data[FROMSYMBOL];
  const changeRate = Math.floor(CHANGE24HOUR / PRICE * 10000) / 100;
  const changeColor = (changeRate < 0) ? falling : rising;
  const attachmentObj = {
    "author_name":CoinName,
    "author_icon":`https://www.cryptocompare.com/${ImageUrl}`,
    "fallback": `Current rate for the ${FROMSYMBOL} is ${formatPrice(PRICE, exchange)} - https://www.cryptocompare.com/`,
    "title": `${formatPrice(PRICE, exchange)} (${changeRate}%)`,
    "title_link": `https://www.cryptocompare.com/coins/${FROMSYMBOL.toLowerCase()}/overview/USD`,
    "thumb_url":`https://www.cryptocompare.com/${ImageUrl}`,
    "color": changeColor,
    "fields": [
        {
            "title": "High",
            "value": `${formatPrice(HIGH24HOUR, exchange)}`,
            "short": true
        },
        {
            "title": "Low",
            "value": `${formatPrice(LOW24HOUR, exchange)}`,
            "short": true
        },
    ],
  };
  return attachmentObj;
};

// Search currency depending on the user's message
async function searchCurrency(message){
  if(message.text.trim().split(" ").length >= 3) {
    return createErrorMessage();
  }
  const [ command, selectedExchanges ] = message.text.trim().split(" ");
  const exchange = (selectedExchanges) ? selectedExchanges.toUpperCase() : "USD";
  const currencies = (command === "list" || command === "") ? ["BTC", "ETH", "ETC", "XRP", "DASH"] : command.toUpperCase().split(",");
  const coinListURL = "https://www.cryptocompare.com/api/data/coinlist/";
  const replyObject = {
    "attachments":[
      {
        "title":"Cryptocurrency Checker",
        "color": "#4d90fe"
      }
    ]
  };
  const coinList = await fetchData(coinListURL);
  currencyQuery = filterCoins(currencies, exchange, coinList);
  const dataURL = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${currencyQuery.join(",")}&tsyms=${exchange}`;
  const currencyInformation = await fetchData(dataURL);
  if(!currencyInformation.RAW || coinList.Response !== "Success"){
    return createErrorMessage();
  } else {
    const currencyAry = Object.values(currencyInformation.RAW);
    currencyAry.forEach(curr => {
      if(!curr) {
        return createErrorMessage();
      } else {
       const attachmentObj = createAttachmentObject(curr, exchange, coinList);
       replyObject.attachments.push(attachmentObj);
      }
    });
    return replyObject;
  }
};

// Botkit thing
const controller = botkit.slackbot({
  debug: false,
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
    searchCurrency(message).then(reply => {
      bot.replyPrivate(message, reply);
    });
    break;
  }
});
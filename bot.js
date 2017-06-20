const botkit = require('botkit');
const request = require('request');

const formatPrice = (value, exchange) => {
  const formatNumber = require('numeral')(value).format('0,0.00[00000]');
  return (exchange === "USD") ? `$${formatNumber}` : `${formatNumber}${exchange}`;
};

const fetchData = (url) => {
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

const sendErrorMessage = (bot, message) => {
  const errorReplyObject = {
    "attachments": [
      {
          "fallback": "Something went wrong",
          "pretext": "Check failed",
          "title": "Cryptocurrency checker",
          "text": "Invalid command. Please try again",
          "color": "#cc0000"
      }
    ]
  }
  bot.replyPrivate(message, errorReplyObject);
};

const createAttachmentObject = (currency, coinList, exchange) => {
  const rising = "#2ab27b";
  const falling = "#cc0000";
  const { HIGH24HOUR, LOW24HOUR, PRICE, CHANGE24HOUR, FROMSYMBOL } = currency[exchange];
  const { ImageUrl, CoinName } = coinList.Data[FROMSYMBOL];
  const change = Math.floor(CHANGE24HOUR / PRICE * 10000) / 100;
  const changeColor = (change < 0) ? falling : rising;
  const attachmentObj = {
    "author_name":CoinName,
    "author_icon":`https://www.cryptocompare.com/${ImageUrl}`,
    "fallback": `Current rate for the ${FROMSYMBOL} is ${formatPrice(PRICE, exchange)} - https://www.cryptocompare.com/`,
    "title": `${formatPrice(PRICE, exchange)} (${change}%)`,
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

async function showCurrency(bot, message){
  if(message.text.trim().split(" ").length >= 3) {
    sendErrorMessage(bot, message);
  }
  const [ command, exchanges ] = message.text.trim().split(" ");
  let apiURL = "";
  let exchange = (exchanges) ? exchanges.toUpperCase() : "USD";
  const coinListURL = "https://www.cryptocompare.com/api/data/coinlist/";
  const successReplyObject = {
    "attachments":[
      {
        "title":"Cryptocurrency Checker",
        "color": "#4d90fe"
      }
    ]
  };
  //Need refactoring!!
  if(command === "list" || command === ""){
    let currencies = ["BTC", "ETH", "ETC", "XRP", "DASH"].filter(c => {
      return (c !== exchange);
    });
    apiURL = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${currencies.join(",")}&tsyms=${exchange}`;
  } else {
    let queryCurrencyList = command.toUpperCase().split(",").filter(c => {
      return (c !== exchange);
    });
    apiURL = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${queryCurrencyList.join(",")}&tsyms=${exchange}`;
  }
  const currencyInformation = await fetchData(apiURL);
  const coinList = await fetchData(coinListURL);
  if(!currencyInformation.RAW || coinList.Response !== "Success"){
    sendErrorMessage(bot, message);
  } else {
    const currencyAry = Object.values(currencyInformation.RAW);
    currencyAry.forEach(curr => {
      if(!curr) {
        sendErrorMessage(bot, message);
      } else {
       const attachmentObj = createAttachmentObject(curr, coinList, exchange);
       successReplyObject.attachments.push(attachmentObj);       
      }
    });
    await bot.replyPrivate(message, successReplyObject);
  }
};

const controller = botkit.slackbot({
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
    showCurrency(bot ,message);
    break;
  }
});
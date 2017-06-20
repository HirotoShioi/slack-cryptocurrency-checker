const botkit = require('botkit');
const request = require('request');

const formatPrice = value => {
  return require('numeral')(value).format('0,0.00[00000]');
};

const fetchData = (url) => {
  const result = new Promise((resolve, reject) =>{
    require('request')(url, (error, response, body) => {
      if (body){
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

const createAttachmentObject = (currency, coinList) => {
  const { HIGH24HOUR, LOW24HOUR, PRICE, CHANGE24HOUR, FROMSYMBOL } = currency.USD;
  const { ImageUrl, CoinName } = coinList.Data[FROMSYMBOL];
  const change = Math.floor(CHANGE24HOUR / PRICE * 10000) / 100;
  const changeColor = (change < 0) ? "#CC0000" : "#2ab27b";
  const attachmentObj = {
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
  return attachmentObj;
};

async function showCurrency(bot, message){
  const command = message.text.trim();
  let apiURL = "";
  const coinListURL = "https://www.cryptocompare.com/api/data/coinlist/";
  const successReplyObject = {
    "attachments":[
      {
        "title":"Cryptocurrency Checker",
        "color": "#224F8A"
      }
    ]
  };

  if(command === "list" || command === ""){
    const currencies = ["BTC", "ETH", "ETC", "XRP", "DASH"];
    apiURL = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC,ETH,ETC,XRP,DASH&tsyms=USD`;
  } else {
    let currency = command.toUpperCase();
    apiURL = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${currency}&tsyms=USD`;
  }
  const currencyInformation = await fetchData(apiURL);
  const coinList = await fetchData(coinListURL);
  if(!currencyInformation.RAW || coinList.Response !== "Success"){
    sendErrorMessage(bot, message);
  } else {
    const currencyAry = Object.values(currencyInformation.RAW);
    currencyAry.forEach(curr => {
      if(!curr.USD) {
        sendErrorMessage(bot, message);
      } else {
       const attachmentObj = createAttachmentObject(curr, coinList);
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
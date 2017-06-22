# slack-cryptocurrency-checker

## Description
This is slack integration application for checking cryptocurrency price changes

## Installation
Currently this is still in development so I've not yet distributed the application.

## Commands
`/ccc list` : List 5 major currencies's (BTC, ETH, ETC, XRP, DASH) price.

`/ccc <currency_name>`: Outputs `currency_name`'s description. It could take multiple currencies at once using commas (i.e. `/ccc btc,eth,etc`).

`/ccc <currency_name> <exchange>`: Outputs `currency_name`'s description in `<exchange>` (i.e. `/ccc btc eth` will show BTC price in ether)

## Requirements
- Node version 8.1
- Hosting server(I've used heroku)
- Credentials needed in order to use Slack app(ClientID, Client secret, TZ);

## Future development
Customize list so that each user can have their own list of currencies they want to show when they type `/ccc list`. For example if user types `/ccc add DOGE`, it will display dogecoin when they type `/ccc list`.

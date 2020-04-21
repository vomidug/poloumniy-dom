var TelegramBot = require('node-telegram-bot-api');
var config = require('./config.json')

const token = config.telegramToken

var bot = new TelegramBot(token, {polling: true})

var express=require('express')
var app=express();

const boss = 1823380

const PORT = process.env.port || 16682

const axios = require('axios');

function log(text){
	console.log(text)
	bot.sendMessage(boss, text)
} 

app.post('/message', (req, res) => {
	bot.sendMessage(boss, req.body.data)
})

bot.onText(/\/status/, (msg) => {

	//axios.get('localhost:16681:/api/db/listAll')

})

bot.onText(/\/testDB/, (msg) => {

	axios.get('localhost:16681:/api/db/test').then( (res) => {
	
		log('Res: ' + res)

	}).catch( (e) => {

		log('E: ' + e)

	} )

})

app.listen(PORT, () => {
	log(`App is listening on port ${PORT}`)
})

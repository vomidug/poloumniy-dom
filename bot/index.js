var TelegramBot = require('node-telegram-bot-api');
var config = require('./config.json')

const token = config.telegramToken

var bot = new TelegramBot(token, {polling: true})

var express=require('express')
var app=express();

var bodyParser = require('body-parser')
app.use(bodyParser.json())


const boss = 1823380

const PORT = process.env.port || 16682

const axios = require('axios');

function log(text){
	console.log(text)
	bot.sendMessage(boss, text)
} 

app.post('/message', (req, res) => {

	bot.sendMessage(boss, 'A message from ' + req.body.from + '\n' + req.body.data)

})

bot.onText(/\/testConnection/, (msg) => {

	axios({
		url:'http://newhouse_api_1:16681/api/conn/test/',
		method:'get'
	}).then( (res) => {

		log('Testing connection: ' + res)

	} ).catch( (e) => {
		log('E: ' + e)
		throw e
	} )

} )

bot.onText(/\/status/, (msg) => {

	//axios.get('localhost:16681:/api/db/listAll')

})

bot.onText(/\/testDB/, (msg) => {

	axios.get('http://newhouse_api_1:16681/api/db/test/').then( (res) => {

		if(res.status === 200){
			bot.sendMessage(boss, 'Mongo feels ok')
		} else {
			bot.sendMessage(boss, 'Mongo doesn\'t feel ok, it responsed ' + res.status)
		}
	}).catch( (e) => {

		log('E: ' + e)
		throw(e)

	} )

})

bot.on('polling_error', (err) => {log("Polling: " + err)})

app.listen(PORT, () => {
	log(`Bot is listening on port ${PORT}`)
})

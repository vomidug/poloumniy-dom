var TelegramBot = require('node-telegram-bot-api');
var config = require('./config.json')

const token = config.telegramToken

var bot = new TelegramBot(token, {polling: true})

var express=require('express')
var app=express();

var bodyParser = require('body-parser')
app.use(bodyParser.json())

const boss = 1823380

const PORT = process.env.port || 3000

const axios = require('axios');

function log(text){
	console.log(text)
	bot.sendMessage(boss, text)
} 

function get(url, params){
        return axios({
                method:"GET",
                url:url,
                params:params
        })
}

function post(url, data){
        return axios({
                method:"POST",
                url:url,
                data:data
        })
}

app.post('/message', (req, res) => {
	bot.sendMessage(boss, 'A message from ' + req.body.from + '\n' + req.body.data)
	res.sendStatus(200)
})

app.post('/api/bot/update', (req, res) => {
	bot.sendMessage(boss, `${req.body.name} got back online!\nIP: ${req.body.ip}\nDate:${req.body.date}`)
	res.sendStatus(200);
})

app.post('/api/bot/register', (req, res) => {
	bot.sendMessage(boss, `New device: ${req.body.name}\nIP: ${req.body.ip}\nDate:${req.body.date}`)
	res.sendStatus(200)
})

bot.onText(/\/testConnection/, (msg) => {

	axios({
		url:'http://api:3000/api/conn/test/',
		method:'get'
	}).then( (res) => {

		log('Testing connection: ' + res)

	} ).catch( (e) => {
		log('E: ' + e)
		throw e
	} )

} )

bot.onText(/\/testSomeShit/, ( msg ) => {

	axios({
		method:'post',
		url:'http://api:3000/api/register',
		data:{
			id:'Someshit'
		}
	})
		.then(( res ) => {
		if(res.status === 200){
			log('Successfully tested to register someShit')
		}
	})
		.catch( (err) => {
			log('Unable to test registering someShit, throwing ' + err )
			throw err;
		} )

 
})

bot.onText(/\/testArch/, ( msg ) => {

	axios({
		method:'post',
		url:'http://api:3000/api/register',
		data:{
			id:'Archlinux'
		}
	})
		.then(( res ) => {
		if(res.status === 200){
			log('Successfully tested to register Archlinux')
		}
	})
		.catch( (err) => {
			log('Unable to test registering Archlinux, throwing ' + err )
			throw err;
		} )

 
})

bot.onText(/\/status/, (msg) => {

	axios.get('http://api:3000/api/db/getAll')
		.then( (res) => {
			log('Successfully got a response of getAll: ' + JSON.stringify(res.data))

			var resString = ''
			
			for (i of res.data) {

				i.date = new Date(i.date)

				i.dateStr = `${i.date.getHours()+1}:${i.date.getMinutes()+1}:${i.date.getSeconds()+1} ${i.date.getDate()}.${i.date.getMonth()+1}.${i.date.getFullYear()}`

				resString = resString + 
					`${i.name}: ${i.status}\n` + 
					`Last Auth: ${i.dateStr}\n` +
					`IP: ${i.ip}\n\n`
			}

			bot.sendMessage(boss, resString)

	})
		.catch( (err) => {
			log('Unable to perform GET-request to getAll, throwing ' + err)
			throw err
		} )

})

bot.onText(/\/testDB/, (msg) => {

	axios.get('http://api:3000/api/db/test/').then( (res) => {

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

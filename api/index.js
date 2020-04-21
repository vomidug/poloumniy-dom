var express = require('express')
var mongo = require('mongodb').MongoClient;
const config = require('./config.json')
const mongoUri = config.mongoUri;
var axios = require('axios')

mongoclient = new mongo(mongoUri, {useNewUrlParser: true, useUnifiedTopology:true})

const PORT = process.env.port || 16681

var app = express();

function connect() {
	return new Promise( (res, rej) => {
		mongoclient.connect((err, cli) => {
			if(err) {
				rej(err)
				throw err;
			} else {
				res(cli)
			}
		})
	} )
}

function log(text){

	console.log(text)
	axios({
		method: 'post',
		url: 'http://newhouse_bot_1:16682/message/',
		data: {
			message:text
		}
	}).then( (res) => {
		console.log('Successfully sent a message: ' + text)
	} ).catch( (e) => {
		console.log('E: Unable to send a message: ' + text)
		console.log('E: Throwing ' + e)
		throw e
	} )
}

app.get('/api/db/test', (req, res) => {
	connect()
		.then( (cli) => {
			console.log('MongoDB is connected')
			res.sendStatus(200)
		} )
		.catch( (e) => {
			console.log('E', e)
			res.sendStatus(500)
		})
})

app.listen( PORT, () => {
	log('Api is listening on port ' + PORT)
} )

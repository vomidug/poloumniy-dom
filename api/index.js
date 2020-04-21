var express = require('express')
var mongo = require('mongodb').MongoClient;
const config = require(''./config.json')
const mongoUri = config.mongoUri;

mongoclient = new mongo(mongoUri, {useNewUrlParser: true, useUnifiedTopology:true})

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

app.get('api/db/test', (req, res) => {
	connect()
		.then( (cli) => {
			console.log('MongoDB is connected')
			res.sendStatus(200)
		} )
		.catch(e) {
			console.log('E', e)
			res.sendStatus(500)
		}
})

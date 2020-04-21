var express = require('express')
var mongo = require('mongodb').MongoClient;
const config = require('./config.json')

const mongoUri = config.mongoUri;

var axios = require('axios')

mongoclient = new mongo(mongoUri, {useNewUrlParser: true, useUnifiedTopology:true})

const PORT = process.env.port || 16681

var app = express();

var bodyParser = require('body-parser')
app.use(bodyParser.json())

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
		url: 'http://bot:16682/message/',
		data: {
			from:'api',
			data:text
		}
	}).then( (res) => {
		console.log('Successfully sent a message: ' + text)
	} ).catch( (e) => {
		console.log('E: Unable to send a message: ' + text)
		console.log('E: Throwing ' + e)
		throw e
	} )
}


function register(device, ip){

	var date = new Date()

	date.setHours(18)

	connect().then( (cli) => {

		cli.db('house').collection('devices').updateOne({
			name:device
		},{ 
			$set: {
				status:'Online',
				lastauth:date
			}
		},{
			upsert:true
		})

		return cli

	})	
	
	.then( (cli) => {
		cli.close( () => {
			log('Closing connection after trying to update a ' + device)
		})
	}).catch( (err) => {
		log('Unable to connect to Mongo, throwing' + err)
		throw err
	})

	.then(() => { 
		axios({
			method:'post',
			url:'http://bot/registered/',
			data:{device, ip, date}
		}).then( (res) => {
			if(res === 200) {
				log('Successfully registered ' + device + ' with ' + ip + ' at ' + date) 
			} else{
				log('Res is not 200, it is ' + res + ', please, check.')
			}
		}).catch( (err) => {
			log('Unable to register ' + device + ' with ' + ip + ' at ' + date + '\n Throwing ' + err)
			throw err
		})
	})

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

app.post('/api/register/', (req, res) => {
	
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

	log(JSON.stringify(req.body))

	register(req.body.id, ip)

	res.sendStatus(200)

})

app.listen( PORT, () => {
	log('Api is listening on port ' + PORT)
} )

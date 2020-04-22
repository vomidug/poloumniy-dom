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

	date.setHours(date.getHours()+3)

	var dateStr = `${date.getHours()+1}:${date.getMinutes()+1}:${date.getSeconds()+1} ${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}`

	connect().then( (cli) => {

		cli.db('house').collection('devices').updateOne({
			name:device
		},{ 
			$set: {
				status:'Online',
				lastauth:dateStr,
				ip:ip
			}
		},{
			upsert:true
		})
		.then( () => {
			log('Updating ' + device + 'is successful')
		}).catch( (err) => {
			log('Unable to insert, throwing ' + err )
			throw err
		})

		return cli 
	})	

	.catch( (err) => {
		log('Unable to connect to Mongo, throwing' + err)
		throw err
	})

	.then( (cli) => {
		cli.close( () => {
			log('Closing connection after trying to update a ' + device)
		})
	})
	
		
	.then(() => { 
		axios({
			method:'post',
			url:'http://bot:16682/registered/',
			data:{device, ip, date}
		}).then( (res) => {
			if(res.status === 200) {
				log('Successfully registered ' + device + ' with ' + ip + ' at ' + date) 
			} else{
				log('Res is not 200, it is ' + res.status + ', please, check.')
			}
		}).catch( (err) => {
			log('Unable to register ' + device + ' with ' + ip + ' at ' + date + '\n Throwing ' + err)
			throw err
		})
	})

}

app.get('/api/db/getAll', (req, res) => {

	connect().
		then( (cli) => {
			cli.db('house').collection('devices').find().toArray()
				.then( (resp) => {
					res.send(resp)
				} )
				.catch( (err) => {
					log('Unable to query a db, throwing ' + err)
					throw err
				} )
		} )

})

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

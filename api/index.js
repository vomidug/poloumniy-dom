var express = require('express')
var mongo = require('mongodb').MongoClient;
const config = require('./config.json')

const mongoUri = config.mongoUri;

var axios = require('axios')

mongoclient = new mongo(mongoUri, {useNewUrlParser: true, useUnifiedTopology:true})

const PORT = process.env.port || 3000

var app = express();

var bodyParser = require('body-parser')
app.use(bodyParser.json())

function connect() {
	return new Promise( (res, rej) => {
		
		new mongo(mongoUri, {useNewUrlParser: true, useUnifiedTopology:true}).connect().then( (cli) => {
			res(cli)
		} ).catch( (err) => {
			log('Unable to establish connection, throwing ' + err)
			throw err
			rej(err)
		} )

	} )
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

function log(text){

	console.log(text)
	
	axios({
		method: 'post',
		url: 'http://bot:3000/message/',
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

function checkExistance(device){

	log('Checking existance of ' + device.name)

	return connect()
		.then( (cli) => {

			return cli.db("house").collection('devices').findOne( {
				name:device.name
			} )
			
				.then ( (res) => {

					if(res) {
						log(device.name + " exists")
						return true;
					} else {
						log(device.name + " does not exist")
						return false;
					}

				} )
				.catch( (e) => {
					console.log(e)
					throw (e)
				} )
		} )
}

function checkOnline(device) {

	var minutesCount = 2;

	log('Trying to check if ' + device.name + ' is online' )
	return connect()
		.then( (cli) => {
		
			return cli.db('house').collection('devices').findOne( {
				name:device.name
			} )
				.then( (res) => {

					curdate = Date.now();

					deviceDate = device.date.getTime();

					console.log(curdate)
					console.log(deviceDate)

					if ( curdate - 1000 * 60 * minutesCount < deviceDate) {
						log(device.name + ' is online')
						return true;
					}
					else {
						log(device.name + ' is not online')
						return false;
					}
									
				} )
				.catch( (err) => {
					log('Unable to perform a query to find ' + device + ', throwing ' + err)
					throw err
				} )
		} )
		.catch( (err) => {
			log('Unable to check ' + device + ', throwing ' + err)
			throw(err)
		} )
	
}

function register(device){
	
	log('Registering/updating ' + device.name)

	return connect().then( (cli) => {

		return cli.db('house').collection('devices').updateOne({
			name:device.name
		},{ 
			$set: {
				status:"Online",
				date:device.date,
				ip:device.ip
			}
		},{
			upsert:true
		})

		.then( () => {
			cli.close( () => {
				log('Closing connection after trying to update a ' + device.name)
			} )
		})

	})	
	.catch( (err) => {
		log('Unable to connect to Mongo, throwing' + err)
		return false;
	})

}

app.get('/api/db/getAll', (req, res) => {

	connect()
		.then( (cli) => {

			return cli.db('house').collection('devices').find().toArray()
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

	date = new Date()
	date.setHours(date.getHours()+3)

	var device = {
		name:req.body.id,
		date:date,
		ip:ip
	}

	// I definetely need some comments in here
	checkExistance(device)
		.then( (result) => {

			// checkExistance returns us if it exists or not
			// So if it does not (!result), we register it 
			if (!result) {
				register(device).then( (result) => {
					post('/api/bot/register', device)
					res.sendStatus(201)
				} )
			} else {

			// If it exists => we're checking if it is online

				checkOnline(device)
					.then( (result) => {
					
						// It is not - updating it and sending a message, that it got back online
						if (!result){
							register(device).then( () => {
								res.sendStatus(202)
								post('/api/bot/update', device);
							} )

						// If it is - updating it without messaging anything
						} else {
							register(device).then( () => {
								res.sendStatus(200)
							} )
						}

					} )

			}
		} )

})

app.listen( PORT, () => {
	log('Api is listening on port ' + PORT)
} )

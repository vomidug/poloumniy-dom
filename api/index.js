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


function checkExistance(device) {

		log('Trying to check ' + device.name )
			connect()
				.then( (cli) => {
			
					return cli.db('house').collection('devices').findOne( {

						name:device.name
					} )
						.then( (res) => {
						
							if(res) {
								log(device.name + ' exists')

								return false
							}
							else {
								log(device.name + ' doesn\'t exist')
								return true
							}
						} )
						.catch( (err) => {
							log('Unable to perform a query to find ' + device + ', throwing ' + err)
							throw err
						} )
				} )
				.catch( (err) => {
					log('Unable to check ' + device + ', throwing ' + err)
				} )

	return false
	
}
function register(device){
	
	connect().then( (cli) => {

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
			})
		})
	
	})	

	.catch( (err) => {
		log('Unable to connect to Mongo, throwing' + err)
	})

	.then(() => { 
		axios({
			method:'post',
			url:'http://bot:3000/registered/',
			data:device
		}).then( (res) => {
			if(res.status === 200) {

				log('Successfully registered ' + device.name + ' with ' + device.ip + ' at ' + device.date) 

			} else{
				log('Res is not 200, it is ' + res.status + ', please, check.')
			}
		}).catch( (err) => {
			log('Unable to register ' + device.name + ' with ' + device.ip + ' at ' + device.date + '\n Throwing ' + err)
			throw err
		})
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

	register(device)

	res.sendStatus(200)

})

app.listen( PORT, () => {
	log('Api is listening on port ' + PORT)
} )

const websocket 	= require('ws');
const request 		= require('request');
const queue 		= require('apiqueue');
const empty 		= x => true;

class CSGOTM {
	constructor(opts) {
		if (typeof opts === 'string') this.apikey = opts; else this.apikey = opts.apikey;
		if (!opts && !opts.apikey) throw new Error('Specify your API KEY');		
		this.q = new queue({interval: 250, name: "csgo.tm api calls"});
	}

	get api() {
		let self = this;
		return {
			call: function(data, callback = empty) {
				let f = function () {
					request(self.api.url.build(data), function (err, response, body) {
						if (err) return callback(err);
						if (response.statusCode != 200) return callback(response.statusCode);
						let data = JSON.parse(body);
						if (data.error) return callback(data.error);
						callback(null, data);
					})
				};
				self.q.addTask(f);
			},
			url: {
				base: 'https://market.csgo.com/api/',
				build (method) {
					return this.base + method + '/?key=' + self.apikey;
				}
			}
		}
	}

	get socket() {
		let self = this;
		return {
			connect: function () {
				self.ws = new websocket('wss://wsn.dota2.net/wsn/');
				self.ws.onopen = function() { 
					self.emit('connected');
					self.api.call('PingPong');
				}
				self.ws.on('message', function (message) {
					try {
						message = JSON.parse(message);
						self.emit(message.type, JSON.parse(message.data));
					} catch (e) {
						console.error('Cant parse JSON from message: ' + message);
					}
				});
				setInterval(this.ping, 60 * 1000);
			},
			auth: function (callback) {
				request.post({url: 'https://market.csgo.com/api/GetWSAuth/?key=' + self.apikey, json: true}, function (err, res, body) {
					if (err) return callback(err); 
					if (res.statusCode != 200) return callback('Wrong HTTP code when trying to auth');
					if (body.error) return callback(body.error);
					let auth = body.wsAuth;
					self.ws.send(auth);
					callback();
				})
			},
			subscribe: function(channel, handler) {
				this.send(channel);
			},
			send: function(data) {
				self.ws.send(data);
			},
			ping: function() {
				self.ws.send('ping');
			}
		}
	}
}

require('util').inherits(CSGOTM, require('events').EventEmitter);

module.exports = CSGOTM;
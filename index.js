const websocket 	= require('ws');
const request 		= require('request');

class CSGOTM {
	constructor(opts) {
		if (typeof opts === 'string') return this.apikey = opts;
		if (!opts.apikey) throw new Error('Specify your API KEY');
		this.apikey = opts.apikey;
	}

	get socket() {
		let self = this;
		return {
			connect: function () {
				self.ws = new websocket('wss://wsn.dota2.net/wsn/');
				self.ws.onopen = x => self.emit('connected');
				self.ws.on('message', function (message) {
					message = JSON.parse(message);
					self.emit(message.type, message.data);
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
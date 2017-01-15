const CSGOTM = require('./index.js'); //change to 'csgotm'
const APIKEY = 'xxx'; //insert your csgotm apikey

let market = new CSGOTM(APIKEY);
market.socket.connect();

market.on('connected', function() {
	console.log('Connected to websocket');
	market.socket.auth(function (err) {
		if (err) return console.error(err);
		console.log('Authorization successful');
		market.socket.subscribe('newitems_go');
	});
});

market.on('newitems_go', function (item) {
	console.log(item);
});

market.api.call('GetMoney', function (err, balance) {
	if (err) return console.error(err);
	console.log('Account balance: ' + (balance.money/100) + ' RUB')
})
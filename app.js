

/**
 * Module dependencies.
 */

var express = require('express')
	, routes = require('./routes')
	, io = require('socket.io')
	, redis = require('redis');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
	app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

app.listen(3000, function(){
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

// controls channel ids and queues
var rmaster = redis.createClient();
rmaster.set('chanID', 0);

var sio = io.listen(app);

sio.on('connection', function(client) {

	client.on('declare', function(team) {
		console.log('someone declared ' + team);

		var otherteam = (team === 'r') ? 'd' : 'r';
		
		rmaster.rpop(otherteam+'queue', function(err, partner) {
			console.log('partner is ' + partner);
			if (partner === null) {
				var queue = team + 'queue';
				enqueue(client.id, queue);
			}
			else {
				console.log('match found');
				rmaster.get('chanID', function(err, res) {
					var chan = 'chan' + res;
					readyClient(sio.sockets.sockets[partner], chan);
					readyClient(client, chan);
					rmaster.incr('chanID');
				});
			}
		});
	});

});

function enqueue(client, queue) {
	console.log('new one in ' + queue);
	rmaster.lpush(queue, client);
}


function readyClient(client, chan) {
	client.listener = redis.createClient();
	client.listener.subscribe(chan);

	client.listener.on('message', function(chan, msg) {
		console.log(msg);
		client.send(msg);
	});
	

	client.speaker = redis.createClient();

	client.on('message', function(msg) {
		console.log(JSON.stringify(msg));
		client.speaker.publish(chan, JSON.stringify(msg));
	});

	client.emit('readyForChat');

}


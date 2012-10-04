

/**
 * Module dependencies.
 */

var express = require('express')
	, routes = require('./routes')
	, io = require('socket.io')
        , redis = require('redis')
        , cf = require('./cloudfoundry');

var redis_host =  cf.redis?cf.redis.credentials.host:'localhost';
var redis_port = cf.redis?cf.redis.credentials.port:6379;
var redis_password = cf.redis?cf.redis.credentials.password:undefined;


console.log(redis_host);
console.log(redis_port);
console.log(redis_password);

// controls channel ids and queues

var rmaster = redis.createClient(redis_port, redis_host);
if(cf.runningInTheCloud) {
    rmaster.auth(redis_password);
}


// next available channel id
rmaster.set('chanID', 0);

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



// Socket.io mess



var sio = io.listen(app);

sio.set("transports", [
    "xhr-polling"
]);

sio.on('connection', function(client) {

	// signal sent when client 'votes' in browser
	client.on('declare', function(team) {
		console.log('someone declared ' + team);

		var otherteam = (team === 'r') ? 'd' : 'r';
		
		// check if we have someone waiting in the other queue
		rmaster.rpop(otherteam+'queue', function(err, partnerId) {
			console.log('partner is ' + partnerId);

			// if not, queue them up
			if (partnerId === null || sio.sockets.sockets[partnerId] === undefined) {
				var queue = team + 'queue';
				enqueue(client.id, queue);
			}
			// otherwise connect them together
			else {
				console.log('match found');
				rmaster.get('chanID', function(err, res) {
					var chan = 'chan' + res;
					readyClient(sio.sockets.sockets[partnerId], chan);
					readyClient(client, chan);
					rmaster.incr('chanID');
				});
			}
		});
	});

});

// Auxilliary functions

// add a socket id to a queue
function enqueue(clientId, queue) {
	console.log('new one in ' + queue);
	rmaster.lpush(queue, clientId);
}

// prepare a socket for chatting
function readyClient(client, chan) {
        client.listener = redis.createClient(redis_port, redis_host);
        if (cf.runningInTheCloud) {
            client.listener.auth(redis_password);
        }


	client.listener.subscribe(chan);

	client.listener.on('message', function(chan, msg) {
		console.log(msg);
		client.send(msg);
	});
	

        client.speaker = redis.createClient(redis_port, redis_host);

        if (cf.runningInTheCloud) {
            client.speaker.auth(redis_password);
        }

	client.on('message', function(msg) {
		console.log(JSON.stringify(msg));
		client.speaker.publish(chan, JSON.stringify(msg));
	});

	client.on('disconnect', function() {
		console.log(client.id + ' disconnected.');
		client.speaker.publish(chan, '{"u": "n", "message": "Your partner has disconnected.", "disconnect": "true"}')
	});

	client.emit('readyForChat');

}


exports.queueMaster = function() {
		console.log('watching queues');
		if (rmaster.llen('dqueue') > 0 && rmaster.llen('rqueue') > 0) {
			var dem = dqueue.rpop();
			var rep = dqueue.rpop();
			var chan = 'chan' + rmaster.get('lastID');
			rmaster.incr('lastID');

			console.log('match made on ' + chan);

			readyClient(dem, chan);
			readyClient(rep, chan);
		}
}

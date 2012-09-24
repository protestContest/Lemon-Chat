$(document).ready(function() {
	$('#chatwindow').hide();

	var socket = new io.connect('http://localhost:3000');

	socket.on('message', function(msg) {
		console.log(msg);
		$('textarea').append(msg + '\n');
	});

	$('#sendbtn').click(function() {
		var msg = {u: 'd', message: $('#input').val()};
		socket.json.send(msg);
	});

	$('button').click(function() {
		connect($(this).val());
		$('#buttons').fadeOut();
	});
});

function connect(team) {
	var socket = new io.connect('http://localhost:3000');
	socket.emit('declare', team);

	socket.on('readyForChat', function() {
		$('#chatwindow').fadeIn();
	});

	socket.on('testing', function() {
			alert('yo');
	});
}

$(document).ready(function() {
	window.user = 'n';
	$('#chatwindow').hide();

	var socket = new io.connect('http://localhost:3000');

	socket.on('message', function(msg) {
		console.log('message: ' + msg);
		msg = $.parseJSON(msg);
		$('#chatwindow').append('<p class="' + msg.u + '">' + msg.message + '</p>');
	});

	$('#sendbtn').click(function() {
		var msg = {u: window.user, message: $('#input').val()};
		socket.json.send(msg);
	});

	$('button').click(function() {
		connect($(this).val());
		$('#buttons').fadeOut();
	});
});

function connect(team) {
	window.user = team;
	var socket = new io.connect('http://localhost:3000');
	socket.emit('declare', team);

	socket.on('readyForChat', function() {
		$('#chatwindow').fadeIn();
	});

}

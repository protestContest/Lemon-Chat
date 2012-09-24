$(document).ready(function() {
	window.user = 'n';

	var socket = new io.connect('http://localhost:3000');

	socket.on('message', function(msg) {
		console.log('message: ' + msg);
		msg = $.parseJSON(msg);
		$('#chatcontent').append('<p class="' + msg.u + '">' + msg.message + '</p>');
	});

	$('#sendbtn').click(function() {
		var msg = {u: window.user, message: $('#input').val()};
		socket.json.send(msg);
		$('#input').val('');
	});

	$('button').click(function() {
		connect($(this).val());
		$('#buttons').fadeOut();
	});

	$('#input').keypress(function(e) {
		if (e.which === 13) {
			$('#sendbtn').click();
		}
	});
});

function connect(team) {
	window.user = team;
	var socket = new io.connect('http://localhost:3000');
	socket.emit('declare', team);
	$('#waiting').fadeIn();

	socket.on('readyForChat', function() {
		$('#waiting').hide();
		$('#chatwindow').fadeIn();
	});

}

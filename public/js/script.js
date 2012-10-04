$(document).ready(function() {
	window.user = 'n';

	// when the user 'votes'
	$('button').click(function() {
		connect($(this).val());
		$('#buttons').fadeOut();
	});

	// press enter to send
	$('#input').keypress(function(e) {
		if (e.which === 13) {
			$('#sendbtn').click();
		}
	});

        console.log("host: " + window.location.host);
        console.log("hostname: " + window.location.hostname);
        console.log("host.href: " + window.location.host.href);
});

function connect(team) {
        var socket = new io.connect(window.location.host);
	window.user = team;
    

	socket.emit('declare', team);
	$('#waiting').fadeIn();

	// partner is connected
	socket.on('readyForChat', function() {
		$('#waiting').hide();
		$('#chatwindow').fadeIn();
	});

	// receive message
	socket.on('message', function(msg) {
		console.log('message: ' + msg);
		msg = $.parseJSON(msg);
		$('#chatcontent').append('<p class="' + msg.u + '">' + msg.message + '</p>');

		// disable communication when partner disconnects
		if (msg.disconnect === 'true') {
			$('#sendbtn').attr('disabled', 'disabled');
			$('#input').attr('disabled', 'disabled');
		}
	});

	// send message
	$('#sendbtn').click(function() {
		var msg = {u: window.user, message: $('#input').val()};
		socket.json.send(msg);
		$('#input').val('');
	});

}

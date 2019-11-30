// accessCookie is show!
$('#modalCookie').modal('show');

//click Learn More button, after 3min is show!
$('#noAccessCookie').on('click', function() {
    setTimeout(function() {
        $('#modalCookie').modal('show');
    }, 180000);
});



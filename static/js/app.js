$('.button-collapse').on('click', function() {
    let slide = document.getElementById('slide-out')
    slide.style.animation = "leasyNavigationOf 0.8s linear forwards";
});

$('.hide').on('click', function() {
    document.getElementById('slide-out').style.animation = "leasyNavigationOn 0.8s linear forwards";
});

$('.sendMessage').on('click', function() {
    document.getElementById('send-message').style.animation = "leasySendMessageFormOn 1s linear forwards";
});

$('.hide-sendMessage').on('click', function() {
    document.getElementById('send-message').style.animation = "leasySendMessageFormOff 1s linear forwards";
});
// pjax document!!!
$(document).pjax('a[data-pjax]', '#pjax-container');

// popovers initialization - on click
$('[data-toggle="popover-click"]').popover({
    html: true,
    trigger: 'click',
    placement: 'bottom',
    content: function() { return '<img src="' + $(this).data('img') + '" />'; }
});

// popovers Initialization
$(function() {
    $('[data-toggle="popover"]').popover()
});

$(function() {
    $('.example-popover').popover({
        container: 'body'
    })
});
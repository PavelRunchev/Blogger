// popovers initialization - on click
$('[data-toggle="popover-click"]').popover({
    html: true,
    trigger: 'click',
    placement: 'bottom',
    content: function () { return '<img src="' + $(this).data('img') + '" />'; }
});

// popovers Initialization
$(function () {
    $('[data-toggle="popover"]').popover();
});

$(function () {
    $('.example-popover').popover({
        container: 'body'
    })
});

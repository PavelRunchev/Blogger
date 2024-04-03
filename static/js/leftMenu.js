 // show left menu
 $('.button-collapse').on('click', function () {
    let slide = document.getElementById('slide-out')
    slide.style.animation = "leasyNavigationOf 0.8s linear forwards";
});

// hide left menu
$('.hide').on('click', function () {
    document.getElementById('slide-out').style.animation = "leasyNavigationOn 0.8s linear forwards";
});
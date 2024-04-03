 //click button show spinner loading!
 $('.btn-createUser').on('click', function () {
     console.log('reg spinner');
    document.getElementById('spinner').style.opacity = "1";
});

$('.btn-signIn').on('click', function () {
    document.getElementById('spinner').style.opacity = "1";
});

$('.btn-createCategory').on('click', function () {
    document.getElementById('spinner').style.opacity = "1";
});

$('.btn-createArticle').on('click', function () {
    document.getElementById('spinner').style.opacity = "1";
});

$('.btn-sendMessage').on('click', function () {
    document.getElementById('spinner').style.opacity = "1";
});
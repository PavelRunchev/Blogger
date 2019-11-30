function convertDate(value) {
    const weeks = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let day = new Date(value).getUTCDate();
    let month = new Date(value).getUTCMonth() + 1;
    let year = new Date(value).getUTCFullYear();
    if (day < 10)
        day = '0' + day;
    if (month < 10)
        month = '0' + month;

    return `${day}/${month}/${year}`;
}

function convertDateAndMinutes(value) {
    let day = new Date(value).getUTCDate();
    let month = new Date(value).getUTCMonth() + 1;
    let year = new Date(value).getUTCFullYear();
    let seconds = new Date(value).getUTCSeconds();
    let minutes = new Date(value).getUTCMinutes();
    let hours = new Date(value).getUTCHours();
    
    if (day < 10)
        day = '0' + day;
    if (month < 10)
        month = '0' + month;

    if (hours < 10)
        hours = '0' + hours;
    if (minutes < 10)
        minutes = '0' + minutes;
    if (seconds < 10)
        seconds = '0' + seconds;

    return `${day}/${month}/${year} at ${hours}:${minutes}:${seconds}`;
}

module.exports = { convertDate, convertDateAndMinutes };
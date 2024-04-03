const dataBase = 'mongodb+srv://abobo:nakururu@db-fcmym.mongodb.net/Blogger-DB?retryWrites=true&w=majority';
const port = process.env.PORT || 8080;

module.exports = {
    development: {
        port: port,
        dbPath: dataBase
    },
    production: {
        port: port,
        dbPath: dataBase
    }
};
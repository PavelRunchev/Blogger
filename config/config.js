module.exports = {
    development: {
        port: process.env.PORT || 3000,
        dbPath: 'mongodb+srv://abobo:123@db-fcmym.mongodb.net/blogger?retryWrites=true&w=majority'
    },
    production: {}
};
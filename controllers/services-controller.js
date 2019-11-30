module.exports = {
    contactUs: (req, res) => {
        res.status(200).renderPjax('others/contact-us');
    },

    specialThanks: (req, res) => {
        res.status(200).renderPjax('others/special-thanks');
    },

    technology: (req, res) => {
        res.status(200).renderPjax('others/technology');
    },

    support: (req, res) => {
        res.status(200).renderPjax('others/support');
    }
};
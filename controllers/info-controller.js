module.exports = {
    contactUs: (req, res) => {
        res.renderPjax('others/contact-us');
    },

    specialThanks: (req, res) => {
        res.renderPjax('others/special-thanks');
    },

    technology: (req, res) => {
        res.renderPjax('others/technology');
    },

    support: (req, res) => {
        res.renderPjax('others/support');
    }
};
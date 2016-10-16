const FeedParser = require("feedparser");
const request = require("request");
const Promise = require("bluebird");
const flatten = require("lodash").flatten;
const nodemailer = require("nodemailer");

const cfg = require("dotenv").config();
const readUrls = require("./urls.json");

const EMAIL_OPTIONS = {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: cfg.EMAIL,
            pass: cfg.APP_PASS
        }
};

const urls = Object.keys(readUrls).filter((url) => readUrls[url]);

Promise.map(urls, (url) => {
    return new Promise((resolve, reject) => {
        const items = [];

        const req = request(url);
        const feeder = new FeedParser();

        req.on("error", reject);

        req.on('response', function (res) {
            if (res.statusCode != 200) return reject(new Error("Something went wrong."));

            res.pipe(feeder);
        });

        feeder.on("error", reject);

        feeder.on("readable", function () {
            let item;

            while (item = this.read()) {
                items.push(item);
            }
        });

        feeder.on("end", () => {
            return resolve(items.map((item) => {
                return {
                    title: item.title,
                    link: item.link
                };
            }));    
        });
    });
}).then(flatten).then(email).catch(console.error);

function email(items) {
    const transporter = nodemailer.createTransport(EMAIL_OPTIONS);

    const mail = {
        from: cfg.EMAIL,
        to: cfg.EMAIL,
        subject: "New Craigslist Finds",
        html: items.map((item) => `<a href=${item.link}>${item.title}</a>`).join("<br /><br />")
    };

    transporter.sendMail(mail, (err, info) => {
        if (err) { return console.error(err); }

        console.log("Mail Sent: " + info.response);
    });
}

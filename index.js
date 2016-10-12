const FeedParser = require("feedparser");
const request = require("request");

const lainacclaim = "https://kansascity.craigslist.org/search/sss?format=rss&query=lane%20acclaim";

const items = [];

const req = request(lainacclaim);

const feeder = new FeedParser();

req.on("error", console.error);

req.on('response', function (res) {
 
  if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

  res.pipe(feeder);
});

feeder.on("error", console.error);
feeder.on("end", () => parseItems());

feeder.on("readable", function () {
   let item;

    while (item = this.read()) {
        items.push(item);
    }
});

function parseItems() {
    items.map((item) => console.log(item.title, item.link));
    //todo send email
}

var Crawler = require("crawler");
var csvWriter = require('csv-write-stream')
var writer = csvWriter({
    separator: ',',
    newline: '\n',
    headers: undefined,
    sendHeaders: false,
});
var fs = require('fs');

writer.pipe(fs.createWriteStream('reviews_2016.csv', {flags: 'a'}));

let getPosition = (string, subString, index) => {
    return string.split(subString, index).join(subString).length;
};

var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream('movie_title_2016.csv')
});
  
lineReader.on('line', function (line) {
    let decoded = encodeURI(line.toLowerCase());
    searchCrawler.queue([`https://www.rottentomatoes.com/search/?search=${decoded}`]);
});

let counter = 0;

let searchCrawler = new Crawler({
    maxConnections : 1,
    retries: 100,
    callback: (err, res, done) => {
        try {
            if (err) {
                throw new Error(err);
            }
            let $ = res.$;
            // console.log(res.body);
            let text = $("#main_container .col").html();
            let jsonStart = getPosition(text, '{', 2);
            let jsonEnd = text.lastIndexOf('}', text.lastIndexOf('}')-1);
            let rawJson = text.substr(jsonStart, jsonEnd - jsonStart + 1);
            let searchResult = JSON.parse(rawJson);
            if (searchResult['movieCount'] > 0) {
                reviewCrawlerController(searchResult['movies']);
            }
            console.log(`${counter++} ${res.request.uri.query}`);
        }
        catch(e) {
            // console.log('Decoding error', e);
        }
        finally {
            done();
        }
    }
});

let reviewCrawlerController = (movies) => {
    movies.forEach(movie => {
        let crawlerInputs = [];
        for (let i = 1; i <= 51; i++) {
            reviewCrawler.queue({
                uri: `https://www.rottentomatoes.com${movie['url']}/reviews/?page=${i}&type=user&sort=`,
                movie: movie,
            });
        }
    });
}

let reviewCrawler = new Crawler({
    maxConnections: 500,
    retries: 100,
    callback: (err, res, done) => {
        try {
            if (err) {
                throw new Error(err);
            }
            let { movie } = res.options;
            let $ = res.$;
            $("#reviews .review_table").children('.review_table_row').each((index, row) => {
                let user = $(row).find('.col-xs-8 .col-sm-11 a span').text();
                let review = $(row).find('.col-xs-16 .user_review').text();
                let superReviewer = $(row).find('.col-xs-8 .superreviewer').children().length > 0;
                let score = parseInt($(row).find('.col-xs-16 .user_review .scoreWrapper span').attr('class'), 10) / 10.0;
                writer.write({
                    name: movie['name'],
                    url: movie['url'],
                    year: movie['year'],
                    poster: movie['image'],
                    meterClass: movie['meterClass'],
                    meterScore: movie['meterScore'],
                    casts: JSON.stringify(movie['castItems']),
                    user,
                    review,
                    superReviewer,
                    score,
                });
            });
            // console.log(res.request.uri);
        } 
        catch(e) {
            console.log('Decoding error', e)
        }
        finally {
            done();
        }
    }
});


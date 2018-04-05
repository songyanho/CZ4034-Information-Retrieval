const express = require('express')
const app = express()
var Crawler = require("crawler");
const request = require('request');

let getPosition = (string, subString, index) => {
    return string.split(subString, index).join(subString).length;
};

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
        for (let i = 1; i <= 1; i++) {
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
            let dataset = [];
            $("#reviews .review_table").children('.review_table_row').each((index, row) => {
                let user = $(row).find('.col-xs-8 .col-sm-11 a span').text();
                let review = $(row).find('.col-xs-16 .user_review').text();
                let superReviewer = $(row).find('.col-xs-8 .superreviewer').children().length > 0;
                let score = parseInt($(row).find('.col-xs-16 .user_review .scoreWrapper span').attr('class'), 10) / 10.0;
                let data = {
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
                };
                dataset.push(data);
            });
            request.post({uri: 'http://localhost:3002/inject', formData:{dataset: JSON.stringify(dataset)}}, (error, response, body) => {
                console.log('Done');
            })
        } 
        catch(e) {
            console.log('Decoding error', e)
        }
        finally {
            done();
        }
    }
});

app.get('/inject/:name', (req, res) => {
    var id = req.params.name;
    let decoded = encodeURI(id.toLowerCase());
    searchCrawler.queue([`https://www.rottentomatoes.com/search/?search=${decoded}`]);
    res.send('Done');
});

app.listen(3001, () => console.log('Example app listening on port 3001!'))
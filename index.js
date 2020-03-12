const http = require('http');
var Crawler = require('crawler');
var MongoClient = require('mongodb').MongoClient;
const express = require('express');

// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('Hello World\n');
// });
const server = express()
server.use(express.static('public'));

let port = process.env.PORT;
if (port == null || port == "") {
    port = 8080;
}
server.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.get('/clicked', (req, res) => {
    console.log("RECIEVED REQUEST HEU HEY");
    count = 0;
    ids = [];
    oldProfiles = [];
    clientProfiles = [];
    newProfiles = [];
    megaResponse = null;
    startCrawling(recordInfo, res);
});

server.listen(port);


var ids = [];

var oldProfiles = [];
var clientProfiles = [];
var newProfiles = [];

var count = 0;
var search = 'lbpid=';

var megaResponse;
var url = process.env.MONGODB_URI || 'mongodb://heroku_45jq6d6k:geeti0e5hag4vt1ijdvt7e0hbb@ds241268.mlab.com:41268/heroku_45jq6d6k';
const dbName = "heroku_45jq6d6k";

var c = new Crawler({
    maxConnections: 10,
});

c.on('drain', function () {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db(dbName);

    //deleteAllPreviousRecords(dbo);

    dbo.collection("customers").insertMany(clientProfiles, function (err, res) {
      if (err) throw err;
      console.log("Number of documents inserted: " + res.insertedCount);
    });
    console.log('---ALL PROFILES---');
    console.log(clientProfiles.length);

    const oldEmails = oldProfiles.map(p => p.email);
    newProfiles = clientProfiles.filter(clientInfo => !oldEmails.includes(clientInfo.email));
    console.log('---NEW PROFILES---');
    console.log(newProfiles.length);

    db.close();
    megaResponse.send({oldProfiles, newProfiles});
    // megaResponse.sendStatus(201);
  });
});

function startCrawling(recordIds, response) {
    megaResponse = response;

    // var url = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydb';

    try {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dbName);
            dbo.collection("customers").find({}).toArray(function (err, result) {
                if (err) throw err;
                oldProfiles = result;
                console.log('---OLD PROFILES---');
                console.log(oldProfiles.length);
                db.close();
            });
        });
        getIds(recordInfo, response)
    } catch (e) {
        console.log(e)
    }

}

function getIds(recordIds) {
    c.queue([{

        uri: 'https://lbp.ewr.govt.nz/PublicRegister/Search.aspx?t=Auckland&lc=LIC002&r=Auckland&search=1&p=' + ++count + '&sc=1',

        // The global callback won't be called
        callback: function (error, res, done) {
            var $ = res.$;
            var noResultBox = $('.messageBox h2').toString();

            if (error) {
                console.log('error ' + error);
                done();
            // } else if (count === 2) {
            //     console.log('length ' + ids.length);
            //     recordIds();
            //     done();
            } else if (noResultBox.includes('No results found')) {
                console.log('length ' + ids.length);
                recordIds();
                done();
            } else {
                console.log(count);

                $('.striped tr').each(function (i, element) {

                    var el = $(element).find('a').attr('href');
                    var id = el.substring(el.indexOf(search) + search.length);
                    if (id.includes('BP')) {
                        ids.push(el);
                    }
                });
                getIds(recordIds);
                done();
            }
        }
    }]);
}

function deleteAllPreviousRecords(dbo) {
    dbo.collection("customers").deleteMany(function (err, obj) {
        if (err) throw err;
        console.log(obj.result.n + " document(s) deleted");
    });
}

function recordInfo() {

    ids.forEach(function (uri) {
        console.log('uri ' + uri);
        c.queue([{
            uri: 'https://lbp.ewr.govt.nz' + uri,

            // The global callback won't be called
            callback: function (error, res, done) {
                if (error) {
                    console.log(error);
                } else {
                    var $ = res.$;

                    const clientInfo = {
                        name: $('.formContainer > h2').text().split(' -')[0],
                        phone: $('#ctl00_MainContent_ucLbpDetails_fkPhoneNumber_View').text(),
                        email: $('#ctl00_MainContent_ucLbpDetails_fkEmailAddress_View').text()
                    };

                    clientProfiles.push(clientInfo);
                }
                //console.log('add a record ' + ++recordCounter);
                done();
            }
        }]);
    })
}

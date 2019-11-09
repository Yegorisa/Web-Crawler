const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
server.listen(port);

var Crawler = require("crawler");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
  path: require('path').join(__dirname, 'emails.csv'),
  header: [
    { id: 'name', title: 'name' },
    { id: 'phone', title: 'phone' },
    { id: 'email', title: 'email' }
  ]
});

var ids = [];

var count = 0;
var search = 'lbpid=';

function getIds() {
  c.queue([{

    uri: 'https://lbp.ewr.govt.nz/PublicRegister/Search.aspx?t=Auckland&lc=LIC002&r=Auckland&search=1&p=' + ++count + '&sc=1',

    // The global callback won't be called
    callback: function (error, res, done) {
      var $ = res.$;
      var noResultBox = $('.messageBox h2').toString();

      // if (count === 5) {
      //   console.log(ids);
      //   console.log('length ' + ids.length);
      //   recordInfo();
      //   return;
      // }

      if (error) {
        console.log('error ' + error);
      }
      else if (noResultBox.includes('No results found')) {
        console.log('exit');
        // console.log(ids);
        console.log('length ' + ids.length);
        recordInfo();
        return;
      }
      else {
        console.log(count);

        $('.striped tr').each(function (i, element) {

          var el = $(element).find('a').attr('href');
          var id = el.substring(el.indexOf(search) + search.length);
          if (id.includes('BP')) {
            ids.push(el);
          }
        });

        getIds()
      }
      done();
    }
  }]);
}

var recordCounter = 0;
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

          csvWriter.writeRecords([
            {
              name: $('.formContainer > h2').text().split(' -')[0],
              phone: $('#ctl00_MainContent_ucLbpDetails_fkPhoneNumber_View').text(),
              email: $('#ctl00_MainContent_ucLbpDetails_fkEmailAddress_View').text()
            }
          ]).then(() => console.log('wrote a record ' + ++recordCounter))
        }
        done();
      }
    }]);

  })
}

var c = new Crawler({
  maxConnections: 10,
  // This will be called for each crawled page
  callback: function (error, res, done) {
    if (error) {
      console.log(error);
    } else {
      var $ = res.$;
      // $ is Cheerio by default
      //a lean implementation of core jQuery designed specifically for the server
      console.log($("title").text());
    }
    done();
  }
});

getIds();
const http = require('http');
var Crawler = require('crawler');
var MongoClient = require('mongodb').MongoClient;

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

var url = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydb';
const dbName = "heroku_45jq6d6k";

MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  var dbo = db.db(dbName);

  // dbo.collection("customers").deleteMany(function(err, obj) {
  //   if (err) throw err;
  //   console.log(obj.result.n + " document(s) deleted");
  // });

  // dbo.createCollection("customers", function (err, res) {
  //   if (err) throw err;
  //   console.log("Collection created!");
  // });

  dbo.collection("customers").find({}).toArray(function(err, result) {
    if (err) throw err;
    oldEmails = result.map((profile) => (profile.email));
    console.log('---OLD PROFILES---');
    console.log(oldEmails.length);
  });

  db.close();
});

var ids = [];

var oldEmails = [];
var clientProfiles = [];
var newProfiles = [];

var count = 0;
var search = 'lbpid=';

var c = new Crawler({
  maxConnections: 10,
});

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
      }

      // else if (count === 4) {
      //   console.log('length ' + ids.length);
      //   recordIds();
      //   done();
      // }

      else if (noResultBox.includes('No results found')) {
        console.log('length ' + ids.length);
        recordIds();
        done();
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
        getIds(recordIds);
        done();
      }
    }
  }]);
}

var recordCounter = 0;
function recordInfo() {

  c.on('drain',function(){
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db(dbName);

      dbo.collection("customers").insertMany(clientProfiles, function(err, res) {
        if (err) throw err;
        console.log("Number of documents inserted: " + res.insertedCount);
      });
      console.log('---ALL PROFILES---');
      console.log(clientProfiles.length);

      newProfiles = clientProfiles.filter(clientInfo => !oldEmails.includes(clientInfo.email));
      console.log('---NEW PROFILES---');
      console.log(newProfiles.length);

      db.close();
    });
  });

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
          }

          clientProfiles.push(clientInfo);
        }
        //console.log('add a record ' + ++recordCounter);
        done();
      }
    }]);
  })
}

getIds(recordInfo);
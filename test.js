var http = require('http');
var winston = require('winston');
var url = require('url')
const fs = require('fs');
const path = require('path');

var MongoClient = require('mongodb').MongoClient;
var mongoURL = "mongodb://localhost:27017/mydepth";


let logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => {
            return `${info.timestamp} ${info.level}: ${info.message}`;
        })
    ),
    transports: [new winston.transports.File({filename : "test.log", tailable : "true"})]
});

logger.log("info", "******************** Starting up.");
/*


*/



http.createServer(function (request, response) {
    console.log('request starting...');

    var filePath = '.' + request.url;
    console.log("requested: [" + filePath + "]");

    var query = url.parse(request.url, true);
console.log("query.pathname:" +query.pathname);
    if (query.pathname == "/depth") {
        var depthInCM = query.query.depth;
        console.log("----A request was received [" + request.url + "] with a pathname of [" + query.pathname + "]");

        writeDepthToDatabase(depthInCM);
        response.end('Received [' + depthInCM + ']');
        return;
      }

      if (query.pathname == "/result") {
        console.log("----A RESULT request was received [" + request.url + "] with a pathname of [" + query.pathname + "]");
        var results = returnResults(response);

        return;
      }


    if (filePath == './')
        filePath = './index.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end();
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(8125);








/*
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var query = url.parse(req.url, true);
    var depthInCM = query.query.depth;
    logger.log("info", "A request was received [" + req.url + "] with a pathname of [" + query.pathname + "]");
    if (query.pathname == "/depth") {
      writeDepthToDatabase(depthInCM);
      res.end('Received [' + depthInCM + ']');
    }
    else if (query.pathname == "/") {
      returnFile(query.pathname, res);
    //  returnResults();
    }
    else {
      returnFile(query.pathname);
    }

}).listen(8081);
*/


function returnFile(path, res){
  if (path == "/") path = "/index.html";
  var realPath = "html" + path;
  console.log("trying to open [" +realPath +"]");
  fs.readFile(realPath, function(err, data) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(data);
  res.end();
});
};




function returnResults(response) {
  var result;
  MongoClient.connect(mongoURL, function(err, db) {
  if (err) throw err;
  var dbo = db.db("mydb");
  dbo.collection("depthValues").find().limit(99).toArray(function(err, result) {
    if (err) throw err;
    console.log(result);
    db.close();
    response.end(JSON.stringify(result));
  });

});



}


function writeDepthToDatabase(depthInCM) {

  if (depthInCM > 99) {
    logger.log('info', "Depth in CM is greater than 99cm. Not storing");
    return;
  }

  logger.log('info', "About to store a depth of [" + depthInCM + "]");
  MongoClient.connect(mongoURL, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    var myobj = { datestamp: Date.now(), depth: depthInCM };
    dbo.collection("depthValues").insertOne(myobj, function(err, res) {
      if (err) throw err;
      logger.log("info", "1 document inserted into database.");
      db.close();
    });
  });
}

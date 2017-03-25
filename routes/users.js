var express =  require('express');
var bodyParser = require('body-parser');
var request = require('request');
var cheerio = require('cheerio');

var router = express.Router();

var mongodb = require('mongodb').MongoClient;
var assert = require('assert');

var url = 'mongodb://localhost:27017/test'
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended : false}));


/* GET users listing. */
router.get('/', function(req, res, next) {

  res.render('user_home' , {
        pageTitle : 'Home',
        pageID : 'user_home'

    });
});


router.get('/get_all' , function (req , res) {

    var resultArray = [];
    mongodb.connect(url , function (err ,db) {
        if(err == null){
            var cursor = db.collection('user_data').find();
            cursor.forEach(function (doc, err) {
                if(err == null){
                    resultArray.unshift(doc);
                }

            }, function () { // callback function once we get all the data
                db.close();
                res.json(resultArray);
            });
        }

    });

});



router.post('/insert' ,function (req, res) {


    console.log("body " , req.body);
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth();
    var yyyy = today.getFullYear();

    var month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] ;
    var date_created =  month_names[mm] +  " " + String(dd) + ", " + String(yyyy) ;
    console.log("Date created : " , date_created);

    var link = req.body.url_name;
    var title = "";
    var summary = "";
    var item = {} ;

    request(link, function(error, response, html) {
            if (!error) {
                var $ = cheerio.load(html , {decodeEntities: true});
                title = $('title').text();
                summary = $('p').text();
                summary = summary.substring(0,500);
                console.log(title);



                var item = {
                    url : link,
                    created : date_created,
                    title : title,
                    summary : summary
                };


                mongodb.connect(url,function (err , db) {
                    if(err){
                        return console.dir(err);
                    }else {
                        db.collection('user_data').insertOne(item, function (err, result) {
                            assert.equal(null, err);
                            console.log("ID for the item" + item['_id']);
                            console.log("URL" + String(item['url']));
                            console.log("Item Inserted")
                            db.close();
                            res.json(item);
                        });
                    }
                });

            }
            else{
                console.log(error);

            }
        }
    );

});



router.get('/:input_id' , function (req,  res) {
    console.log("some");
    //var input_id = 2747;
    var input_id = req.params.input_id;
    console.log(input_id);

    var link = '';
    mongodb.connect(url , function (err , db) {
        if(err){
            return console.dir(err);
        }
        else{
            console.log("Inside Connect");
            db.collection('user_data').findOne({'_id': String(input_id) } , function (err, doc) {
                if(err){
                    return console.dir(err);
                }
                else{
                    (console.log(String(doc)));
                    //var obj = JSON.parse(doc);
                    link = link + doc['url'];
                    (console.log(doc));

                    console.log("link :   "  +  link);


                    res.redirect(link);

                }
            });


            db.close();
        }
    }) ;

}) ;


module.exports = router;
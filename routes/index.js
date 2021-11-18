var express = require("express");
var router = express.Router();
let Portfolio = require("../models/Portfolios.js");
const db = require("../db");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.post("/insertPortfolio", (req, res, next) => {
  //Insert the new Json with the data.
  const form = req.body;
  console.log("req.body: ",form);
  if(!Array.isArray(req.body)) return next(new Error('Invalid data format'))
  Promise.all(req.body.map(form=>{
    return new Promise((resolve, reject)=>{
      (new Portfolio(form)).save((err, doc)=>{
        if(err) return reject(err);
        console.log(doc);
        return resolve(doc);
      })
    })
  })).then(docs=>{
    res.json({payload: docs})
  }).catch(e=>next(e))
});



router.post("/updatePortfolio", (req, res, next) => {
  console.log("update Data:",req.body);
  // console.log("SalesforceObj:",req.body[0].SF);
  // console.log("SalesforceId:",req.body[0].SF.SalesforceId);
  var objIds = [];
  for (let i =0; i< req.body.length; i++){
    objIds.push(req.body[i].SF.SalesforceId);
  }
  let myMap = new Map()
  for (let i =0; i< req.body.length; i++){
    myMap.set(req.body[i].SF.SalesforceId,req.body[i]);
  }
  for (let [key, value] of myMap) {
    //update all the relevant portfolios
    var playlistData = {
      publicationDate: value.publicationDate, 
      PageNumber: value.PageNumber,
      seriesName : value.seriesName,
      bookletNumber: value.bookletNumber,
      FRBRWork: value.FRBRWork,
      SF: value.SF,
      He: value.He,
      En: value.En,
      Ar: value.Ar
  };

    var query = { "SF.SalesforceId":key},
                  update = playlistData,
                  options = {upsert: true, new: true, setDefaultsOnInsert: true
                };
    
    Portfolio.updateOne(query, update, options)
                .then(result => {
                    const {matchedCount, modifiedCount} = result;
                    if (matchedCount && modifiedCount) {
                        console.log(`Successfully added a Portfolio.`)
                        return res.status(200);
                    }
                    return res.status(500);
                })
                .catch(err => console.error(`Failed to add review: ${err}`))
  }
  return res.status(200);
});

router.post("/deletePortfolio", (req, res, next) => {
  console.log("Delete Data:",req.body);
  console.log("SalesforceId:",req.body[0].SalesforceId);
  var objIds = []; 
  // req.body = [ { SalesforceId: 'a187Z000001RruKQAS' }, { SalesforceId: 'a187Z000001RruPQAS' }];
  for (let i =0; i< req.body.length; i++){
    objIds.push(req.body[i].SalesforceId);
  } 
  //Delete all the relevant portfolios
  Portfolio.deleteMany({"SF.SalesforceId":{ "$in":objIds}}, function(err, result) {
    if (err) return next(err);  
    try {
        console.log("returned data:",docs);
        res.send(result);
    } catch (e) {
        return next(e);
    }
    
  });
  
    
    
});


module.exports = router;

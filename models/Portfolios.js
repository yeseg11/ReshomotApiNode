const { language } = require('googleapis/build/src/apis/language');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;




var PortfolioSchema = new Schema({
    SF:Object,
    publicationDate:String,
    seriesName:String,
    PageNumber:String,
    bookletNumber:String,
    documentType:String,
    FRBRWork:Object,
    He:Object,
    Ar:Object,
    En:Object,
}, {collection: 'Portfolio'});




var Portfolio = mongoose.model('Portfolio', PortfolioSchema);
module.exports = Portfolio;

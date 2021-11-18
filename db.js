var debug = require("debug");
const mongoose = require("mongoose");
const RETRY_TIMEOUT = 3000;
const PROD = true;


const fs = require('fs');
let rawdata = fs.readFileSync('./app.json');
let data = JSON.parse(rawdata);

let appName = ''; 
let dbName  = '';
let dbPass  = '';

if (PROD && data.Prod != null) {
  appName = data.Prod.appname; 
  dbName  = data.Prod.dbName;
  dbPass  = data.Prod.dbPass;
}





module.exports = function initDB() {
  mongoose.Promise = global.Promise;
  const options = !PROD
    ? {
        // autoReconnect: true,
        // reconnectInterval: RETRY_TIMEOUT,
        // reconnectTries: 10000,
        keepAlive: 30000,
        poolSize: 100,
        useUnifiedTopology: true,
        useNewUrlParser: true,
        // retryWrites: false
      }
    : {
        ssl: true,
        replicaSet: "globaldb",
        maxIdleTimeMS: 120000,
        appname: "@"+appName+"@",
        retryWrites: false,
        dbName: dbName,
      };

  let isConnectedBefore = false;

  const connect = () => {
    if (isConnectedBefore) return Promise.resolve(mongoose); // prevent multiple connections
    return new Promise((res, rej) => {
      // localhost
      // const uri = `mongodb://${process.env.mongohost || 'localhost'}/${process.env.mongodb || 'SalesforceDB'}`;
      // Azure cosmosDB 
      // const uri = `mongodb://salesforce-mongodb:${escape('bOPllCAu6qKj0dACsQimUyLAoZ5trJOUYdAR3sBCsGGINAtriA0oPIISBbAmnC1RDBJzkAryHiQREqLzFlQXEA==')}@salesforce-mongodb.mongo.cosmos.azure.com:10255/`;
      const uri = !PROD
        ? `mongodb://${process.env.mongohost || "localhost"}/${
            process.env.mongodb || dbName
          }`
        : `mongodb://salesforce-mongodb:${escape(
            dbPass
          )}@salesforce-mongodb.mongo.cosmos.azure.com:10255/`;
      debug("app:db")(`Going to connect to ${uri}`);
      debug("app:db")(`Optiosn :: ${JSON.stringify(options)}`);
      return (
        mongoose
          .connect(uri, options)
          // load schemas
          .then(() => {
            debug("app:db")(`We are connected to db ${uri}`);

            // load all models
            require("./models/Portfolios.js");

            isConnectedBefore = true;
            res(mongoose);
          })
          .catch((err) => {
            debug("app:mongoose")(`ERR ::  mongoose.connect :: ${err.message}`);
            rej(err);
          })
      );
    });
  };

  mongoose.connection.on("error", function () {
    debug("app:mongoose")("ERR :: Could not connect to MongoDB");
  });

  mongoose.connection.on("disconnected", function () {
    debug("app:mongoose")(
      "Mongo got disconnected, trying to reconnect in " + RETRY_TIMEOUT
    );
    if (!isConnectedBefore) {
      setTimeout(() => connect(), RETRY_TIMEOUT);
    }
  });
  mongoose.connection.on("connected", function () {
    isConnectedBefore = true;
    debug("app:mongoose")("Connection established to MongoDB");
  });

  mongoose.connection.on("reconnected", function () {
    debug("app:mongoose")("Reconnected to MongoDB");
  });

  // Close the Mongoose connection, when receiving SIGINT
  process.on("SIGINT", function () {
    mongoose.connection.close(function () {
      debug("app:mongoose")(
        "Force to close the MongoDB connection after SIGINT"
      );
      process.exit(0);
    });
  });
  return connect();
};

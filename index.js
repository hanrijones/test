const app = require("express")();
const fsr = require('fs-reverse');
const probe = require('probe-stream')()
const cc = require("cryptocompare");
const { HOST, PORT, APIKEY, USD } = require("./config/index");

global.fetch = require("node-fetch");

cc.setApiKey(APIKEY);

let portfolio = 0;
let tokens = [];
let types = [];
let amounts = [];

function resolveAfter2Seconds() {
  return new Promise(resolve => {
    setTimeout(() => {
      fsr('./db/transactions.csv')
        .pipe(probe.createProbe())
        .on('data', function (row) {
          let newRow = row.split(',');
          if (newRow[0] != 'timestamp' && newRow[0]) {
            amount = (Number)(newRow[3]);
            token = newRow[2];
            type = newRow[1];
            tokens.push(token);
            amounts.push(amount);
            types.push(type);
          }
        })
        .on('end', async function () {
          probe.end.bind(probe)
          console.log("calculating...");
          for (var i = 0; i < tokens.length; i = i + 1) {
            await cc.price(tokens[i], USD).then((tokenPrice) => {
              price = tokenPrice[USD] * amounts[i];
              if (types[i] == "DEPOSIT") {
                portfolio = portfolio + parseFloat(price)
              }
              if (types[i] == "WITHDRAWAL") {
                portfolio = portfolio >= price ? portfolio - parseFloat(price) : portfolio;
              }
            });
          }
          console.log("price is ", portfolio);
          console.log("Finished===================");
        })
        .on("error", function (error) {
          console.log(error.message);
        });

    }, 20);
  });
}
function resolveAfter4Seconds() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('4 seconds');
    }, 4000);
  });
}

async function asyncCall() {
  const result1 = await resolveAfter2Seconds();
}

(async function () {
  await asyncCall();
})();
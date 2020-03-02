var http = require('http');
var bodyParser = require('body-parser');
var express = require('express');
const url = "https://corona-api.kompa.ai/graphql";
const graphql = require("graphql-request");
const query = `query countries {
    countries {
        Country_Region
        Confirmed
        Deaths
        Recovered 
        Last_Update
    }
    provinces {
        Province_Name
        Province_Id
        Confirmed
        Deaths
        Recovered
        Last_Update
    }
}`;
const graphqlclient = new graphql.GraphQLClient(url, {
    headers: {
        Authority: "corona-api.kompa.ai",
        Scheme: "https",
        Path: "/graphql",
        Accept: "*/*",
        UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36",
        Origin: "https://corona.kompa.ai",
        secfetchsize: "same-site",
        secfetchmode: "cors",
        Referer: "https://corona.kompa.ai",
        AcceptEncoding: "gzip, deflate, br",
        AcceptLanguage: "vn-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5"
    },
})
var app = express();
app.use(bodyParser.urlencoded({
  extended: false
}));
var server = http.createServer(app);

app.get('/', (req, res) => {
    res.send("Home page. Server running okay.");
  });

app.get('/vn', (req,res) => {
    graphqlclient.request(query).then(result => {
        var json_data = result.countries.filter(find => find.Country_Region == "Vietnam")
        var json_data = json_data[0]
        res.send(json_data)
    })
})

app.get('./us', (req,res) => {
    graphqlclient.request(query).then(result => {
        var json_data = result.countries.filter(find => find.Country_Region == "US")
        var json_data = json_data[0]
        res.send(json_data)
    })
})

app.set('port', process.env.PORT || 5000);
app.set('ip', process.env.IP || "0.0.0.0");
  
server.listen(app.get('port'), app.get('ip'), function() {
console.log("Chat bot server listening at %s:%d ", app.get('ip'), app.get('port'));
});
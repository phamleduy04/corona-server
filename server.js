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
const json_response_example = {
    "messages": []
}
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
    console.log(req.query)
    res.send("Home page. Server running okay.");
  });

app.get('/vn', (req,res) => {
    graphqlclient.request(query).then(result => {
        var json_data = result.countries.filter(find => find.Country_Region == "Vietnam")
        var json_data = json_data[0]
        var timestamp = new Date(parseInt(json_data.Last_Update))
        var date = timestamp.getDate() + '/' + (timestamp.getMonth() + 1) + '/' + timestamp.getFullYear()
        let json_response = {
            "messages": [
              {"text": `Việt Nam hiện tại có ${json_data.Confirmed} ca nhiễm, ${json_data.Deaths} ca tử vong và ${json_data.Recovered} ca đã hồi phục. \nNgày cập nhật: ${date}`},
            ]
        }
        res.send(json_response)
    })
})

app.get('/us', (req,res) => {
    graphqlclient.request(query).then(result => {
        var json_data = result.countries.filter(find => find.Country_Region == "US")
        var json_data = json_data[0]
        var timestamp = new Date(parseInt(json_data.Last_Update))
        var date = timestamp.getDate() + '/' + (timestamp.getMonth() + 1) + '/' + timestamp.getFullYear()
        let json_response = {
            "messages": [
              {"text": `Hoa Kì hiện tại có ${json_data.Confirmed} ca nhiễm, ${json_data.Deaths} ca tử vong và ${json_data.Recovered} ca đã hồi phục. \nNgày cập nhật: ${date}`},
            ]
        }
        res.send(json_response)
    })
})

app.get('/vnfull', (req,res) => {
    graphqlclient.request(query).then(result => {
        var json_response = {
            "messages": []
        }
        result.provinces.forEach(tentp => {
            let response = {"text": `${tentp.Province_Name} hiện tại có ${tentp.Confirmed} ca nhiễm, ${tentp.Deaths} ca tử vong và ${tentp.Recovered} ca hồi phục.`}
            json_response["messages"].push(response)
        }); 
        res.send(json_response)
    })
})
app.get('/canada', (req, res) => {
    graphqlclient.request(query).then(result => {
        var json_data = result.countries.filter(find => find.Country_Region == "Canada")
        var json_data = json_data[0]
        var timestamp = new Date(parseInt(json_data.Last_Update))
        var date = timestamp.getDate() + '/' + (timestamp.getMonth() + 1) + '/' + timestamp.getFullYear()
        let json_response = {
            "messages": [
              {"text": `Canada hiện tại có ${json_data.Confirmed} ca nhiễm, ${json_data.Deaths} ca tử vong và ${json_data.Recovered} ca đã hồi phục. \nNgày cập nhật: ${date}`},
            ]
        }
        res.send(json_response)
    })
})
app.get('/korea', (req, res) => {
    graphqlclient.request(query).then(result => {
        var json_data = result.countries.filter(find => find.Country_Region == "South Korea")
        var json_data = json_data[0]
        var timestamp = new Date(parseInt(json_data.Last_Update))
        var date = timestamp.getDate() + '/' + (timestamp.getMonth() + 1) + '/' + timestamp.getFullYear()
        let json_response = {
            "messages": [
              {"text": `Hàn Quốc hiện tại có ${json_data.Confirmed} ca nhiễm, ${json_data.Deaths} ca tử vong và ${json_data.Recovered} ca đã hồi phục. \nNgày cập nhật: ${date}`},
            ]
        }
        res.send(json_response)
    })
})
app.set('port', process.env.PORT || 5000);
app.set('ip', process.env.IP || "0.0.0.0");
  
server.listen(app.get('port'), app.get('ip'), function() {
console.log("Chat bot server listening at %s:%d ", app.get('ip'), app.get('port'));
});
var http = require('http');
var bodyParser = require('body-parser');
var express = require('express');
const fs = require('fs');
const url = "https://corona-api.kompa.ai/graphql";
const graphql = require("graphql-request");
const NewsAPI = require('newsapi');
const {news_api_key} = require('./config.json')
const newsapi = new NewsAPI(news_api_key);
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
const news_query = `query topTrueNews {
    topTrueNews {
        title
        url
        siteName
        picture
        }
}`
const global_news_query = `query topGlobalNews {
    topGlobalNews {
        title
        url
        siteName
        picture
        }
}`

const search = {
    "ad": "Andorra",
    "ae": "United Arab Emirates",
    "af": "Afghanistan",
    "am": "Armenia",
    "ar": "Argentina",
    "at": "Austria",
    "au": "Australia",
    "az": "Azerbaijan",
    "be": "Belgium",
    "bh": "Bahrain",
    "br": "Brazil",
    "by": "Belarus",
    "ca": "Canada",
    "ch": "Switzerland",
    "cl": "Chile",
    "cn": "Mainland China",
    "cz": "Czech Republic",
    "de": "Germany",
    "dk": "Denmark",
    "do": "Dominican Republic",
    "dz": "Algeria",
    "ec": "Ecuador",
    "ee": "Estonia",
    "eg": "Egypt",
    "es": "Spain",
    "fi": "Finland",
    "fr": "France",
    "gb": "UK",
    "ge": "Georgia",
    "gr": "Greece",
    "hk": "Hong Kong",
    "hr": "Croatia",
    "id": "Indonesia",
    "ie": "Ireland",
    "il": "Israel",
    "in": "India",
    "iq": "Iraq",
    "ir": "Iran",
    "is": "Iceland",
    "it": "Italy",
    "jo": "Jordan",
    "jp": "Japan",
    "kh": "Cambodia",
    "kr": "South Korea",
    "kw": "Kuwait",
    "lb": "Lebanon",
    "li": "Liechtenstein",
    "lk": "Sri Lanka",
    "lt": "Lithuania",
    "lu": "Luxembourg",
    "lv": "Latvia",
    "ma": "Morocco",
    "mk": "North Macedonia",
    "mx": "Mexico",
    "my": "Malaysia",
    "ng": "Nigeria",
    "nl": "Netherlands",
    "no": "Norway",
    "np": "Nepal",
    "nz": "New Zealand",
    "om": "Oman",
    "others": "Others",
    "ph": "Philippines",
    "pk": "Pakistan",
    "pt": "Portugal",
    "qa": "Qatar",
    "ro": "Romania",
    "ru": "Russia",
    "sa": "Saudi Arabia",
    "se": "Sweden",
    "sg": "Singapore",
    "sm": "San Marino",
    "sn": "Senegal",
    "th": "Thailand",
    "tn": "Tunisia",
    "tw": "Taiwan",
    "ua": "Ukrane",
    "us": "US",
    "vn": "Vietnam"
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
app.get('/language', (req, res) => {
    let lang = JSON.parse(fs.readFileSync('./lang.json', 'utf8'));
    if (req.query.lang == "vn") {
        userid = req.query.userid
        if (!lang[userid]) lang[userid] = {
            lang: "vn"
        }
        fs.writeFile("./lang.json", JSON.stringify(lang), (err) => {
            if (err) console.log(err)
        });
        var json_response = { "messages": [{ "text": "Đã chọn ngôn ngữ của bạn là Tiếng Việt (Vietnamese)" }] }
        res.send(json_response)
    } else if (req.query.lang == "en") {
        userid = req.query.userid
        if (!lang[userid]) lang[userid] = {
            lang: "en"
        }
        fs.writeFile("./lang.json", JSON.stringify(lang), (err) => {
            if (err) console.log(err)
        });
        var json_response = { "messages": [{ "text": "Your selected language is English" }] }
        res.send(json_response)
    }
})

app.get('/vnfull', (req, res) => {
    let lang = JSON.parse(fs.readFileSync('./lang.json', 'utf8'));
    var userid = req.query.userid
    if (!lang[userid]) lang[userid] = {
        lang: "vn"
    }
    fs.writeFile("./lang.json", JSON.stringify(lang), (err) => {
        if (err) console.log(err)
    });
    if (lang[req.query.userid].lang == 'vn') {
        graphqlclient.request(query).then(result => {
            var json_response = {
                "messages": []
            }
            result.provinces.forEach(tentp => {
                var response = { "text": `${tentp.Province_Name} hiện tại có ${tentp.Confirmed} ca nhiễm, ${tentp.Deaths} ca tử vong và ${tentp.Recovered} ca hồi phục.` }
                json_response["messages"].push(response)
            })
            res.send(json_response)
        })
    } else if (lang[req.query.userid].lang == 'en') {
        graphqlclient.request(query).then(result => {
            var json_response = {
                "messages": []
            }
            result.provinces.forEach(tentp => {
                var response = { "text": `${tentp.Province_Name} currently has ${tentp.Confirmed} confirmed cases, ${tentp.Deaths} deaths cases and ${tentp.Recovered} recoveries cases.` }
                json_response["messages"].push(response)
            })
            res.send(json_response)
        })
    }
})

app.get('/corona', (req, res) => {
    var tukhoa = req.query.countries.toLowerCase()
    if (search[tukhoa]) {
        graphqlclient.request(query).then(result => {
            var json_data = result.countries.filter(find => find.Country_Region == search[tukhoa])
            var json_data = json_data[0]
            var timestamp = new Date(parseInt(json_data.Last_Update))
            var date = timestamp.getDate() + '/' + (timestamp.getMonth() + 1) + '/' + timestamp.getFullYear()
            let json_response = {
                "messages": [
                    { "text": `${search[tukhoa]} hiện tại có ${json_data.Confirmed} ca nhiễm, ${json_data.Deaths} ca tử vong và ${json_data.Recovered} ca đã hồi phục. \nNgày cập nhật: ${date}` },
                ]
            }
            res.send(json_response)
        })
    } else if (tukhoa.length !== 2) {
        let json_response = {
            "messages": [
                { "attachment": { "type": "template", "payload": { "template_type": "button", "text": "Bạn phải nhập mã quốc gia 2 chữ để sử dụng tính năng này. Click vào nút ở dưới để tham khảo.", "buttons": [{ "type": "web_url", "url": "https://corona-js.herokuapp.com/countrycode", "title": "Click để vào trang web!" }] } } }
            ],
            "text": "Tips: Hãy chú ý tới cột Alpha-2 code nha <3."
        }
        res.send(json_response)
    } else if (tukhoa.length == 2 && !search[tukhoa]) {
        let json_response = {
            "messages": [{ "text": "Lỗi, không tìm thấy tên đất nước bạn tìm, hoặc nước này hiện tại đang không có dịch corona!" }]
        }
        res.send(json_response)
    }
})

app.get('/countrycode', (req, res) => {
    res.redirect('https://www.facebook.com/capnhatcorona/photos/a.101726258114169/101721558114639/');
})

app.get('/news', (req, res) => {
    var push_json = {
        "messages": [{
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "image_aspect_ratio": "square",
                    "elements": []
                }
            }
        }]
    }
    if (req.query.quocte == 'true') {
        newsapi.v2.topHeadlines({
            q: 'coronavirus',
            pageSize: 10,
            language: 'en',
            country: 'us'
          }).then(response => {
                response.articles.forEach(n => {
                    push_json.messages[0].attachment.payload.elements.push({
                        "title": n.title,
                        "image_url": n.urlToImage,
                        "subtitle": `Source: ${n.source.name}`,
                        "buttons": [{
                            "type": "web_url",
                            "url": n.url,
                            "title": "Go to website"
                        }]
                    })
                })
            res.send(push_json);
          });
    } else {
        graphqlclient.request(news_query).then(result => {
            result.topTrueNews.forEach(n => {
                if (n.title.length > 0 && n.picture.length > 0 && n.siteName.length > 0 && n.url.length > 0) {
                    push_json.messages[0].attachment.payload.elements.push({
                        "title": n.title,
                        "image_url": n.picture,
                        "subtitle": `Nguồn: ${n.siteName}`,
                        "buttons": [{
                            "type": "web_url",
                            "url": n.url,
                            "title": "Đọc báo"
                        }]
                    })
                }
            })
            res.send(push_json)
        })
    }
})
app.set('port', process.env.PORT || 5000);
app.set('ip', process.env.IP || "0.0.0.0");

server.listen(app.get('port'), app.get('ip'), function() {
    console.log("Chat bot server listening at %s:%d ", app.get('ip'), app.get('port'));
});
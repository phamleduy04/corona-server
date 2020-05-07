const http = require("http");
const bodyParser = require("body-parser");
const express = require("express");
const pattern = /\B(?=(\d{3})+(?!\d))/g; //pattern để thêm dấu phẩy
const capitalize = require("capitalize");
const UsaStates = require("usa-states").UsaStates;
const usStates = new UsaStates()
const NewsAPI = require("newsapi");
const ms = require("ms");
const {NovelCovid} = require('novelcovid');
const track = new NovelCovid();
const db = require('quick.db');
const stringsimilarity = require("string-similarity");
const fs = require("fs");
const { News_API_Key } = require("./config.json");
const newsapi = new NewsAPI(News_API_Key);
const {arcgis, vnfull} = require('./functions.js')
setInterval(() => {
    arcgis()
    vnfull()
}, ms('4m'))
arcgis();
vnfull();
var app = express();
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
  });

var server = http.createServer(app);
app.get("/", (req, res) => {
    res.send("Home page. Server running okay.");
});

app.get("/cansearch", (req, res) => {
    var canada_provinces = ["British Columbia", "Ontario", "Alberta", "Quebec", "New Brunswick", "Saskatchewan", "Manitoba", "Nova Scotia", "Grand Princess", "Newfoundland and Labrador", "Prince Edward Island"]
    let province_name_req = req.query.province
    if (!province_name_req) return res.send("Invalid")
    var province_name = capitalize.words(province_name_req);
    var matches = stringsimilarity.findBestMatch(province_name, canada_provinces)
    var response = db.get('arcgis')
    var province = response.features.filter(m => m.attributes.Country_Region == "Canada" && m.attributes.Province_State == matches.bestMatch.target)
    var province = province[0];
    var timestamp = new Date(parseInt(province.attributes.Last_Update))
    var date = timestamp.getDate() + "/" + (timestamp.getMonth() + 1) + "/" + timestamp.getFullYear()
    if (req.query.lang == "en") {
        var json_string = `Province of ${province.attributes.Province_State} currently has ${province.attributes.Confirmed} confirmed cases, ${province.attributes.Deaths} deaths cases and ${province.attributes.Recovered} recovered cases. \nUpdated date: ${date}`
        var response_json = {
            "messages": [{ "text": `${json_string}` }],
            "redirect_to_blocks":["cont_ca_en"]
        }
        res.send(response_json)
    } else {
        var json_string = `Tỉnh bang ${province.attributes.Province_State} hiện tại có ${province.attributes.Confirmed} ca nhiễm, ${province.attributes.Deaths} ca tử vong và ${province.attributes.Recovered} ca hồi phục. \nNgày cập nhật: ${date}`
        var response_json = {
            "messages": [{ "text": `${json_string}` }],
            "redirect_to_blocks":["cont_ca_vn"]
        }
        res.send(response_json)
    }
})

app.get("/usprovince", async (req, res) => {
    let input = req.query.province; //input = dallas,tx
    let lang = req.query.lang;
    if (!input || !input.includes(',')){
        if (req.query.lang == 'en') return res.send({"messages": [{ "text": "You must enter district and state names separated by commas, eg: Dallas, TX"}]})
        else return res.send({"messages": [{ "text": "Bạn phải nhập tên quận và bang cách nhau dấu phẩy, VD: Dallas,TX"}]})
    } 
    if (!lang) lang = 'vn'
    input = input.split(',')
    let province_name = capitalize.words(input[0])
    let state = input[1].toUpperCase()
    let usState_data = usStates.states
    usState_data = usState_data.filter(e => e.abbreviation == state)
    if (!usState_data) return res.send("Invalid")
    usState_data = usState_data[0]
    let data = await track.jhucsse(true, province_name);
    if (data.message) return res.send('Invalid') 
    let data_sorted = data.filter(e => e.province == usState_data.name)
    if (!data_sorted) return res.send('Invalid')
    data_sorted = data_sorted[0]
    let json_string = 'null'
    let redirect = 'null'
    if (lang == "en"){
        json_string = `Province of ${data_sorted.county} currently has ${data_sorted.county} confirmed cases, ${data_sorted.stats.deaths} deaths cases and ${data_sorted.stats.recovered} recovered cases.\n Updated at: ${data_sorted.updatedAt}`
        redirect = "cont_province_us_en"
    } else {
        json_string = `Quận ${data_sorted.county} hiện tại có ${data_sorted.county} ca nhiễm, ${data_sorted.stats.deaths} ca tử vong và ${data_sorted.stats.recovered} ca hồi phục. \n Ngày cập nhật: ${data_sorted.updatedAt}`
        redirect = "cont_province_us_vn"
    }
    let response_json = {
        "messages": [{ "text":json_string}],
        "redirect_to_blocks":[redirect]
    } 
    res.send(response_json)
})

app.get("/aussearch", (req, res) => {
    var ausStateslist = ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania", "Australian Capital Territory", "Northern Territory"]
    let state_name_req = req.query.state
    if (!state_name_req) return res.send("Invalid")
    var state_name = capitalize.words(state_name_req)
    var matches = stringsimilarity.findBestMatch(state_name, ausStateslist)
    var response = db.get('arcgis')
    var state = response.features.filter(m => m.attributes.Country_Region == "Australia" && m.attributes.Province_State == matches.bestMatch.target)
    var state = state[0]
    var timestamp = new Date(parseInt(state.attributes.Last_Update))
    var date = timestamp.getDate() + "/" + (timestamp.getMonth() + 1) + "/" + timestamp.getFullYear()
    let json_string = 'null'
    let redirect = 'null'
    if (req.query.lang == "en") {
        json_string = `State of ${state.attributes.Province_State} currently has ${state.attributes.Confirmed} confirmed cases, ${state.attributes.Deaths} deaths cases and ${state.attributes.Recovered} recovered cases. \nUpdated date: ${date}`
        redirect = 'cont_au_en'
    } else {
        json_string = `Bang ${state.attributes.Province_State} hiện tại có ${state.attributes.Confirmed} ca nhiễm, ${state.attributes.Deaths} ca tử vong và ${state.attributes.Recovered} ca hồi phục. \nNgày cập nhật: ${date}`
        redirect = 'cont_au_vn'
    }
    let response_json = {
        "messages": [{ "text": `${json_string}` }],
        "redirect_to_blocks":[redirect]
    }
    res.send(response_json)
})

app.get("/ussearch", async (req, res) => {
    let state_name_req = req.query.state
    if (!state_name_req) return res.send("Invalid")
    let data = await track.states(state_name_req)
    if (!data.message){ //{ message: "Country not found or doesn't have any cases" }
        if(req.query.lang == "en"){
            var json_string = `State of ${data.state.toString().replace(pattern, ',')} currently has ${data.cases.toString().replace(pattern, ',')}(+${data.todayCases.toString().replace(pattern, ',')}) confirmed cases, ${data.deaths.toString().replace(pattern, ',')}(+${data.todayDeaths.toString().replace(pattern, ',')}) deaths cases and N/A recovered cases.`
            var response_json = {
                "messages": [{ "text": `${json_string}` }],
                "redirect_to_blocks":["cont_us_en"]
            }
            res.send(response_json)
        } else {
            var json_string = `Tiểu bang ${data.state.toString().replace(pattern, ',')} hiện tại có ${data.cases.toString().replace(pattern, ',')}(+${data.todayCases.toString().replace(pattern, ',')}) ca nhiễm, ${data.deaths.toString().replace(pattern, ',')}(+${data.todayDeaths.toString().replace(pattern, ',')}) ca tử vong và N/A ca hồi phục.`
            var response_json = {
                "messages": [{ "text": `${json_string}` }],
                "redirect_to_blocks":["cont_us_vn"]
            }
            res.send(response_json)
        }
    } else {
        if (req.query.lang == "en") {
            var json_response = {"messages": [{ "attachment": { "type": "template", "payload": { "template_type": "button", "text": "You must enter a valid state name. Click on the button below for reference.", "buttons": [{ "type": "web_url", "url": "https://corona-js.herokuapp.com/usstates", "title": "Click here!" }] } } }]}
            res.send(json_response)
        } else {
            var json_response = {"messages": [{ "attachment": { "type": "template", "payload": { "template_type": "button", "text": "Bạn phải nhập tên hợp lệ của tiểu bang Hoa Kì. Click vào nút dưới đây để tham khảo ", "buttons": [{ "type": "web_url", "url": "https://corona-js.herokuapp.com/usstates", "title": "Click here!" }] } } }]}
            res.send(json_response)
        }
    }
})

app.get("/vnsearch", async (req, res) => {
    let data = await db.get('vnfull')
    let listprovince_array = fs.readFileSync("./data/listprovincevn.txt", "utf8").split(",")
    let lang = req.query.lang
    let search_string = req.query.province
    if (!search_string) return res.send("Invalid")
    if (search_string.toLowerCase() == "tphcm" || search_string.toLowerCase() == "hcm") search_string = "Hồ Chí Minh"
    let matches = stringsimilarity.findBestMatch(search_string, listprovince_array)
    let data_json = data.provinces.filter(m => m.Province_Name == matches.bestMatch.target)
    data_json = data_json[0]
    if (lang == "en") {
        let response = {
            "messages": [{ "text": `${data_json.Province_Name} currently has ${data_json.Confirmed} confirmed cases, ${data_json.Deaths} deaths cases and ${data_json.Recovered} recoveries cases.`}],
            "redirect_to_blocks":["cont_vn_en"]
        }
        res.send(response)
    } else {
        let response = {
            "messages": [{ "text": `${data_json.Province_Name} hiện tại có ${data_json.Confirmed} ca nhiễm, ${data_json.Deaths} ca tử vong và ${data_json.Recovered} ca hồi phục.`}],
            "redirect_to_blocks":["cont_vn_vn"]
        }
        res.send(response)
    }
})

app.get("/usprovincewiki", (req, res) => {
    res.redirect("https://en.wikipedia.org/wiki/List_of_United_States_counties_and_county_equivalents")
})
app.get("/usstates", (req, res) => {
    res.redirect("https://en.wikipedia.org/wiki/List_of_states_and_territories_of_the_United_States#States")
})
app.get("/countrycode", (req, res) => {
    res.redirect("https://www.iban.com/country-codes");
})

app.get("/global", async (req, res) => {
    let data = await track.all()
    let totalCases = data.cases.toString().replace(pattern, ",")
    let todayCases = data.todayCases.toString().replace(pattern, ",")
    let totalDeaths = data.deaths.toString().replace(pattern, ",")
    let todayDeaths = data.todayDeaths.toString().replace(pattern, ",")
    let recovered = data.recovered.toString().replace(pattern, ",")
    if (req.query.lang == "en"){
        let json_response = {
            "messages": [
                { "text": `Global currently has ${totalCases}(+${todayCases}) total cases, ${totalDeaths}(+${todayDeaths}) deaths cases, ${recovered} recovered cases`},
            ]
        }
        res.send(json_response)
    } else {
        let json_response = {
            "messages": [
                { "text": `Thế giới hiện tai có ${totalCases}(+${todayCases}) ca nhiễm, ${totalDeaths}(+${todayDeaths}) ca tử vong, ${recovered} ca hồi phục.`},
            ]
        }
        res.send(json_response)
    }
})

app.get("/corona", async (req, res) => {
    if (!req.query.countries) return res.send("Invalid")
    let data = await track.countries(req.query.countries)
    let trymode = req.query.trymode
    if (data.message) { //{"message": "Country not found or doesn't have any cases"}
        if (trymode == "true") return res.send('Invalid');
        else if (!trymode || trymode == "false"){
            let json_response = 'null'
        if (req.query.lang == "en") {
            json_response = {
                "messages": [
                    { "attachment": { "type": "template", "payload": { "template_type": "button", "text": "You must enter a 2-letter country code to use this feature. Click on the button below for reference.", "buttons": [{ "type": "web_url", "url": "https://corona-js.herokuapp.com/countrycode", "title": "Click here!" }] } } }
                ],
                "text": "Tips: Pay attention to the Alpha-2 code column <3."
            }
        } else {
            json_response = {
                "messages": [
                    { "attachment": { "type": "template", "payload": { "template_type": "button", "text": "Bạn phải nhập mã quốc gia 2 chữ để sử dụng tính năng này. Click vào nút ở dưới để tham khảo.", "buttons": [{ "type": "web_url", "url": "https://corona-js.herokuapp.com/countrycode", "title": "Click để vào trang web!" }] } } }
                ],
                "text": "Tips: Hãy chú ý tới cột Alpha-2 code nha <3."
            }
        }
            return res.send(json_response)
        }
    }
    let json_response = 'null'
    if (req.query.lang == 'en'){
        json_response = {
            "messages": [
                { "text": `${data.country.toString().replace(pattern, ',')} currently has ${data.cases.toString().replace(pattern, ',')}(+${data.todayCases.toString().replace(pattern, ',')}) total cases, ${data.critical.toString().replace(pattern, ',')} serious case, ${data.deaths.toString().replace(pattern, ',')}(+${data.todayDeaths.toString().replace(pattern, ',')}) death cases and ${data.recovered.toString().replace(pattern, ',')} recoveries cases.`},
            ],
            "redirect_to_blocks": [`ask_${data.countryInfo.iso2.toLowerCase()}_en`]
        }
    } else {
        json_response = {
            "messages": [
                { "text": `${data.country.toString().replace(pattern, ',')} hiện tại có ${data.cases.toString().replace(pattern, ',')}(+${data.todayCases.toString().replace(pattern, ',')}) ca nhiễm, ${data.critical.toString().replace(pattern, ',')} ca nghiêm trọng, ${data.deaths.toString().replace(pattern, ',')}(+${data.todayDeaths.toString().replace(pattern, ',')}) ca tử vong và ${data.recovered.toString().replace(pattern, ',')} ca đã hồi phục.`},
            ],
            "redirect_to_blocks": [`ask_${data.countryInfo.iso2.toLowerCase()}_vn`]
        }
    }
    res.send(json_response)
})

app.get("/news", async (req, res) => {
    if (!req.query.countries || req.query.countries.length !== 2) {
        res.send("Invalid");
    } else {
        const countries = req.query.countries.toLowerCase();
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
        if (countries == "vn") {
            let data = await db.get('vnfull')
            data.topTrueNews.forEach(n => {
                if (n.title.length > 0 && n.picture !== null && n.siteName.length > 0 && n.url.length > 0) {
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
        } else {
            newsapi.v2.topHeadlines({
                q: "coronavirus",
                pageSize: 10,
                language: "en",
                country: countries
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
        }
    }
})

app.set("port", process.env.PORT || 5000);
app.set("ip", process.env.IP || "0.0.0.0");

server.listen(app.get("port"), app.get("ip"), function () {
    console.log("Corona-js is listening at %s:%d ", app.get("ip"), app.get("port"));
});
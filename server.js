const http = require("http");
const bodyParser = require("body-parser");
const express = require("express");
const getJSON = require("get-json");
const capitalize = require("capitalize");
const UsaStates = require("usa-states").UsaStates;
const NewsAPI = require("newsapi");
const ms = require("ms");
const stringsimilarity = require("string-similarity");
const fs = require("fs");
//đọc file
const usprovincelist = fs.readFileSync("./data/listprovinceus.txt", "utf8").split(",");
const countrieslist = fs.readFileSync("./data/countries.txt", "utf8").split(",");
const { News_API_Key } = require("./config.json");
const country_array = require("./data/country_array.json");
function countryarrayfilp() {
// dịch ngược file country_array
    let res = {};
    for (var key in country_array){
        res[country_array[key]] = key;
    }
    fs.writeFileSync("./data/country_array_flipped.json", JSON.stringify(res));
}
countryarrayfilp();
const country_array_flipped = require("./data/country_array_flipped.json")

const newsapi = new NewsAPI(News_API_Key);
//url list
const Arcgis_URL = "https://viruscoronaapi.herokuapp.com/arcgis";
const Kompa_News_URL = "https://viruscoronaapi.herokuapp.com/kompa?data=news";
const Kompa_Vnfull_URL = "https://viruscoronaapi.herokuapp.com/kompa";
const Worldometers_URL = "https://viruscoronaapi.herokuapp.com/worldometers";
const Worldometers_Total_URL = "https://viruscoronaapi.herokuapp.com/worldometers?data=total";
const Worldometers_UsState_URL = "https://viruscoronaapi.herokuapp.com/worldometers?data=usstate";
const Newsbreak_URL = "https://viruscoronaapi.herokuapp.com/breaknews";
//const jhu_url = "https://viruscoronaapi.herokuapp.com/jhudata"


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

async function getAllData(){
    console.time("start")
    //arcgis
    await getJSON(Arcgis_URL, function(error, response){
        if (error) return;
        fs.writeFileSync("./data/arcgis.json", JSON.stringify(response))
    })
    //kompa news
    await getJSON(Kompa_News_URL, function(error, response) {
        if (error) return;
        fs.writeFileSync("./data/kompa_news.json", JSON.stringify(response))
    })
    //kompa (vnfull)
    await getJSON(Kompa_Vnfull_URL, function(error, response){
        if (error) return;
        fs.writeFileSync("./data/vnfull.json", JSON.stringify(response))
        //write list vn
        var array = []
        response.provinces.forEach((e) => {
            array.push(e.Province_Name);
        });
        fs.writeFileSync("./data/listprovincevn.txt", array);
    })
    //worldometers
        //global
    await getJSON(Worldometers_URL, function(error, response){
        if (error) return;
        fs.writeFileSync("./data/worldometers.json", JSON.stringify(response))
    })
        //total
    await getJSON(Worldometers_Total_URL, function(error, response){
        if (error) return;
        fs.writeFileSync("./data/total.json", JSON.stringify(response))
    })
        //us state
    await getJSON(Worldometers_UsState_URL, function(error, response){
        if (error) return;
        fs.writeFileSync("./data/us.json", JSON.stringify(response))
    })
        //newsbreak
    await getJSON(Newsbreak_URL, function(error, response){
        if (error) return;
        fs.writeFileSync("./data/usprovince.json", JSON.stringify(response))
    })
    //john hopkins
    /*
    await getJSON(jhu_url, function(error, response){
        if (error) return;
        fs.writeFileSync("./data/jhu.json", JSON.stringify(response))
        //list of city
        let city_array = []
        response.forEach(e => {
            city_array.push(e.city)
        })
        let not_dulp_city_array = Array.from(new Set(city_array))
        fs.writeFileSync("./data/listcityus.txt", not_dulp_city_array)
    })
    */
    console.log("Đã ghi hết tất cả file")
    console.timeEnd("start")
}
setInterval(getAllData, ms("4m"))

app.get("/uscitysearch", (req, res) => {
    let query = req.query.query
    let lang = req.query.lang
    if (query.includes(",")){
        let State_Code = query.split(",")[1].toUpperCase().trim()
        let City_Name = capitalize.words(query.split(",")[0])
        let usState_json = new UsaStates()
        let state_json = usState_json.states.filter(e => e.abbreviation == State_Code) //filter to get json i want
        if (state_json.length == 0){
            if (lang == "en"){
                res.send({"messages": [{ "text": `You have entered an invalid state code, please enter the 2 letter state code (Eg: TX, WA, ..)` }]});
            } else {
                res.send({"messages": [{ "text": `Bạn đã nhập sai mã bang, vui lòng nhập mã bang với 2 chữ cái (VD: TX, WA, ...)` }]})
            }
        } else {
        state_json = state_json[0]
        let data_json = JSON.parse(fs.readFileSync("./data/jhu.json")) //read data
        let filter_json = data_json.filter(e => e.province == state_json.name && e.city == City_Name && e.country == "US")
        filter_json = filter_json[0]
        if (!filter_json) {
            if (lang == "en"){
                res.send({"messages": [{ "text": `I can"t find the city in that state, maybe your city currently has no recorded cases.` }]});
            } else {
                res.send({"messages": [{ "text": `Mình không tìm được tên thành phố trong bang đó, có thể là thành phố của bạn hiện tại không có dịch.` }]})
            }
        } else {
            let stats = filter_json.stats
            if (lang == "en"){
                res.send({"messages": [{ "text": `${filter_json.city} city in the state of ${filter_json.province} currently has ${stats.confirmed} confirmed cases, ${stats.deaths} deaths cases and ${stats.recovered} recovered cases. \nUpdated date: ${filter_json.updatedAt}` }],"redirect_to_blocks":["cont_city_us_en"]});
            } else {
                res.send({"messages": [{ "text": `Thành phố ${filter_json.city} ở bang ${filter_json.province} hiện tại có ${stats.confirmed} ca nhiễm, ${stats.deaths} ca tử vong và ${stats.recovered} ca hồi phục.\nNgày cập nhật: ${filter_json.updatedAt}`}],"redirect_to_blocks":["cont_city_us_vn"]});
            }
        }
    }
    } else {
        if (lang == "en"){
            res.send({"messages": [{ "text": `Please enter the correct order: <city name>,<state code> (Eg Dallas, TX)`}]});
        } else {
            res.send({"messages": [{ "text": `Bạn vui lòng nhập theo đúng trình tự: <tên thành phố>,<mã bang> (VD: Dallas,TX)`}]});
        }
    }
})

app.get("/cansearch", (req, res) => {
    var canada_provinces = ["British Columbia", "Ontario", "Alberta", "Quebec", "New Brunswick", "Saskatchewan", "Manitoba", "Nova Scotia", "Grand Princess", "Newfoundland and Labrador", "Prince Edward Island"]
    let province_name_req = req.query.province
    if (!province_name_req) return res.send("Invalid")
    var province_name = capitalize.words(province_name_req);
    var matches = stringsimilarity.findBestMatch(province_name, canada_provinces)
    var response = JSON.parse(fs.readFileSync("./data/arcgis.json", "utf8"))
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

app.get("/apidata", (req, res) => {
    var response = JSON.parse(fs.readFileSync("./data/worldometers.json"))
    res.send(response)
})

app.get("/usprovince", (req, res) => {
    var input = req.query.province;
    var lang = req.query.lang;
    if (!input || !lang) return res.send("Invalid")
    var province_name = capitalize.words(input)
    var data = JSON.parse(fs.readFileSync("./data/usprovince.json"))
    var ans = stringsimilarity.findBestMatch(province_name, usprovincelist)
    if (ans.bestMatch.rating > 0.6){
        var data_ = data.filter(data => data.Province_Name == ans.bestMatch.target)
        var data_ = data_[0]
        if (lang == "en"){
            let response_json = {
                "messages": [{ "text": `Province of ${data_.Province_Name} currently has ${data_.Confirmed}(+${data_.New_Confirmed}) confirmed cases, ${data_.Deaths}(+${data_.New_Deaths}) deaths cases and N/A recovered cases.` }],
                "redirect_to_blocks":["cont_province_us_en"]
            }
            res.send(response_json)
        } else {
            let response_json = {
                "messages": [{ "text": `Quận ${data_.Province_Name} hiện tại có ${data_.Confirmed}(+${data_.New_Confirmed}) ca nhiễm, ${data_.Deaths}(+${data_.New_Deaths}) ca tử vong và N/A ca hồi phục.` }],
                "redirect_to_blocks":["cont_province_us_vn"]
            } 
            res.send(response_json)
        }
    } else {
        if (req.query.lang == "en") {
            var json_response = {
                "messages": [{ "text": `You must enter a valid US province name, list supported US province name: https://corona-js.herokuapp.com/usprovincewiki`}]
            }
            res.send(json_response)
        } else {
            var json_response = {
                "messages": [
                    { "text": "Bạn phải nhập tên hợp lệ quận của Hoa Kì, list bot đang hỗ trợ: https://corona-js.herokuapp.com/usprovincewiki"}
                ]
            }
            res.send(json_response)
        }
    }
})

app.get("/aussearch", (req, res) => {
    var ausStateslist = ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania", "Australian Capital Territory", "Northern Territory"]
    let state_name_req = req.query.state
    if (!state_name_req) return res.send("Invalid")
    var state_name = capitalize.words(state_name_req)
    var matches = stringsimilarity.findBestMatch(state_name, ausStateslist)
    var response = JSON.parse(fs.readFileSync("./data/arcgis.json"))
    var state = response.features.filter(m => m.attributes.Country_Region == "Australia" && m.attributes.Province_State == matches.bestMatch.target)
    var state = state[0]
    var timestamp = new Date(parseInt(state.attributes.Last_Update))
    var date = timestamp.getDate() + "/" + (timestamp.getMonth() + 1) + "/" + timestamp.getFullYear()
    if (req.query.lang == "en") {
        var json_string = `State of ${state.attributes.Province_State} currently has ${state.attributes.Confirmed} confirmed cases, ${state.attributes.Deaths} deaths cases and ${state.attributes.Recovered} recovered cases. \nUpdated date: ${date}`
        var response_json = {
            "messages": [{ "text": `${json_string}` }],
            "redirect_to_blocks":["cont_au_en"]
        }
        res.send(response_json)
    } else {
        var json_string = `Bang ${state.attributes.Province_State} hiện tại có ${state.attributes.Confirmed} ca nhiễm, ${state.attributes.Deaths} ca tử vong và ${state.attributes.Recovered} ca hồi phục. \nNgày cập nhật: ${date}`
        var response_json = {
            "messages": [{ "text": `${json_string}` }],
            "redirect_to_blocks":["cont_au_vn"]
        }
        res.send(response_json)
    }
})

app.get("/ussearch", (req, res) => {
    var usStates = new UsaStates();
    var statesNameslist = usStates.arrayOf("names");
    let state_name_req = req.query.state
    if (!state_name_req) return res.send("Invalid")
    var state_name = capitalize.words(req.query.state);
    var matches = stringsimilarity.findBestMatch(state_name, statesNameslist)
    if (matches.bestMatch.rating >= 0.4) {
        var response = JSON.parse(fs.readFileSync("./data/us.json"))
        var state = response.filter(state => state.State_Name == matches.bestMatch.target)
        var state = state[0]
        if(req.query.lang == "en"){
            var json_string = `State of ${state.State_Name} currently has ${state.Total_Cases}(${state.New_Cases}) confirmed cases, ${state.Total_Deaths}(${state.New_Deaths}) deaths cases and ${state.Total_Recovered} recovered cases.`
            var response_json = {
                "messages": [{ "text": `${json_string}` }],
                "redirect_to_blocks":["cont_us_en"]
            }
            res.send(response_json)
        } else {
            var json_string = `Tiểu bang ${state.State_Name} hiện tại có ${state.Total_Cases}(${state.New_Cases}) ca nhiễm, ${state.Total_Deaths}(${state.New_Deaths}) ca tử vong và ${state.Total_Recovered} ca hồi phục.`
            var response_json = {
                "messages": [{ "text": `${json_string}` }],
                "redirect_to_blocks":["cont_us_vn"]
            }
            res.send(response_json)
        }
    } else {
        if (req.query.lang == "en") {
            var json_response = {
                "messages": [
                    { "attachment": { "type": "template", "payload": { "template_type": "button", "text": "You must enter a valid state name. Click on the button below for reference.", "buttons": [{ "type": "web_url", "url": "https://corona-js.herokuapp.com/usstates", "title": "Click here!" }] } } }
                ]
            }
            res.send(json_response)
        } else {
            var json_response = {
                "messages": [
                    { "attachment": { "type": "template", "payload": { "template_type": "button", "text": "Bạn phải nhập tên hợp lệ của tiểu bang Hoa Kì. Click vào nút dưới đây để tham khảo ", "buttons": [{ "type": "web_url", "url": "https://corona-js.herokuapp.com/usstates", "title": "Click here!" }] } } }
                ]
            }
            res.send(json_response)
        }
    }
})

app.get("/vnsearch", (req, res) => {
    let data = JSON.parse(fs.readFileSync("./data/vnfull.json"))
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
app.get("/global", (req, res) => {
    var data = JSON.parse(fs.readFileSync("./data/total.json"))
    if (req.query.lang == "en"){
        let json_response = {
            "messages": [
                { "text": `Global currently has ${data.Global_Cases} total cases, ${data.Global_Deaths} deaths cases, ${data.Global_Recovered} recovered cases`},
            ]
        }
        res.send(json_response)
    } else {
        let json_response = {
            "messages": [
                { "text": `Thế giới hiện tai có ${data.Global_Cases} ca nhiễm, ${data.Global_Deaths} ca tử vong, ${data.Global_Recovered} ca hồi phục.`},
            ]
        }
        res.send(json_response)
    }
})

app.get("/coronatry", (req, res) => {
    if (!req.query.countries) {
        return res.send("Invalid")
    } else if (req.query.countries.length !== 2){
        let matches = stringsimilarity.findBestMatch(req.query.countries, countrieslist)
        if (matches.bestMatch.rating >= 0.5) {
            var datafile = JSON.parse(fs.readFileSync("./data/worldometers.json"))
            var json_data = datafile.filter(r => r.Country_Name == matches.bestMatch.target)
            var json_data = json_data[0]
            if (req.query.lang == "en"){
                let tukhoa = country_array_flipped[matches.bestMatch.target]
                let json_response = {
                    "messages": [
                        { "text": `${json_data.Country_Name} currently has ${json_data.Total_Cases}(${json_data.New_Cases}) total cases, ${json_data.Serious_Cases} serious case, ${json_data.Total_Deaths}(${json_data.New_Deaths}) death cases and ${json_data.Total_Recovered} recoveries cases.`},
                    ],
                    "redirect_to_blocks": [`ask_${tukhoa}_en`]
                }
                res.send(json_response)
            } else {
                let tukhoa = country_array_flipped[matches.bestMatch.target]
                let json_response = {
                    "messages": [
                        { "text": `${json_data.Country_Name} hiện tại có ${json_data.Total_Cases}(${json_data.New_Cases}) ca nhiễm, ${json_data.Serious_Cases} ca nghiêm trọng, ${json_data.Total_Deaths}(${json_data.New_Deaths}) ca tử vong và ${json_data.Total_Recovered} ca đã hồi phục.`},
                    ],
                    "redirect_to_blocks": [`ask_${tukhoa}_en`]
                }
                res.send(json_response)
            }
        } else {
            res.send(JSON.stringify(matches.bestMatch))
        }
    } else {
        var tukhoa = req.query.countries.toLowerCase()
        if (country_array[tukhoa]) {
            var response = JSON.parse(fs.readFileSync("./data/worldometers.json"))
            var json_data = response.filter(r => r.Country_Name == country_array[tukhoa])
            var json_data = json_data[0]
            if (req.query.lang == "en"){
                let json_response = {
                    "messages": [
                        { "text": `${json_data.Country_Name} currently has ${json_data.Total_Cases}(${json_data.New_Cases}) total cases, ${json_data.Serious_Cases} serious case, ${json_data.Total_Deaths}(${json_data.New_Deaths}) death cases and ${json_data.Total_Recovered} recoveries cases.`},
                    ],
                    "redirect_to_blocks": [`ask_${tukhoa}_en`]
                }
                res.send(json_response)
            } else {
                let json_response = {
                    "messages": [
                        { "text": `${json_data.Country_Name} hiện tại có ${json_data.Total_Cases}(${json_data.New_Cases}) ca nhiễm, ${json_data.Serious_Cases} ca nghiêm trọng, ${json_data.Total_Deaths}(${json_data.New_Deaths}) ca tử vong và ${json_data.Total_Recovered} ca đã hồi phục.`},
                    ],
                    "redirect_to_blocks": [`ask_${tukhoa}_vn`]
                }
                res.send(json_response)
            }
    }
    }
})


app.get("/corona", (req, res) => {
    if (!req.query.countries || req.query.countries.length !== 2) {
        res.send("Invalid")
    }
    var tukhoa = req.query.countries.toLowerCase()
    if (country_array[tukhoa]) {
        var response = JSON.parse(fs.readFileSync("./data/worldometers.json"))
        var json_data = response.filter(r => r.Country_Name == country_array[tukhoa])
        var json_data = json_data[0]
            if (req.query.lang.toLowerCase() == "en") {
                let json_response = {
                    "messages": [
                        { "text": `${json_data.Country_Name} currently has ${json_data.Total_Cases}(${json_data.New_Cases}) total cases, ${json_data.Serious_Cases} serious case, ${json_data.Total_Deaths}(${json_data.New_Deaths}) death cases and ${json_data.Total_Recovered} recoveries cases.`},
                    ],
                    "redirect_to_blocks": [`ask_${tukhoa}_en`]
                }
                res.send(json_response)
            } else {
                let json_response = {
                    "messages": [
                        { "text": `${json_data.Country_Name} hiện tại có ${json_data.Total_Cases}(${json_data.New_Cases}) ca nhiễm, ${json_data.Serious_Cases} ca nghiêm trọng, ${json_data.Total_Deaths}(${json_data.New_Deaths}) ca tử vong và ${json_data.Total_Recovered} ca đã hồi phục.`},
                    ],
                    "redirect_to_blocks": [`ask_${tukhoa}_vn`]
                }
                res.send(json_response)
            }
    } else if (tukhoa.length !== 2) {
        if (req.query.lang == "en") {
            var json_response = {
                "messages": [
                    { "attachment": { "type": "template", "payload": { "template_type": "button", "text": "You must enter a 2-letter country code to use this feature. Click on the button below for reference.", "buttons": [{ "type": "web_url", "url": "https://corona-js.herokuapp.com/countrycode", "title": "Click here!" }] } } }
                ],
                "text": "Tips: Pay attention to the Alpha-2 code column <3."
            }
        } else {
            var json_response = {
                "messages": [
                    { "attachment": { "type": "template", "payload": { "template_type": "button", "text": "Bạn phải nhập mã quốc gia 2 chữ để sử dụng tính năng này. Click vào nút ở dưới để tham khảo.", "buttons": [{ "type": "web_url", "url": "https://corona-js.herokuapp.com/countrycode", "title": "Click để vào trang web!" }] } } }
                ],
                "text": "Tips: Hãy chú ý tới cột Alpha-2 code nha <3."
            }
        }
        res.send(json_response)

    } else if (tukhoa.length == 2 && !country_array[tukhoa.toLowerCase()]) {
        if (req.query.lang.toLowerCase() == "en") {
            var json_response = {
                "messages": [{ "text": "Error, did not find the name of the country you are looking for, or this country currently has no coronavirus cases!" }]
            }
        } else {
            var json_response = {
                "messages": [{ "text": "Lỗi, không tìm thấy tên đất nước bạn tìm, hoặc nước này hiện tại đang không có dịch corona!" }]
            }
        }
        res.send(json_response)
    }
});

app.get("/news", (req, res) => {
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
            let data = JSON.parse(fs.readFileSync("./data/kompa_news.json"))
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
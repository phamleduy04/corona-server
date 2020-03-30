const http = require('http');
const bodyParser = require('body-parser');
const express = require('express');
const getJSON = require('get-json');
const capitalize = require('capitalize');
const UsaStates = require('usa-states').UsaStates;
const NewsAPI = require('newsapi');
const { news_api_key } = require('./config.json');
const newsapi = new NewsAPI(news_api_key);
const ms = require('ms');
const stringsimilarity = require('string-similarity');
const fs = require('fs');
const usprovincelist = fs.readFileSync('./listprovince.txt', 'utf8').split(',')
//url list
const arcgis_url = 'https://viruscoronaapi.herokuapp.com/arcgis'
const kompa_news_url = 'https://viruscoronaapi.herokuapp.com/kompa?data=news'
const kompa_vnfull = 'https://viruscoronaapi.herokuapp.com/kompa'
const worldometers_url = 'https://viruscoronaapi.herokuapp.com/worldometers'
const worldometers_total_url = 'https://viruscoronaapi.herokuapp.com/worldometers?data=total'
const worldometers_usstate_url = 'https://viruscoronaapi.herokuapp.com/worldometers?data=usstate'
const newsbreak_url = 'https://viruscoronaapi.herokuapp.com/breaknews'
const search = {
    "ad": "Andorra",
    "af": "Afghanistan",
    "am": "Armenia",
    "ar": "Argentina",
    "at": "Austria",
    "au": "Australia",
    "az": "Azerbaijan",
    "be": "Belgium",
    "bg": "Bulgaria",
    "bh": "Bahrain",
    "br": "Brazil",
    "by": "Belarus",
    "ca": "Canada",
    "ch": "Switzerland",
    "cl": "Chile",
    "cn": "China",
    "cu": "Cuba",
    "cz": "Czechia",
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
    "hu": "Hungary",
    "jo": "Jordan",
    "jp": "Japan",
    "kh": "Cambodia",
    "kr": "S. Korea",
    "kw": "Kuwait",
    "lb": "Lebanon",
    "li": "Liechtenstein",
    "lk": "Sri Lanka",
    "lt": "Lithuania",
    "tg": "Togo",
    "lu": "Luxembourg",
    "lv": "Latvia",
    "ma": "Morocco",
    "mc": "Monaco",
    "mk": "North Macedonia",
    "mm": "Myanmar",
    "mx": "Mexico",
    "my": "Malaysia",
    "ng": "Nigeria",
    "nl": "Netherlands",
    "no": "Norway",
    "np": "Nepal",
    "nz": "New Zealand",
    "om": "Oman",
    "others": "Diamond Princess",
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
    "la": "Laos",
    "fl": "Finland",
    "tw": "Taiwan",
    "ua": "Ukraine",
    "us": "USA",
    "vn": "Vietnam"
}

var app = express();
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });

var server = http.createServer(app);

app.get('/', (req, res) => {
    res.send("Home page. Server running okay.");
});

setInterval(async function() { 
    console.time('start')
    //arcgis
    getJSON(arcgis_url, function(error, response){
        if (error) return;
        fs.writeFileSync('./arcgis.json', JSON.stringify(response))
        console.log('Đã ghi file arcgis.json')
    })
    //kompa news
    getJSON(kompa_news_url, function(error, response) {
        if (error) return;
        fs.writeFileSync('./kompa_news.json', JSON.stringify(response))
        console.log('Đã ghi file arcgis.json')
    })
    //kompa (vnfull)
    getJSON(kompa_vnfull, function(error, response){
        if (error) return;
        fs.writeFileSync('./vnfull.json', JSON.stringify(response))
        console.log('Đã ghi file vnfull.json')
    })
    //worldometers
        //global
    getJSON(worldometers_url, function(error, response){
        if (error) return;
        fs.writeFileSync('./worldometers.json', JSON.stringify(response))
        console.log('Đã ghi file worldometers.json')
    })
        //total
    getJSON(worldometers_total_url, function(error, response){
        if (error) return;
        fs.writeFileSync('./total.json', JSON.stringify(response))
        console.log('Đã ghi file total.json')
    })
        //us state
    getJSON(worldometers_usstate_url, function(error, response){
        if (error) return;
        fs.writeFileSync('./us.json', JSON.stringify(response))
        console.log('Đã ghi file us.json')
    })
    //newsbreak
    getJSON(newsbreak_url, function(error, response){
        if (error) return;
        fs.writeFileSync('./usprovince.json', JSON.stringify(response))
        console.log('Đã ghi file usprovince.json')
    })
    console.timeEnd('start')
}, ms('3m'))

app.get('/cansearch', (req, res) => {
    var canada_provinces = ["British Columbia", "Ontario", "Alberta", "Quebec", "New Brunswick", "Saskatchewan", "Manitoba", "Nova Scotia", "Grand Princess", "Newfoundland and Labrador", "Prince Edward Island"]
    var province_name = capitalize.words(req.query.province);
    if (canada_provinces.indexOf(province_name) > -1) {
        var response = JSON.parse(fs.readFileSync('./arcgis.json', 'utf8'))
        var province = response.features.filter(m => m.attributes.Country_Region == "Canada" && m.attributes.Province_State == province_name)
        var province = province[0];
        var timestamp = new Date(parseInt(province.attributes.Last_Update))
        var date = timestamp.getDate() + '/' + (timestamp.getMonth() + 1) + '/' + timestamp.getFullYear()
        if (req.query.lang == 'en') {
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
    } else {
        if (req.query.lang == 'en') {
            var json_response = {
                "messages": [{ "text": `You must enter a valid Canadian province name, the list of Canadian provinces being supported is: British Columbia, Ontario, Alberta, Quebec, New Brunswick` }]
            }
            res.send(json_response)
        } else {
            var json_response = {
                "messages": [
                    { "text": "Bạn phải nhập tên hợp lệ tỉnh bang của Canada, list tỉnh bang Canada đang hỗ trợ là: British Columbia, Ontario, Alberta, Quebec, New Brunswick" }
                ]
            }
            res.send(json_response)
        }
    }
})

app.get('/apidata', (req, res) => {
    var response = JSON.parse(fs.readFileSync('./worldometers.json'))
    res.send(response)
})

app.get('/usprovince', (req, res) => {
    var input = req.query.province;
    var lang = req.query.lang;
    if (!input || !lang) return res.send('Invalid')
    var province_name = capitalize.words(input)
    var data = JSON.parse(fs.readFileSync('./usprovince.json'))
    var ans = stringsimilarity.findBestMatch(province_name, usprovincelist)
    if (ans.bestMatch.rating > 0.6){
        var data_ = data.filter(data => data.Province_Name == ans.bestMatch.target)
        var data_ = data_[0]
        if (lang == 'en'){
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
        if (req.query.lang == 'en') {
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

app.get('/aussearch', (req, res) => {
    var ausStateslist = ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory']
    var state_name = capitalize.words(req.query.state)
    if (ausStateslist.indexOf(state_name) > -1) {
        var response = JSON.parse(fs.readFileSync('./arcgis.json'))
        var state = response.features.filter(m => m.attributes.Country_Region == "Australia" && m.attributes.Province_State == state_name)
        var state = state[0]
        var timestamp = new Date(parseInt(state.attributes.Last_Update))
        var date = timestamp.getDate() + '/' + (timestamp.getMonth() + 1) + '/' + timestamp.getFullYear()
        if (req.query.lang == 'en') {
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
    } else {
        if (req.query.lang == 'en') {
            var json_response = {
                "messages": [{ "text": `You must enter a valid Australian state name, the list of Australian states supporting is: New South Wales, Victoria, Queensland, Western Australia, South Australia, Tasmania, Australian Capital Territory, Northern Territory`}]
            }
            res.send(json_response)
        } else {
            var json_response = {
                "messages": [
                    { "text": "Bạn phải nhập tên hợp lệ bang của nước Úc, danh sách bang nước Úc đang hỗ trợ là: New South Wales, Victoria, Queensland, Western Australia, South Australia, Tasmania, Australian Capital Territory, Northern Territory" }
                ]
            }
            res.send(json_response)
        }
    }
})

app.get('/ussearch', (req, res) => {
    var usStates = new UsaStates();
    var statesNameslist = usStates.arrayOf('names');
    var state_name = capitalize.words(req.query.state);
    if (statesNameslist.indexOf(state_name) > -1) {
        var response = JSON.parse(fs.readFileSync('./us.json'))
        var state = response.filter(state => state.State_Name == state_name)
        var state = state[0]
        if(req.query.lang == 'en'){
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
        if (req.query.lang == 'en') {
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

app.get('/vnfull', (req, res) => {
    let data = JSON.parse(fs.readFileSync('vnfull.json'))
    if (req.query.lang == 'en') {
        var total = ""
        data.provinces.forEach(tentp => {
            var line = `${tentp.Province_Name} currently has ${tentp.Confirmed} confirmed cases, ${tentp.Deaths} deaths cases and ${tentp.Recovered} recoveries cases.\n\n`
            total += line
        })
        var response = {
            "messages": [{ "text": `${total}` }]
        }
        res.send(response)
    } else {
        var total = ""
        data.provinces.forEach(tentp => {
            var line = `${tentp.Province_Name} hiện tại có ${tentp.Confirmed} ca nhiễm, ${tentp.Deaths} ca tử vong và ${tentp.Recovered} ca hồi phục.\n\n`
            total += line
        })
        var response = {
            "messages": [{ "text": `${total}` }]
        }
        res.send(response)
    }
})

app.get('/usprovincewiki', (req, res) => {
    res.redirect('https://en.wikipedia.org/wiki/List_of_United_States_counties_and_county_equivalents')
})
app.get('/usstates', (req, res) => {
    res.redirect('https://en.wikipedia.org/wiki/List_of_states_and_territories_of_the_United_States#States')
})
app.get('/countrycode', (req, res) => {
    res.redirect('https://www.iban.com/country-codes');
})
app.get('/global', (req, res) => {
    var data = JSON.parse(fs.readFileSync('./total.json'))
    if (req.query.lang == 'en'){
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

app.get('/coronatry', (req, res) => {
    if (!req.query.countries || req.query.countries.length !== 2) {
        res.send('Invalid')
    }
    var tukhoa = req.query.countries.toLowerCase()
    if (search[tukhoa]) {
        var response = JSON.parse(fs.readFileSync('./worldometers.json'))
        var json_data = response.filter(r => r.Country_Name == search[tukhoa])
        var json_data = json_data[0]
        if (req.query.lang == 'en'){
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
})


app.get('/corona', (req, res) => {
    if (!req.query.countries || req.query.countries.length !== 2) {
        res.send('Invalid')
    }
    var tukhoa = req.query.countries.toLowerCase()
    if (search[tukhoa]) {
        var response = JSON.parse(fs.readFileSync('./worldometers.json'))
        var json_data = response.filter(r => r.Country_Name == search[tukhoa])
        var json_data = json_data[0]
            if (req.query.lang.toLowerCase() == 'en') {
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
        if (req.query.lang == 'en') {
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

    } else if (tukhoa.length == 2 && !search[tukhoa.toLowerCase()]) {
        if (req.query.lang.toLowerCase() == 'en') {
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

app.get('/news', (req, res) => {
    if (!req.query.countries || req.query.countries.length !== 2) {
        res.send('Invalid');
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
        if (countries == 'vn') {
            let data = JSON.parse(fs.readFileSync('./kompa_news.json'))
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
                q: 'coronavirus',
                pageSize: 10,
                language: 'en',
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

app.set('port', process.env.PORT || 5000);
app.set('ip', process.env.IP || "0.0.0.0");

server.listen(app.get('port'), app.get('ip'), function () {
    console.log("Corona-js is listening at %s:%d ", app.get('ip'), app.get('port'));
});
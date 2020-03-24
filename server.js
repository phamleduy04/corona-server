var http = require('http');
var bodyParser = require('body-parser');
var express = require('express');
const getJSON = require('get-json');
const capitalize = require('capitalize');
var UsaStates = require('usa-states').UsaStates;
const url = "https://corona-api.kompa.ai/graphql";
const arcgis_url = 'https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases/FeatureServer/1/query?f=json&where=1=1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Confirmed%20desc&outSR=102100&resultOffset=0&resultRe%20cordCount=160&cacheHint=true'
const worldometers_url = 'https://www.worldometers.info/coronavirus/'
const us_state_url = 'https://www.worldometers.info/coronavirus/country/us/'
const graphql = require("graphql-request");
const NewsAPI = require('newsapi');
const { news_api_key } = require('./config.json')
const newsapi = new NewsAPI(news_api_key);
const ms = require('ms')
const fs = require('fs')
const axios = require("axios");
const cheerio = require("cheerio");
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
const search = {
    "ad": "Andorra",
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
    "cn": "China",
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
    "tw": "Taiwan",
    "ua": "Ukraine",
    "us": "USA",
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

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });

var server = http.createServer(app);

app.get('/', (req, res) => {
    res.send("Home page. Server running okay.");
});

setInterval(async function() { //wordometers
            let Countries = []
            const result = await axios.get(worldometers_url);
            let $ = cheerio.load(result.data);
            $('#main_table_countries_today').find('tbody').eq(0).find('tr').each((i, el) => {
                Countries.push($(el).find('td').eq(0).text().trim())
            })

            const json_response = []
            Countries.forEach(country => {
                        let Index = Countries.indexOf(country) + 1
                        json_response.push({
                                    Country_Name: `${$(`#main_table_countries_today > tbody:nth-child(2) > tr:nth-child(${Index}) > td:nth-child(1)`).text().trim() || '0'}`,
            Total_Cases: `${$(`#main_table_countries_today > tbody:nth-child(2) > tr:nth-child(${Index}) > td:nth-child(2)`).text().trim() || '+0'}`,
            New_Cases: `${$(`#main_table_countries_today > tbody:nth-child(2) > tr:nth-child(${Index}) > td:nth-child(3)`).text().trim() || '0'}`,
            Total_Deaths: `${$(`#main_table_countries_today > tbody:nth-child(2) > tr:nth-child(${Index}) > td:nth-child(4)`).text().trim() || '0'}`,
            New_Deaths: `${$(`#main_table_countries_today > tbody:nth-child(2) > tr:nth-child(${Index}) > td:nth-child(5)`).text().trim() || '+0'}`,
            Total_Recovered: `${$(`#main_table_countries_today > tbody:nth-child(2) > tr:nth-child(${Index}) > td:nth-child(6)`).text().trim() || '0'}`,
            Serious_Cases: `${$(`#main_table_countries_today > tbody:nth-child(2) > tr:nth-child(${Index}) > td:nth-child(8)`).text().trim() || '0'}`
        })
    })
            fs.writeFileSync('./worldometers.json',JSON.stringify(json_response))
            console.log('Đã ghi file worldometers.json')
            // Total của worldometers
            var data = $('.maincounter-number').text().trim()
            var data = data.replace(/\s\s+/g, ' ').split(' ');
            let total_json = {
                Global_Cases: data[0],
                Global_Deaths: data[1],
                Global_Recovered: data[2]
            }
            fs.writeFileSync('./total.json', JSON.stringify(total_json))
            console.log('Đã ghi file total.json')
            //arcgis url
            getJSON(arcgis_url).then(response => {
                if (response.error) {
                    return console.log('Error!');
                } else {
                    fs.writeFileSync('./arcgis.json', JSON.stringify(response))
                    console.log('Đã ghi file arcgis.json')
                }
            })
            //us state
            let US_STATE = []
            const usstateresult = await axios.get(us_state_url);
            let $state = cheerio.load(usstateresult.data);
            $state('#usa_table_countries_today').find('tbody').eq(0).find('tr').each((i, el) => {
                US_STATE.push($state(el).find('td').eq(0).text().trim())
            })
        
            let us_state_json = []
                    US_STATE.forEach(state => {
                        let Index = US_STATE.indexOf(state) + 1
                        us_state_json.push({
                            State_Name: `${$state(`#usa_table_countries_today > tbody:nth-child(2) > tr:nth-child(${Index}) > td:nth-child(1)`).text().trim() || '0'}`,
            Total_Cases: `${$state(`#usa_table_countries_today > tbody:nth-child(2) > tr:nth-child(${Index}) > td:nth-child(2)`).text().trim() || '+0'}`,
            New_Cases: `${$state(`#usa_table_countries_today > tbody:nth-child(2) > tr:nth-child(${Index}) > td:nth-child(3)`).text().trim() || '0'}`,
            Total_Deaths: `${$state(`#usa_table_countries_today > tbody:nth-child(2) > tr:nth-child(${Index}) > td:nth-child(4)`).text().trim() || '0'}`,
            New_Deaths: `${$state(`#usa_table_countries_today > tbody:nth-child(2) > tr:nth-child(${Index}) > td:nth-child(5)`).text().trim() || '+0'}`,
            Total_Recovered: `${$state(`#usa_table_countries_today > tbody:nth-child(2) > tr:nth-child(${Index}) > td:nth-child(6)`).text().trim() || '0'}`
            })
            })
            fs.writeFileSync('./us.json', JSON.stringify(us_state_json))
            console.log('Đã ghi file us.json')
}, ms('1m'))

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
    if (req.query.lang == 'en') {
        graphqlclient.request(query).then(result => {
            var total = ""
            result.provinces.forEach(tentp => {
                var line = `${tentp.Province_Name} currently has ${tentp.Confirmed} confirmed cases, ${tentp.Deaths} deaths cases and ${tentp.Recovered} recoveries cases.\n\n`
                total += line
            })
            var response = {
                "messages": [{ "text": `${total}` }]
            }
            res.send(response)
        })
    } else {
        graphqlclient.request(query).then(result => {
            var total = ""
            result.provinces.forEach(tentp => {
                var line = `${tentp.Province_Name} hiện tại có ${tentp.Confirmed} ca nhiễm, ${tentp.Deaths} ca tử vong và ${tentp.Recovered} ca hồi phục.\n\n`
                total += line
            })
            var response = {
                "messages": [{ "text": `${total}` }]
            }
            res.send(response)
        })
    }
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
            graphqlclient.request(news_query).then(result => {
                result.topTrueNews.forEach(n => {
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
            })
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
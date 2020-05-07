const db = require('quick.db');
const graphql = require('graphql-request');
const getJSON = require('get-json');
module.exports = {
    arcgis: function(){
        let url = "https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases/FeatureServer/1/query?f=json&where=1=1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Confirmed%20desc&outSR=102100&resultOffset=0&resultRe%20cordCount=160&cacheHint=true";
        getJSON(url, async function(error, response){
            if (error) return;
            await db.set('arcgis', response)
            console.log('Đã lưu arcgis database.')
        })
    },
    vnfull: function(){
        let url = "https://corona-api.kompa.ai/graphql"
        let graphqlclient = new graphql.GraphQLClient(url, {
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
        });
        let query = `query provinces {
            provinces {
                Province_Name
                Province_Id
                Confirmed
                Deaths
                Recovered
                Last_Update
            }
            topTrueNews {
                title
                url
                siteName
                picture
                }
        }`;
        graphqlclient.request(query).then(result => {
            db.set('vnfull', result)
            console.log('Đã update database vnfull')
        })
    }
}
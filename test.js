const fs = require('fs')
async function main(){
    var response = JSON.parse(fs.readFileSync('./data/arcgis.json'))
    var state = response.features.filter(m => m.attributes.Country_Region == "Australia")
    console.log(state)
};
main();
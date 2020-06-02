const api = require('novelcovid');
api.settings({
  baseUrl: 'https://disease.sh',
});
const { laysodep } = require('./functions');
module.exports = async function App(context) {
  if (!context.event.isText) return;
  let args = context.event.text.split(' ');
  if (!args[1]) {
    let data = await api.countries({ country: args[0] });
    if (data.message) return;
    context.sendText(`${data.country} currently has ${laysodep(data.cases)}(+${laysodep(data.todayCases)}) total cases, ${laysodep(data.critical)} serious case, ${laysodep(data.deaths)}(+${laysodep(data.todayDeaths)}) cases and ${laysodep(data.recovered)}(+${laysodep(data.todayRecovered)}) recoveries cases.`);
  }
};

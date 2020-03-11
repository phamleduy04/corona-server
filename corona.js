const { MessageEmbed } = require("discord.js");
const url = "https://corona-api.kompa.ai/graphql";
const graphql = require("graphql-request");
const ascii = require('ascii-table');
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
const search = {
    "vn": "Vietnam",
    "ca": "Canada",
    "us": "US",
    "kr": "\"Korea; South\"",
    "au": "Australia",
    "cn": "China",
    "se": "Sweden",
    "hk": "Hong Kong",
    "fr": "France"
}
const quocgia = {
    "Viet Nam": "Việt Nam",
    "Canada": "Canada",
    "US": "Hoa Kì",
    "\"Korea; South\"": "Hàn Quốc",
    "Austria": "Úc",
    "China": "Trung Quốc",
    "Sweden": "Thuỵ Điển",
    "Hong Kong": "Hong Kong",
    "France": "Pháp"
}
module.exports = {
    name: "corona",
    category: "info",
    description: "Thông tin về coronavirus",
    usage: " `_corona` hoặc `_corona <mã quốc gia 2 chữ>`",
    note: "Quốc gia đang hỗ trợ: VN, CA, KR, AU, CN, SE, HK, FR ",
    run: async(client, message, args) => {
        if (!args[0]) {
            graphqlclient.request(query).then(data => {
                var confirmed = 0;
                var die = 0;
                var recovered = 0;
                data.countries.forEach(count => {
                    confirmed = confirmed + parseInt(count.Confirmed);
                    die = die + parseInt(count.Deaths);
                    recovered = recovered + parseInt(count.Recovered);
                });
                var confirmed = confirmed.toString().replace(/(-?\d+)(\d{3})/g, "$1,$2"); //Thêm dấu phẩy sau 3 chữ số (75,748)
                var die = die.toString().replace(/(-?\d+)(\d{3})/g, "$1,$2");
                var recovered = recovered.toString().replace(/(-?\d+)(\d{3})/g, "$1,$2");
                const embed = new MessageEmbed()
                    .setAuthor(`Dữ liệu được tự động cập nhật`)
                    .setTitle(`Thông tin về virus Corona (nCoV, COVID-19)`)
                    .addField(`Số lượng ca nhiễm: `, `${confirmed} ca`)
                    .addField(`Số người chết: `, `${die} người`)
                    .addField(`Số người hội phục: `, `${recovered} người`)
                    .setFooter('Nguồn: corona.kompa.ai | Made by phamleduy04#9999');
                message.channel.send(embed);
            });
        } else if (args.join(' ').toLowerCase() == "vn full") {
            graphqlclient.request(query).then(res => {
                var all_confirmed = 0;
                var all_die = 0;
                var all_recovered = 0;
                let table = new ascii("Tình hình COVID-19 ở Việt Nam")
                table.setHeading("Tỉnh thành", "Phát hiện", "Tử vong", "Bình phục")
                res.provinces.forEach(tentp => {
                    all_confirmed = all_confirmed + parseInt(tentp.Confirmed)
                    all_die = all_die + parseInt(tentp.Deaths)
                    all_recovered = all_recovered + parseInt(tentp.Recovered)
                    table.addRow(tentp.Province_Name, tentp.Confirmed, tentp.Deaths, tentp.Recovered)
                });
                table.addRow("Tổng cộng", all_confirmed.toString(), all_die.toString(), all_recovered.toString())
                return message.channel.send(table.toString(), {
                    code: 'md'
                });
            });
        } else if (args[0] && search[args[0].toLowerCase()]) {
            graphqlclient.request(query).then(result => {
                var json_data = result.countries.filter(find => find.Country_Region == search[args[0].toLowerCase()])
                var json_data = json_data[0];
                var timestamp = new Date(parseInt(json_data.Last_Update))
                var date = timestamp.getDate() + '/' + (timestamp.getMonth() + 1) + '/' + timestamp.getFullYear()
                const embed = new MessageEmbed()
                    .setAuthor(`Dữ liệu được tự động cập nhật`)
                    .setTitle(`Số ca nhiễm COVID-19 ở ${quocgia[search[args[0]]]} `)
                    .addField(`Số ca đẵ xác nhận: `, `${json_data.Confirmed} ca`)
                    .addField(`Số ca tử vong: `, `${json_data.Deaths} ca`)
                    .addField(`Số ca đã hồi phục: `, `${json_data.Recovered} ca`)
                    .addField(`Cập nhật vào ngày: `, date)
                    .setFooter(`Nguồn: corona.kompa.ai | Made by phamleduy04#9999`);
                if (search[args[0]] == "Vietnam") embed.setDescription(`Tips: Sử dụng lệnh \`_corona vn full\` để hiển thị chi tiết.`)
                message.channel.send(embed)
            });
        } else {
            message.channel.send(`Đất nước bạn đang tìm kiếm bot chưa hỗ trợ, hãy quay lại sau nhé!`)
        }
    }
}
// const config = require("../Config/configZalo");
// const axios = require('axios').default; // npm install axios
// const CryptoJS = require('crypto-js'); // npm install crypto-js
// const moment = require('moment'); // npm install moment

// const embed_data = {};

// const items = [{}];
// const transID = Math.floor(Math.random() * 1000000);
// const order = {
//     app_id: config.appid,
//     app_trans_id: `${moment().format('YYMMDD')}_${transID}`, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
//     app_user: "0903775482",
//     app_time: Date.now(), // miliseconds
//     item: JSON.stringify(items),
//     embed_data: JSON.stringify(embed_data),
//     amount: 299000,
//     description: ` Upgrade Business Plan`,
//     bank_code: "zalopayapp",
// };

// // appid|app_trans_id|appuser|amount|apptime|embeddata|item
// const data = config.appid + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
// order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();


// console.log('order', order);
// axios.post(config.endpoint, null, { params: order })
//     .then(res => {
//         console.log(res.data);
//     })
//     .catch(err => console.log(err));


const axios = require('axios').default;
const CryptoJS = require('crypto-js');
const moment = require('moment');
const config = require("../Config/configZalo");
const qs = require('qs');

function createZaloPayOrder(describe, amount) {
    const embed_data = {
        redirectUrl : "http://localhost:3000/confirm-payment"
    };

    const items = [{}];
    const transID = Math.floor(Math.random() * 1000000);
    const order = {
        app_id: config.appid,
        app_trans_id: `${moment().format('YYMMDD')}_${transID}`,
        app_user: "0903775482",
        app_time: Date.now(),
        item: JSON.stringify(items),
        embed_data: JSON.stringify(embed_data),
        amount: amount,
        description: describe, 
        bank_code: "zalopayapp", 
        callback_url: "http://localhost:4000/api/callback",
    };

    const data = config.appid + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    return axios.post(config.endpoint, null, { params: order });
}



module.exports = {
    createZaloPayOrder
};
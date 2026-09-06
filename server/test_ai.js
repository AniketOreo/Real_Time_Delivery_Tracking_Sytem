require('dotenv').config();
const { chatCustomer } = require('./src/controllers/aiController');

const req = {
  body: { message: "where is my delivery package" },
  user: { role: 'customer' }
};

const res = {
  status: (code) => {
    console.log('Status:', code);
    return res;
  },
  json: (data) => {
    console.log('JSON:', data);
  }
};

async function test() {
  await chatCustomer(req, res);
}

test();

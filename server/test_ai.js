require('dotenv').config();
const { chatCustomer } = require('./src/controllers/aiController');

const req = {
  body: { 
    message: "Order Number : DT-MRHXY7YG-812",
    history: [
      { role: 'user', parts: [{ text: "where is my delivery agent" }] },
      { role: 'model', parts: [{ text: "Could you please provide your order number? Once I have it, I'd be happy to check the status and location of your delivery." }] }
    ]
  },
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

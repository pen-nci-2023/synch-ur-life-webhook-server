const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
  console.log('Received request:', req.body);
  // Handle the request and send a response
  res.json({
    fulfillmentText: 'This is a response from your webhook!'
  });
});

app.listen(port, () => {
  console.log(`Webhook server is running on http://localhost:${port}`);
});

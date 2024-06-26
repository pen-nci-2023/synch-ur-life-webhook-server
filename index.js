// REPO: webhook-server
// index.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

// Path to your Firebase service account key file
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Express app
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Use CORS middleware
app.use(cors({
  origin: 'http://localhost:19006' // Allow only your frontend origin
}));

// Enable pre-flight across-the-board
app.options('*', cors());

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://synch-ur-life-842fe.firebaseio.com'  // Replace with your actual database URL
});

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    console.log('Received request:', JSON.stringify(req.body, null, 2));
    const queryResult = req.body.queryResult;

    if (!queryResult || !queryResult.parameters || !queryResult.parameters.test_param) {
      throw new Error('Invalid request: Missing queryResult or parameters');
    }

    const responseText = `Test parameter received: ${queryResult.parameters.test_param}`;
    console.log('Response text:', responseText);

    // Send the response back to Dialogflow
    res.json({ fulfillmentText: responseText });
  } catch (err) {
    console.error('Error processing request:', err.message);  // Logging errors
    res.json({ fulfillmentText: `Error processing request: ${err.message}` });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

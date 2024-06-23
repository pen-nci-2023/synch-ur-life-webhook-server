// REPO: webhookserver
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
  databaseURL: 'https://synch-ur-life-842fe.firebaseio.com' // Replace with your actual database URL
});

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    console.log('Received request:', JSON.stringify(req.body, null, 2));
    const queryResult = req.body.queryResult;

    if (!queryResult || !queryResult.parameters) {
      throw new Error('Invalid request: Missing queryResult or parameters');
    }

    // Forward the response from Dialogflow directly to the frontend
    const responseText = queryResult.fulfillmentText || 'No response from Dialogflow';
    res.json({ fulfillmentText: responseText });
  } catch (err) {
    res.json({ fulfillmentText: `Error getting tasks: ${err.message}` });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// REPO: webhookserver
// index.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const moment = require('moment'); // Import moment

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
    console.log('Received request:', JSON.stringify(req.body, null, 2)); // Log the entire request for debugging

    const queryResult = req.body.queryResult;
    if (!queryResult || !queryResult.parameters) {
      throw new Error('Invalid request: Missing queryResult or parameters');
    }

    const dateParameter = queryResult.parameters.date; // Capture the date parameter

    if (!dateParameter) {
      throw new Error('Missing date parameter');
    }

    // Use moment to handle date parsing
    let targetDate;
    if (dateParameter.toLowerCase() === 'today') {
      targetDate = moment();
    } else if (dateParameter.toLowerCase() === 'tomorrow') {
      targetDate = moment().add(1, 'days');
    } else if (dateParameter.toLowerCase() === 'yesterday') {
      targetDate = moment().subtract(1, 'days');
    } else {
      targetDate = moment(dateParameter, ['YYYY-MM-DD', moment.ISO_8601]);
    }

    if (!targetDate.isValid()) {
      throw new Error('Invalid date parameter');
    }

    const startOfDay = targetDate.startOf('day').toDate();
    const endOfDay = targetDate.endOf('day').toDate();

    const db = admin.firestore();
    const tasksRef = db.collection('tasks');
    const snapshot = await tasksRef.where('startDate', '>=', startOfDay).where('startDate', '<=', endOfDay).get();

    if (snapshot.empty) {
      res.json({ fulfillmentText: 'You have no tasks for the specified date. Your schedule is free.' });
    } else {
      let tasks = [];
      snapshot.forEach(doc => {
        const task = doc.data();
        tasks.push(`Description: ${task.description}, Start Date: ${task.startDate.toDate().toDateString()}, End Date: ${task.endDate.toDate().toDateString()}, Tags: ${task.tags}`);
      });
      res.json({ fulfillmentText: `Tasks: ${tasks.join(' | ')}` });
    }
  } catch (err) {
    res.json({ fulfillmentText: `Error getting tasks: ${err.message}` });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

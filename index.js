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
  databaseURL: 'https://synch-ur-life-842fe.firebaseio.com' // Replace with your actual database URL
});

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    const queryResult = req.body.queryResult;

    // Ensure queryResult and parameters exist
    if (!queryResult || !queryResult.parameters || !queryResult.parameters.date) {
      throw new Error('Invalid request: Missing queryResult or parameters');
    }

    const dateParameter = queryResult.parameters.date; // Capture the date parameter

    // Use moment to handle date parsing
    let targetDate;
    if (dateParameter === 'today') {
      targetDate = moment();
    } else if (dateParameter === 'tomorrow') {
      targetDate = moment().add(1, 'days');
    } else if (dateParameter === 'yesterday') {
      targetDate = moment().subtract(1, 'days');
    } else {
      targetDate = moment(dateParameter);
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


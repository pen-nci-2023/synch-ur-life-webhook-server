const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');  // Import cors
const admin = require('firebase-admin');

// Path to your Firebase service account key file
const serviceAccount = require('./serviceAccountKey.json');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Use CORS middleware
app.use(cors());

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://synch-ur-life-842fe.firebaseio.com'  // Replace with your actual database URL
});

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    const queryResult = req.body.queryResult;

    // Accessing all documents in the "tasks" collection
    const db = admin.firestore();
    const tasksRef = db.collection('tasks');
    const snapshot = await tasksRef.get();

    if (snapshot.empty) {
      res.json({ fulfillmentText: 'No tasks found!' });
    } else {
      let tasks = [];
      snapshot.forEach(doc => {
        const task = doc.data();
        tasks.push(`Description: ${task.description}, Start Date: ${task.startDate.toDate().toDateString()}, End Date: ${task.endDate.toDate().toDateString()}, Tags: ${task.tags}`);
      });
      res.json({ fulfillmentText: `Tasks: ${tasks.join(' | ')}` });
    }
  } catch (err) {
    res.json({ fulfillmentText: `Error getting tasks: ${err}` });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Webhook server is running on http://localhost:${port}`);
});

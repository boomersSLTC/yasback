const express = require('express');
const bcrypt = require('bcrypt');
const fileUpload = require('express-fileupload');
const admin = require('firebase-admin');
const serviceAccount = require('./key.json');
const User = require('../models/user');
const { Storage } = require("@google-cloud/storage");
const router = express.Router();
const uuid = require('uuid')

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'cybrt-81601', // Replace with your Firebase Storage bucket URL
});


const storage = new Storage({
  keyFilename: 'src/routes/key.json',
});

const bucket = storage.bucket('gs://cybrt-81601.appspot.com');

// Middleware to handle file uploads
router.use(fileUpload({
  useTempFiles : true,
  tempFileDir : 'tmp'
}));

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const newUser = new User({ 
      name, 
      email, 
      password,
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password,user.password );
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/upload', async (req, res) => {
  try {
    const {name, investigationName, investigationLocation,investigationDescription,evidenceName, evidenceDescription, evidenceType, officerName, officerBadgeNumber, victimName, victimCN, victimEmail, suspectName, suspectContactNumber, suspectEmail, analysisReportDescription, generatedDate, userId } = req.body;

    // Check if files were included in the request
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'Files are Required' });
    }

    const evidenceFile = req.files.evidenceFile;
    const analysisReportFile = req.files.analysisReportFile;

    // Create a folder with the user's username in Firebase Storage
    const userFolder = `users/${name}`;
    const frontFolder = `${userFolder}/evidenceFile`;
    const backFolder = `${userFolder}/analysisReportFile`;

    // Upload images to Firebase Cloud Storage
    const evidenceFileUpload = await bucket.upload(evidenceFile.tempFilePath, {
      destination: `${frontFolder}/${evidenceFile.name}`,
    });

    const analysisReportFileUpload = await bucket.upload(analysisReportFile.tempFilePath, {
      destination: `${backFolder}/${analysisReportFile.name}`,
    });

    const evidenceFileUrl = await evidenceFileUpload[0].getSignedUrl({ action: 'read', expires: '03-09-2491' });
    const analysisReportFileUrl = await analysisReportFileUpload[0].getSignedUrl({ action: 'read', expires: '03-09-2491' });

    const user = await User.findById(userId);

    user.investigations.push({
      investigationId: uuid.v4(),
      investigationName, 
      investigationLocation,
      investigationDescription, 
      evidenceName, 
      evidenceDescription, 
      evidenceType, 
      officerName, 
      officerBadgeNumber, 
      victimName, 
      victimCN, 
      victimEmail, 
      suspectName, 
      suspectContactNumber, 
      suspectEmail, 
      analysisReportDescription, 
      generatedDate, 
      evidenceFile: evidenceFileUrl[0], 
      analysisReportFile: analysisReportFileUrl[0],
    })

    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find();

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/investigations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Extract investigations for the user
    const investigations = user.investigations;

    res.status(200).json(investigations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/investigations/:userId/:investigationId', async (req, res) => {
  try {
    const { userId, investigationId } = req.params;
    console.log(investigationId)
    const updatedInvestigationData = req.body;

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the index of the investigation in the user's investigations array
    const investigationIndex = user.investigations.findIndex(investigation => investigation.investigationId === investigationId);

    if (investigationIndex === -1) {
      return res.status(404).json({ message: 'Investigation not found' });
    }

    // Update the investigation data
    user.investigations[investigationIndex] = {
      ...user.investigations[investigationIndex],
      ...updatedInvestigationData,
      updatedAt: Date.now(),
    };

    // Save the updated user
    await user.save();

    res.status(200).json({ message: 'Investigation updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;

// src/app.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://dunkinburner:yasiru@cluster0.fg6uk0s.mongodb.net/?retryWrites=true&w=majority');

// Define routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);


const startServer = async () => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();
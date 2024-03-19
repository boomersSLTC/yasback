const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  investigations: [
    {
      investigationId: { type: String},
      investigationName: { type: String},
      investigationLocation: { type: String},
      investigationDescription: { type: String},
      evidenceName: { type: String},
      evidenceDescription: { type: String},
      evidenceType: { type: String},
      officerName: { type: String},
      officerBadgeNumber: { type: String},
      victimName: { type: String},
      victimCN: { type: String},
      victimEmail: { type: String},
      suspectName: { type: String},
      suspectContactNumber: { type: String},
      suspectEmail: { type: String},
      analysisReportDescription: { type: String},
      generatedDate: { type: Date, default: Date.now },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      evidenceFile: { type: String },
      analysisReportFile: { type: String },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.userId) {
    this.userId = uuidv4();
  }
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

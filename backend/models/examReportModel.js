import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  time: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  }
}, { _id: false });

const ExamReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  studentName: {
    type: String,
    default: 'Student'
  },
  examName: {
    type: String,
    default: 'Islamic Quiz Challenge'
  },
  score: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 50
  },
  status: {
    type: String,
    default: 'Completed'
  },
  suspicionScore: {
    type: Number,
    default: 0
  },
  videoUrl: {
    type: String,
    default: ''
  },
  videoBase64: {
    type: String,
    default: ''
  },
  events: {
    type: [EventSchema],
    default: []
  }
}, {
  timestamps: true
});

export const ExamReport = mongoose.models.ExamReport || mongoose.model('ExamReport', ExamReportSchema);
export default ExamReport;

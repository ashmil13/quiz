import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
});

const ExamReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  examName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Completed', 'Terminated'],
    required: true
  },
  suspicionScore: {
    type: Number,
    required: true
  },
  videoUrl: {
    type: String,
    default: ''
  },
  videoBase64: {
    type: String,
    default: ''
  },
  events: [EventSchema]
}, {
  timestamps: true
});

export const ExamReport = mongoose.models.ExamReport || mongoose.model('ExamReport', ExamReportSchema);
export default ExamReport;

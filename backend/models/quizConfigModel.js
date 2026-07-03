import mongoose from 'mongoose';

const QuizConfigSchema = new mongoose.Schema({
  isProctorEnabled: {
    type: Boolean,
    default: true
  },
  maxWarnings: {
    type: Number,
    default: 2
  },
  examDuration: {
    type: Number,
    default: 30 // seconds per question
  }
}, {
  timestamps: true,
  collection: 'quizconfig'
});

export const QuizConfig = mongoose.model('QuizConfig', QuizConfigSchema);
export default QuizConfig;

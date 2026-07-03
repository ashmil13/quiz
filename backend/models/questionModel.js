import mongoose from 'mongoose';

const OptionSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  }
});

const QuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [OptionSchema],
  answer: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const Question = mongoose.model('Question', QuestionSchema);
export default Question;

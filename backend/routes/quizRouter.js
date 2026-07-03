import express from 'express';
import {
  generateQuiz,
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getQuizConfig,
  updateQuizConfig
} from '../controllers/quizController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to generate quiz questions dynamically
router.post('/generate', generateQuiz);

// Quiz questions CRUD
router.get('/questions', getQuestions);
router.post('/questions', protect, addQuestion);
router.put('/questions/:id', protect, updateQuestion);
router.delete('/questions/:id', protect, deleteQuestion);

// Quiz Configuration
router.get('/config', getQuizConfig);
router.put('/config', protect, updateQuizConfig);

export default router;

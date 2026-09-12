import express from 'express';
import {
  uploadExamReport,
  getAllReports,
  getReportDetail,
  checkUserAttempt,
  deleteReport,
  seedSampleReportsEndpoint,
  restoreDatabaseEndpoint
} from '../controllers/examReportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes for Exam Proctor Reports
router.post('/upload', protect, uploadExamReport);
router.get('/all', protect, getAllReports);
router.post('/seed', protect, seedSampleReportsEndpoint);
router.post('/restore', protect, restoreDatabaseEndpoint);
router.get('/check-attempt', protect, checkUserAttempt);
router.get('/:id', protect, getReportDetail);
router.delete('/:id', protect, deleteReport);

export default router;

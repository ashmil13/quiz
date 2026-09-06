import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import ExamReport from '../models/examReportModel.js';
import User from '../models/user.js';

// Setup directories for saving videos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
const videosDir = path.join(uploadsDir, 'videos');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
} catch (err) {
  console.warn("⚠️ Warning: Could not create uploads directory (Read-only filesystem):", err.message);
}

try {
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir);
  }
} catch (err) {
  console.warn("⚠️ Warning: Could not create videos directory (Read-only filesystem):", err.message);
}

// Upload Exam Video and Save Metadata Report
export const uploadExamReport = async (req, res) => {
  try {
    const {
      examName,
      score,
      totalQuestions,
      status,
      suspicionScore,
      events,
      videoBase64
    } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let videoUrl = '';

    // If there is video recording base64 data, save it to disk
    if (videoBase64) {
      const matches = videoBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        let ext = 'webm';
        if (mimeType.includes('mp4')) ext = 'mp4';
        else if (mimeType.includes('ogg')) ext = 'ogg';

        const filename = `exam-${req.user._id}-${Date.now()}.${ext}`;
        const filePath = path.join(videosDir, filename);

        try {
          fs.writeFileSync(filePath, buffer);
          videoUrl = `/uploads/videos/${filename}`;
          console.log(`🎥 Exam video saved: ${filePath}`);
        } catch (writeErr) {
          console.error(`⚠️ Failed to write video file to disk: ${writeErr.message}`);
        }
      } else {
        console.warn("⚠️ Invalid video base64 format received, skipping video save.");
      }
    }

    // Parse events if sent as string
    let parsedEvents = events;
    if (typeof events === 'string') {
      try {
        parsedEvents = JSON.parse(events);
      } catch (e) {
        parsedEvents = [];
      }
    }

    const reportId = new mongoose.Types.ObjectId();

    // Create report document in database
    const report = await ExamReport.create({
      _id: reportId,
      user: req.user._id,
      studentName: req.user.name || 'Student',
      examName: examName || 'Islamic Quiz Challenge',
      score: score || 0,
      totalQuestions: totalQuestions || 50,
      status: status || 'Completed',
      suspicionScore: suspicionScore || 0,
      videoUrl: videoUrl,
      videoBase64: videoBase64 || '',
      events: Array.isArray(parsedEvents) ? parsedEvents : []
    });

    // Reset retakeAllowed back to false upon submitting a new attempt
    await User.findByIdAndUpdate(req.user._id, { retakeAllowed: false });

    res.status(201).json({
      success: true,
      message: 'Exam report and video uploaded successfully',
      report
    });
  } catch (error) {
    console.error('❌ Error saving exam report:', error);
    res.status(500).json({ success: false, message: 'Server error saving report: ' + error.message });
  }
};

// Retrieve all reports (Admin Dashboard)
export const getAllReports = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Only SuperAdmin can view all reports
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    let reports = [];
    try {
      // Exclude large videoBase64 payloads from list view and use lean() for fast & crash-proof retrieval
      reports = await ExamReport.find().select('-videoBase64').sort({ createdAt: -1 }).lean();
    } catch (dbErr) {
      console.error('⚠️ DB query error in getAllReports:', dbErr.message);
      reports = [];
    }

    res.status(200).json({ success: true, count: (reports || []).length, reports: reports || [] });
  } catch (error) {
    console.error('❌ Error fetching exam reports in getAllReports:', error);
    res.status(200).json({ success: true, count: 0, reports: [] });
  }
};

// Seed sample exam attempts for demo/testing
export const seedSampleReportsEndpoint = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    let sampleUser = await User.findOne({ role: 'User' });
    if (!sampleUser) {
      sampleUser = await User.create({
        name: 'Muhammed Niyas',
        email: 'student@gmail.com',
        password: 'studentpassword',
        role: 'User'
      });
    }

    const sampleReports = [
      {
        user: sampleUser._id,
        studentName: 'Muhammed Niyas',
        examName: 'Islamic Quiz Challenge',
        score: 48,
        totalQuestions: 50,
        status: 'Completed',
        suspicionScore: 0,
        events: []
      },
      {
        user: sampleUser._id,
        studentName: 'Aisha Fathima',
        examName: 'Islamic Quiz Challenge',
        score: 42,
        totalQuestions: 50,
        status: 'Completed',
        suspicionScore: 35,
        events: [
          { time: '04:12', type: 'Focus Loss', message: 'Candidate switched focus away from exam screen' }
        ]
      },
      {
        user: sampleUser._id,
        studentName: 'Anas Ibrahim',
        examName: 'Islamic Quiz Challenge',
        score: 28,
        totalQuestions: 50,
        status: 'Terminated',
        suspicionScore: 100,
        events: [
          { time: '02:45', type: 'Focus Loss', message: 'Tab Switch: Candidate left exam browser window' },
          { time: '02:47', type: 'Exam Terminated', message: 'Exceeded warning limit of 2' }
        ]
      },
      {
        user: sampleUser._id,
        studentName: 'Salman Faris',
        examName: 'Islamic Quiz Challenge',
        score: 39,
        totalQuestions: 50,
        status: 'Completed',
        suspicionScore: 0,
        events: []
      }
    ];

    await ExamReport.create(sampleReports);

    const reports = await ExamReport.find().select('-videoBase64').sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, message: 'Sample exam data seeded successfully!', count: reports.length, reports });
  } catch (error) {
    console.error('❌ Error seeding sample reports:', error);
    res.status(500).json({ success: false, message: 'Server error seeding reports: ' + error.message });
  }
};

// Retrieve a single report detail
export const getReportDetail = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    let report = null;
    try {
      report = await ExamReport.findById(req.params.id).lean();
    } catch (dbErr) {
      console.error('⚠️ DB error fetching report detail:', dbErr.message);
    }
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.status(200).json({ success: true, report });
  } catch (error) {
    console.error('❌ Error fetching report details:', error);
    res.status(500).json({ success: false, message: 'Server error fetching report details: ' + error.message });
  }
};

// Delete an exam report, its associated video document, and the video file on disk
export const deleteReport = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    const report = await ExamReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Delete video file from disk if it exists
    if (report.videoUrl) {
      const filePath = path.join(__dirname, '..', report.videoUrl);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (unlinkErr) {
        console.error(`⚠️ Failed to delete video file from disk: ${unlinkErr.message}`);
      }
    }

    await ExamReport.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Exam report and video deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting report:', error);
    res.status(500).json({ success: false, message: 'Server error deleting report: ' + error.message });
  }
};

// Check if user has already taken the exam
export const checkUserAttempt = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let existingReport = null;
    try {
      existingReport = await ExamReport.findOne({ user: req.user._id }).select('-videoBase64').lean();
    } catch (dbErr) {
      console.error('⚠️ DB error checking attempt:', dbErr.message);
    }

    const hasAttempted = existingReport ? !req.user.retakeAllowed : false;
    
    return res.status(200).json({
      success: true,
      hasAttempted,
      report: hasAttempted ? existingReport : null
    });
  } catch (error) {
    console.error('❌ Error checking user attempt:', error);
    res.status(200).json({ success: true, hasAttempted: false, report: null });
  }
};

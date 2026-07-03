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

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir);
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
      // Expect base64 header: data:video/webm;base64,...
      const matches = videoBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Determine file extension
        let ext = 'webm';
        if (mimeType.includes('mp4')) ext = 'mp4';
        else if (mimeType.includes('ogg')) ext = 'ogg';

        const filename = `exam-${req.user._id}-${Date.now()}.${ext}`;
        const filePath = path.join(videosDir, filename);

        // Write binary buffer to file
        fs.writeFileSync(filePath, buffer);
        videoUrl = `/uploads/videos/${filename}`;
        console.log(`🎥 Exam video saved: ${filePath}`);
      } else {
        console.warn("⚠️ Invalid video base64 format received, skipping video save.");
      }
    }

    // Parse events if sent as string
    let parsedEvents = events;
    if (typeof events === 'string') {
      parsedEvents = JSON.parse(events);
    }

    const reportId = new mongoose.Types.ObjectId();

    // Create report document in database
    const report = await ExamReport.create({
      _id: reportId,
      user: req.user._id,
      studentName: req.user.name,
      examName: examName || 'Islamic Quiz Challenge',
      score: score || 0,
      totalQuestions: totalQuestions || 5,
      status: status || 'Completed',
      suspicionScore: suspicionScore || 0,
      videoUrl: videoUrl,
      videoBase64: videoBase64 || '', // Store the base64 video directly in the DB
      events: parsedEvents || []
    });

    // Reset retakeAllowed back to false upon submitting a new attempt
    await User.findByIdAndUpdate(req.user._id, { retakeAllowed: false });

    res.status(201).json({
      success: true,
      message: 'Exam report and video uploaded successfully',
      report
    });
  } catch (error) {
    console.error('Error saving exam report:', error);
    res.status(500).json({ success: false, message: 'Server error saving report: ' + error.message });
  }
};

// Retrieve all reports (Admin Dashboard)
export const getAllReports = async (req, res) => {
  try {
    // Only SuperAdmin can view all reports
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    const reports = await ExamReport.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reports.length, reports });
  } catch (error) {
    console.error('Error fetching exam reports:', error);
    res.status(500).json({ success: false, message: 'Server error fetching reports' });
  }
};

// Retrieve a single report detail
export const getReportDetail = async (req, res) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    const report = await ExamReport.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.status(200).json({ success: true, report });
  } catch (error) {
    console.error('Error fetching report details:', error);
    res.status(500).json({ success: false, message: 'Server error fetching report details' });
  }
};

// Delete an exam report, its associated video document, and the video file on disk
export const deleteReport = async (req, res) => {
  try {
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
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await ExamReport.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Exam report and video deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ success: false, message: 'Server error deleting report' });
  }
};

// Check if user has already taken the exam
export const checkUserAttempt = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const existingReport = await ExamReport.findOne({ user: req.user._id });
    const hasAttempted = existingReport ? !req.user.retakeAllowed : false;
    
    return res.status(200).json({
      success: true,
      hasAttempted,
      report: hasAttempted ? existingReport : null
    });
  } catch (error) {
    console.error('Error checking user attempt:', error);
    res.status(500).json({ success: false, message: 'Server error checking attempt status' });
  }
};

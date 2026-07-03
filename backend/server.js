import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import User from './models/user.js';
import userRouter from './routes/userRouter.js';
import quizRouter from './routes/quizRouter.js';
import examReportRouter from './routes/examReportRouter.js';
import Question from './models/questionModel.js';
import QuizConfig from './models/quizConfigModel.js';

// Setup paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environmental variables
dotenv.config();

// Create Express app
const app = express();

// Seed SuperAdmin account
const seedSuperAdmin = async () => {
  try {
    const adminEmail = 'sumi@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'Sumi',
        email: adminEmail,
        password: 'ashmilashmil', // encrypted by mongoose pre('save') middleware
        role: 'SuperAdmin'
      });
      console.log('✅ SuperAdmin user seeded: sumi@gmail.com / ashmilashmil');
    } else {
      // Ensure role is SuperAdmin and password is up-to-date
      existingAdmin.role = 'SuperAdmin';
      existingAdmin.password = 'ashmilashmil'; // encrypted by mongoose pre('save')
      await existingAdmin.save();
      console.log('✅ SuperAdmin user updated: sumi@gmail.com / ashmilashmil');
    }
  } catch (err) {
    console.error('❌ Error seeding SuperAdmin user:', err.message);
  }
};

// Seed default Quiz Config and Quiz Questions
const seedQuizData = async () => {
  try {
    const configCount = await QuizConfig.countDocuments();
    if (configCount === 0) {
      await QuizConfig.create({
        isProctorEnabled: true,
        maxWarnings: 2,
        examDuration: 30
      });
      console.log('✅ Default QuizConfig seeded.');
    }

    const questionCount = await Question.countDocuments();
    if (questionCount === 0) {
      const defaultQuestions = [
        {
          question: "“യാസീൻ” ഏത് സൂറത്തിന്റെ പേരാണ്?",
          options: [
            { key: "A", text: "അൽബഖറ" },
            { key: "B", text: "യാസീൻ" },
            { key: "C", text: "അൽഫാതിഹ" },
            { key: "D", text: "അന്നിസാ" }
          ],
          answer: "B"
        },
        {
          question: "ഖുർആനിലെ ഏറ്റവും വലിയ സൂറത്ത് ഏതാണ്?",
          options: [
            { key: "A", text: "അൽബഖറ" },
            { key: "B", text: "ആലു ഇംറാൻ" },
            { key: "C", text: "യാസീൻ" },
            { key: "D", text: "അൽമാഇദ" }
          ],
          answer: "A"
        },
        {
          question: "ഖുർആൻ ആദ്യമായി അവതരിക്കപ്പെട്ട മാസം ഏതാണ്?",
          options: [
            { key: "A", text: "റജബ്" },
            { key: "B", text: "ശഅ്ബാൻ" },
            { key: "C", text: "റമദാൻ" },
            { key: "D", text: "ദുൽഹിജ്ജ" }
          ],
          answer: "C"
        },
        {
          question: "ബിസ്മി ഇല്ലാതെ ആരംഭിക്കുന്ന സൂറത്ത് ഏതാണ്?",
          options: [
            { key: "A", text: "അത്തൗബ" },
            { key: "B", text: "അൽഫാതിഹ" },
            { key: "C", text: "അൽഇഖ്ലാസ്" },
            { key: "D", text: "അൽകാഫിറൂൻ" }
          ],
          answer: "A"
        },
        {
          question: "ഖുർആനിലെ ഏറ്റവും ചെറിയ സൂറത്ത് ഏതാണ്?",
          options: [
            { key: "A", text: "അൽഫലഖ്" },
            { key: "B", text: "അൽഅസ്വർ" },
            { key: "C", text: "അൽഫാതിഹ" },
            { key: "D", text: "അൽകൗഥർ" }
          ],
          answer: "D"
        }
      ];
      await Question.insertMany(defaultQuestions);
      console.log('✅ Default quiz questions seeded.');
    }
  } catch (err) {
    console.error('❌ Error seeding quiz data:', err.message);
  }
};

// Connect to MongoDB Database
connectDB()
  .then((connected) => {
    if (connected) {
      seedSuperAdmin();
      seedQuizData();
    }
  })
  .catch((err) => {
    console.error('⚠️ Database connection failed. Seeding skipped.', err.message);
  });

// Middlewares
const allowedOrigins = [
  'http://localhost:5173',
  'https://quiz-lmgq.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Increase JSON body payload size to accept base64 videos (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routes
app.use('/api', userRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/exam-report', examReportRouter);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the MVC Backend API',
    endpoints: {
      auth: '/api',
      quiz: '/api/quiz',
      reports: '/api/exam-report'
    },
  });
});

// Start server
// if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running in development mode on port ${PORT}`);
    console.log(`📡 Health Check URL: http://localhost:${PORT}/`);
    console.log(`📂 Static Uploads URL: http://localhost:${PORT}/uploads/`);
  });
// }

export default app;


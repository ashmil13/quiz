// Node 18+ global.fetch is built-in.
import Question from '../models/questionModel.js';
import QuizConfig from '../models/quizConfigModel.js';

// In-memory fallback database of quizzes for standard topics
const MOCK_QUIZZES = {
  "quran": [
    {
      id: 1,
      question: "ഖുർആനിൽ ആകെ എത്ര അധ്യായങ്ങൾ (സൂറത്തുകൾ) ഉണ്ട്?",
      options: [
        { key: "A", text: "114" },
        { key: "B", text: "112" },
        { key: "C", text: "116" },
        { key: "D", text: "120" }
      ],
      answer: "A"
    },
    {
      id: 2,
      question: "ആദ്യമായി ഖുർആൻ സൂക്തങ്ങൾ അവതരിക്കപ്പെട്ട ഗുഹ ഏതാണ്?",
      options: [
        { key: "A", text: "സൗർ ഗുഹ" },
        { key: "B", text: "ഹിറാ ഗുഹ" },
        { key: "C", text: "ഉഹ്ദ് ഗുഹ" },
        { key: "D", text: "ബദർ ഗുഹ" }
      ],
      answer: "B"
    },
    {
      id: 3,
      question: "ഖുർആനിലെ ഏറ്റവും വലിയ അധ്യായം ഏതാണ്?",
      options: [
        { key: "A", text: "അൽ-ബഖറ" },
        { key: "B", text: "ആലു ഇംറാൻ" },
        { key: "C", text: "യാസീൻ" },
        { key: "D", text: "അൻ-നിസാ" }
      ],
      answer: "A"
    },
    {
      id: 4,
      question: "ഖുർആന്റെ ഹൃദയം എന്നറിയപ്പെടുന്ന സൂറത്ത് ഏതാണ്?",
      options: [
        { key: "A", text: "അൽ-ഫാതിഹ" },
        { key: "B", text: "യാസീൻ" },
        { key: "C", text: "അൽ-ഇഖ്ലാസ്" },
        { key: "D", text: "അൽ-മുൽക്" }
      ],
      answer: "B"
    },
    {
      id: 5,
      question: "ഖുർആനിൽ 'ബിസ്മി' ഇല്ലാതെ ആരംഭിക്കുന്ന ഏക സൂറത്ത് ഏതാണ്?",
      options: [
        { key: "A", text: "അൽ-കഹ്ഫ്" },
        { key: "B", text: "അൻ-നൂർ" },
        { key: "C", text: "അത്-തൗബ" },
        { key: "D", text: "അൽ-ഫലഖ്" }
      ],
      answer: "C"
    }
  ],
  "science": [
    {
      id: 1,
      question: "ഭൂമിയോട് ഏറ്റവും അടുത്ത നക്ഷത്രം ഏതാണ്?",
      options: [
        { key: "A", text: "വ്യാഴം" },
        { key: "B", text: "സൂര്യൻ" },
        { key: "C", text: "പ്രോക്സിമ സെഞ്ചുറി" },
        { key: "D", text: "സിറിയസ്" }
      ],
      answer: "B"
    },
    {
      id: 2,
      question: "മനുഷ്യ ശരീരത്തിലെ ഏറ്റവും വലിയ അവയവം ഏതാണ്?",
      options: [
        { key: "A", text: "കരൾ" },
        { key: "B", text: "ഹൃദയം" },
        { key: "C", text: "ത്വക്ക്" },
        { key: "D", text: "മസ്തിഷ്കം" }
      ],
      answer: "C"
    },
    {
      id: 3,
      question: "വെള്ളത്തിന്റെ രാസസൂത്രം എന്താണ്?",
      options: [
        { key: "A", text: "CO2" },
        { key: "B", text: "H2O" },
        { key: "C", text: "NaCl" },
        { key: "D", text: "O2" }
      ],
      answer: "B"
    },
    {
      id: 4,
      question: "ഗുരുത്വാകർഷണ നിയമം കണ്ടെത്തിയത് ആരാണ്?",
      options: [
        { key: "A", text: "ആൽബർട്ട് ഐൻസ്റ്റീൻ" },
        { key: "B", text: "ഗലീലിയോ ഗലീലി" },
        { key: "C", text: "സർ ഐസക് ന്യൂട്ടൺ" },
        { key: "D", text: "മേരി ക്യൂറി" }
      ],
      answer: "C"
    },
    {
      id: 5,
      question: "ഭൂമിയുടെ അന്തരീക്ഷത്തിൽ ഏറ്റവും കൂടുതലുള്ള വാതകം ഏതാണ്?",
      options: [
        { key: "A", text: "ഓക്സിജൻ" },
        { key: "B", text: "നൈട്രജൻ" },
        { key: "C", text: "കാർബൺ ഡയോക്സൈഡ്" },
        { key: "D", text: "ഹൈഡ്രജൻ" }
      ],
      answer: "B"
    }
  ]
};

// Main generator controller
export const generateQuiz = async (req, res) => {
  const { topic } = req.body;
  
  if (!topic) {
    return res.status(400).json({ success: false, message: "Topic is required" });
  }

  const cleanTopic = topic.trim().toLowerCase();
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      console.log(`🤖 Requesting Gemini to generate quiz for topic: ${topic}`);
      const prompt = `
        Generate exactly 5 multiple-choice questions on the topic "${topic}".
        Write the questions in Malayalam if suitable (like Islamic history, Quran, local facts) or English, with Malayalam translation inside parentheses if appropriate.
        Format the response strictly as a JSON array of objects. Do not wrap the JSON in markdown code blocks like \`\`\`json or \`\`\`. 
        Here is the JSON structure:
        [
          {
            "id": 1,
            "question": "Question text",
            "options": [
              {"key": "A", "text": "Option A text"},
              {"key": "B", "text": "Option B text"},
              {"key": "C", "text": "Option C text"},
              {"key": "D", "text": "Option D text"}
            ],
            "answer": "A"
          }
        ]
        Make sure the keys in options are "A", "B", "C", "D" and the "answer" field has one of these keys.
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        }
      );

      const data = await response.json();
      
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        const jsonText = data.candidates[0].content.parts[0].text.trim();
        const questions = JSON.parse(jsonText);
        
        if (Array.isArray(questions) && questions.length > 0) {
          return res.status(200).json({
            success: true,
            provider: "Gemini AI",
            questions: questions.map((q, idx) => ({
              ...q,
              id: idx + 1 // Ensure clean IDs
            }))
          });
        }
      }
      
      throw new Error("Invalid response format from Gemini API");
    } catch (error) {
      console.warn("⚠️ Gemini generation failed, falling back to mock generator:", error.message);
    }
  }

  // Fallback Mock Logic
  console.log(`ℹ️ Using mock generation for topic: ${topic}`);
  
  // Direct match fallback
  if (cleanTopic.includes("quran") || cleanTopic.includes("ഖുർആൻ")) {
    return res.status(200).json({ success: true, provider: "Mock AI (Quran Database)", questions: MOCK_QUIZZES.quran });
  }
  
  if (cleanTopic.includes("science") || cleanTopic.includes("ശാസ്ത്രം")) {
    return res.status(200).json({ success: true, provider: "Mock AI (Science Database)", questions: MOCK_QUIZZES.science });
  }

  // Generic Dynamic Mock Generator for any topic
  const genericQuestions = [
    {
      id: 1,
      question: `What is the primary significance of ${topic} in modern history?`,
      options: [
        { key: "A", text: `It revolutionized the understanding of ${topic}.` },
        { key: "B", text: `It had no major impact but was widely popular.` },
        { key: "C", text: `It was discovered by accident in ancient times.` },
        { key: "D", text: `It is primarily used for commercial purposes.` }
      ],
      answer: "A"
    },
    {
      id: 2,
      question: `Which country or region is most historically associated with the development of ${topic}?`,
      options: [
        { key: "A", text: "Middle East & Arabia" },
        { key: "B", text: "Western Europe" },
        { key: "C", text: "East Asia" },
        { key: "D", text: "Global phenomenon with no single origin" }
      ],
      answer: "D"
    },
    {
      id: 3,
      question: `In what year or era did ${topic} see its most significant advancement?`,
      options: [
        { key: "A", text: "The early 20th Century" },
        { key: "B", text: "The Golden Age of Islamic Science" },
        { key: "C", text: "The late 21st Century" },
        { key: "D", text: "The Industrial Revolution" }
      ],
      answer: "B"
    },
    {
      id: 4,
      question: `What is the main challenge faced by researchers studying ${topic} today?`,
      options: [
        { key: "A", text: "Lack of public interest and funding." },
        { key: "B", text: "Conflicting historical accounts and resources." },
        { key: "C", text: "Environmental constraints." },
        { key: "D", text: "Technological limitations." }
      ],
      answer: "B"
    },
    {
      id: 5,
      question: `Which of the following is a primary pillar or key concept of ${topic}?`,
      options: [
        { key: "A", text: "Ethical alignment and preservation." },
        { key: "B", text: "Rapid expansion without guidelines." },
        { key: "C", text: "Purely financial valuation." },
        { key: "D", text: "None of the above." }
      ],
      answer: "A"
    }
  ];

  return res.status(200).json({
    success: true,
    provider: `Mock AI (Dynamic ${topic} Generator)`,
    questions: genericQuestions
  });
};

// Get all quiz questions
export const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find({}).sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: questions.length, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add a new quiz question
export const addQuestion = async (req, res) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied. SuperAdmin only' });
    }
    const { question, options, answer } = req.body;
    const newQuestion = await Question.create({ question, options, answer });
    res.status(201).json({ success: true, question: newQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update an existing quiz question
export const updateQuestion = async (req, res) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied. SuperAdmin only' });
    }
    const { question, options, answer } = req.body;
    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      { question, options, answer },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.status(200).json({ success: true, question: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a quiz question
export const deleteQuestion = async (req, res) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied. SuperAdmin only' });
    }
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.status(200).json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get quiz configuration
export const getQuizConfig = async (req, res) => {
  try {
    let config = await QuizConfig.findOne({});
    if (!config) {
      config = await QuizConfig.create({
        isProctorEnabled: true,
        maxWarnings: 2,
        examDuration: 30
      });
    }
    res.status(200).json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update quiz configuration
export const updateQuizConfig = async (req, res) => {
  try {
    if (req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied. SuperAdmin only' });
    }
    const { isProctorEnabled, maxWarnings, examDuration } = req.body;
    let config = await QuizConfig.findOne({});
    if (!config) {
      config = await QuizConfig.create({
        isProctorEnabled: isProctorEnabled ?? true,
        maxWarnings: maxWarnings ?? 2,
        examDuration: examDuration ?? 30
      });
    } else {
      config.isProctorEnabled = isProctorEnabled ?? config.isProctorEnabled;
      config.maxWarnings = maxWarnings ?? config.maxWarnings;
      config.examDuration = examDuration ?? config.examDuration;
      await config.save();
    }
    res.status(200).json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

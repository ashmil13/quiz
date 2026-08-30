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

// Disable ETag caching to prevent 304 CORS header cache issues on Vercel
app.disable('etag');

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
    if (questionCount < 50) {
      await Question.deleteMany({}); // Reset old dummy questions
      const defaultQuestions = [
        {
          question: "യാസീൻ സൂറത്തിൽ ആകെ എത്ര ആയത്തുകളും (സൂക്തങ്ങൾ) റുകൂഉകളും (വിഭാഗങ്ങൾ) ഉൾക്കൊള്ളുന്നു?",
          options: [
            { key: "A", text: "80 ആയത്തുകൾ, 4 റുകൂഉകൾ" },
            { key: "B", text: "83 ആയത്തുകൾ, 5 റുകൂഉകൾ" },
            { key: "C", text: "85 ആയത്തുകൾ, 6 റുകൂഉകൾ" },
            { key: "D", text: "82 ആയത്തുകൾ, 5 റുകൂഉകൾ" }
          ],
          answer: "B"
        },
        {
          question: "യാസീൻ സൂറത്തിന് 'ഖുർആന്റെ ഹൃദയം' എന്ന് പേര് വരാനുള്ള കാരണമായി ഇമാം ഗസ്സാലി (റ) വ്യക്തമാക്കിയത് എന്താണ്?",
          options: [
            { key: "A", text: "ഏറ്റവും നീളമേറിയ അധ്യായമായതിനാൽ" },
            { key: "B", text: "ഖിയാമത്ത് നാളിനെയും സംഭവവികാസങ്ങളെയും കുറിച്ച് കൂടുതൽ വിവരിച്ചതിനാൽ" },
            { key: "C", text: "തൗഹീദ് മാത്രം ചർച്ച ചെയ്തതിനാൽ" },
            { key: "D", text: "പ്രവാചക ചരിത്രങ്ങൾ കൂടുതൽ വിവരിച്ചതിനാൽ" }
          ],
          answer: "B"
        },
        {
          question: "'യാസീൻ' എന്ന വാക്കിന് 'ഹെ, മനുഷ്യാ' (യാ ഇൻസാൻ) എന്ന് അർത്ഥം കൽപ്പിച്ച സ്വഹാബി ആര്?",
          options: [
            { key: "A", text: "അബൂബക്കർ (റ)" },
            { key: "B", text: "അലി (റ)" },
            { key: "C", text: "ഇബ്നു അബ്ബാസ് (റ)" },
            { key: "D", text: "ഉമർ (റ)" }
          ],
          answer: "C"
        },
        {
          question: "'പിതാക്കൾക്ക് താക്കീത് നൽകപ്പെടാത്ത ഒരു ജനത' എന്ന് ആറാം വചനത്തിൽ പരാമർശിച്ചത് ആരെക്കുറിച്ചാണ്?",
          options: [
            { key: "A", text: "പേർഷ്യക്കാർ" },
            { key: "B", text: "റോമാക്കാർ" },
            { key: "C", text: "വേദക്കാരല്ലാത്ത അറബ്യൻ ജനത" },
            { key: "D", text: "ബനൂ ഇസ്രാഈല്യർ" }
          ],
          answer: "C"
        },
        {
          question: "7-ാം ആയത്തിലെ 'വാക്ക് സ്ഥിരപ്പെട്ടു കഴിഞ്ഞിരിക്കുന്നു' (ഹഖൽ ഖൗൽ) എന്ന പ്രയോഗത്തിന്റെ താല്പര്യമെന്ത്?",
          options: [
            { key: "A", text: "സത്യം പൂർത്തിയായി" },
            { key: "B", text: "ഹൃദയം ദുഷിച്ചതിനാൽ ശിക്ഷയെക്കുറിച്ചുള്ള താക്കീത് ബാധകമായിക്കഴിഞ്ഞു" },
            { key: "C", text: "വാഗ്ദത്തം നടപ്പിലായി" },
            { key: "D", text: "ആയുസ്സ് അവസാനിച്ചു" }
          ],
          answer: "B"
        },
        {
          question: "അവിശ്വാസികളുടെ അവസ്ഥ ചിത്രീകരിക്കാൻ എട്ടാം വചനത്തിൽ ഉപയോഗിച്ച 'അഗ്ലാൽ' എന്ന പദത്തിന്റെ അർത്ഥമെന്ത്?",
          options: [
            { key: "A", text: "മൂടുപടങ്ങൾ" },
            { key: "B", text: "ആമങ്ങൾ (വിലങ്ങുകൾ)" },
            { key: "C", text: "കല്ലുകൾ" },
            { key: "D", text: "ഭാരങ്ങൾ" }
          ],
          answer: "B"
        },
        {
          question: "സത്യം മനസ്സിലാക്കാത്തവിധം അവിശ്വാസികളുടെ മുന്നിലും പിന്നിലും 'സദ്ദ്' ഏർപ്പെടുത്തി എന്ന് ഒമ്പതാം വചനത്തിലുണ്ട്. എന്താണ് 'സദ്ദ്' എന്നാൽ?",
          options: [
            { key: "A", text: "തടവ് / മറ / അണ" },
            { key: "B", text: "തീച്ചൂള" },
            { key: "C", text: "ഇരുമ്പ് കാവൽ" },
            { key: "D", text: "അന്ധത" }
          ],
          answer: "A"
        },
        {
          question: "ആരെ താക്കീത് ചെയ്യുമ്പോഴാണ് ഫലപ്രദമാവുക എന്നാണ് പതിനൊന്നാം വചനത്തിൽ പറയുന്നത്?",
          options: [
            { key: "A", text: "നേതാക്കന്മാരെ" },
            { key: "B", text: "പ്രമാണത്തെ പിന്തുടരുകയും അദൃശ്യമായി റഹ്മാനെ ഭയപ്പെടുകയും ചെയ്യുന്നവരെ" },
            { key: "C", text: "പ്രായം ചെന്നവരെ" },
            { key: "D", text: "സമ്പന്നരെ" }
          ],
          answer: "B"
        },
        {
          question: "പന്ത്രണ്ടാം സൂക്തത്തിലെ 'ഇമാമുൻ മുബീൻ' എന്നതുകൊണ്ട് വിവക്ഷിക്കുന്നത് എന്തിനെയാണ്?",
          options: [
            { key: "A", text: "വ്യക്തമായ പ്രവാചകൻ" },
            { key: "B", text: "സുവ്യക്തമായ മൂലരേഖ (കേന്ദ്രഗ്രന്ഥം / ലൗഹുൽ മഹ്ഫൂള്)" },
            { key: "C", text: "നേരായ മാർഗ്ഗം" },
            { key: "D", text: "സ്വർഗ്ഗകവാടം" }
          ],
          answer: "B"
        },
        {
          question: "സൂറത്തു യാസീനിൽ പറയുന്ന 'അസ്ഹാബുൽ ഖർയഃ' (രാജ്യക്കാർ) ഏത് നാട്ടുകാരായിരുന്നുവെന്നാണ് ഭൂരിപക്ഷം മുഫസ്സിറുകളുടെ അഭിപ്രായം?",
          options: [
            { key: "A", text: "മദ്യൻ" },
            { key: "B", text: "അന്താക്കിയ" },
            { key: "C", text: "യമൻ" },
            { key: "D", text: "ഈജിപ്ത്" }
          ],
          answer: "B"
        },
        {
          question: "അന്താക്കിയാ നിവാസികളിലേക്ക് ആദ്യം അയക്കപ്പെട്ട രണ്ട് ദൂതന്മാർക്ക് ശക്തി പകരാൻ അല്ലാഹു അയച്ച മൂന്നാമത്തെ ദൂതൻ ഉൾപ്പെടെ ദൂതന്മാരുടെ ആകെ എണ്ണം എത്ര?",
          options: [
            { key: "A", text: "2" },
            { key: "B", text: "3" },
            { key: "C", text: "4" },
            { key: "D", text: "5" }
          ],
          answer: "B"
        },
        {
          question: "[Read Carefully] ത്വൗറാത്ത് അവതരിച്ചതിനുശേഷം ഒരു ജനത മുഴുവനായി പൊതുശിക്ഷയാൽ നശിപ്പിക്കപ്പെട്ടിട്ടില്ലെന്ന വാദത്തിന്റെ അടിസ്ഥാനത്തിൽ, യാസീനിലെ രാജ്യം 'അന്താക്കിയ' ആകാൻ വഴിയില്ലന്ന് നിരീക്ഷിച്ച പണ്ഡിതൻ ആര്?",
          options: [
            { key: "A", text: "ഇമാം ത്വബ്രി" },
            { key: "B", text: "ഇബ്നു കഥീർ (റ)" },
            { key: "C", text: "ഇമാം റാസി" },
            { key: "D", text: "ഇമാം ഖുർത്വുബി" }
          ],
          answer: "B"
        },
        {
          question: "ദൂതന്മാരോട് അവിശ്വാസികൾ നടത്തിയ ഭീഷണി എന്തായിരുന്നു?",
          options: [
            { key: "A", text: "നാടുകടത്തൽ" },
            { key: "B", text: "കല്ലെറിഞ്ഞു കൊല്ലലും വേദനയേറിയ ശിക്ഷയും" },
            { key: "C", text: "കാരാഗൃഹവാസം" },
            { key: "D", text: "പിഴ ചുമത്തൽ" }
          ],
          answer: "B"
        },
        {
          question: "ദൂതന്മാരെ പിന്തുണച്ച് പട്ടണത്തിന്റെ അങ്ങേയറ്റത്തുനിന്ന് ഓടിവന്ന സൽപുരുഷനെക്കുറിച്ച് ഖുർആൻ എന്തു പറയുന്നു?",
          options: [
            { key: "A", text: "ജാഉ മിൻ അഖ്സ്വൽ മദീനതി റജുലുൻ യസ്ആ" },
            { key: "B", text: "ജാഅ റസൂലുൻ" },
            { key: "C", text: "ഖാല ഇംറഉൻ" },
            { key: "D", text: "നസല മലകുൻ" }
          ],
          answer: "A"
        },
        {
          question: "ആ മനുഷ്യൻ ജനങ്ങളോട് ദൂതന്മാരെ പിന്തുടരാൻ പറഞ്ഞ പ്രധാന ന്യായമെന്തായിരുന്നു?",
          options: [
            { key: "A", text: "അവർ രാജാക്കന്മാരാണ്" },
            { key: "B", text: "അവർ പ്രതിഫലം ചോദിക്കാത്തവരും സന്മാർഗ്ഗികളുമാണ്" },
            { key: "C", text: "അവർ ധനികരാണ്" },
            { key: "D", text: "അവർ അത്ഭുതങ്ങൾ കാട്ടുന്നവരാണ്" }
          ],
          answer: "B"
        },
        {
          question: "[Read Carefully] ആ സൽപുരുഷൻ ജനങ്ങൾക്ക് അപരിചിതനായിരുന്നുവെന്ന് ഖുർആനിലെ പ്രയോഗങ്ങളിൽ നിന്ന് വ്യക്തമാക്കിയ മുഫസ്സിർ ആര്?",
          options: [
            { key: "A", text: "ഇമാം റാസി (റ)" },
            { key: "B", text: "ഇമാം ബഗ്വവി" },
            { key: "C", text: "ഇമാം ഗസ്സാലി" },
            { key: "D", text: "ഇബ്നു അബ്ബാസ്" }
          ],
          answer: "A"
        },
        {
          question: "'എന്നെ സൃഷ്ടിച്ചവനെ ഞാൻ ആരാധിക്കാതിരിക്കാൻ എനിക്കെന്ത് ന്യായം' എന്ന് ചോദിച്ചതിനു ശേഷം സത്യവിശ്വാസം പ്രഖ്യാപിച്ച ആ വ്യക്തിയോട് മരണാനന്തരം പറയപ്പെട്ട വാചകമെന്ത്?",
          options: [
            { key: "A", text: "ഉദ്ഖുലിൽ ജന്നഃ (നീ സ്വർഗ്ഗത്തിൽ പ്രവേശിക്കുക)" },
            { key: "B", text: "നജ്ജയ്നാക" },
            { key: "C", text: "അബ്ശിർ ബിൽ ഖൈർ" },
            { key: "D", text: "ഇർജിഅ് ഇലാ റബ്ബിക" }
          ],
          answer: "A"
        },
        {
          question: "സ്വർഗ്ഗപ്രവേശന വേളയിൽ ആ സൽപുരുഷൻ പ്രകടിപ്പിച്ച ആഗ്രഹം എന്തായിരുന്നു?",
          options: [
            { key: "A", text: "ശത്രുക്കളെ ശിക്ഷിക്കുന്നത് കാണാൻ" },
            { key: "B", text: "അല്ലാഹു തനിക്ക് പാപങ്ങൾ പൊറുത്തുതന്ന വിവരവും ആദരിച്ചതും തന്റെ ജനത അറിഞ്ഞിരുന്നെങ്കിൽ എന്ന്" },
            { key: "C", text: "വീണ്ടും ദുൻയാവിലേക്ക് മടങ്ങാൻ" },
            { key: "D", text: "കൂടുതൽ സമ്പത്ത് ലഭിക്കാൻ" }
          ],
          answer: "B"
        },
        {
          question: "ദൂതന്മാരെ നിഷേധിച്ച ആ ജനതയെ അല്ലാഹു നശിപ്പിച്ചത് എങ്ങനെയായിരുന്നു?",
          options: [
            { key: "A", text: "ആകാശത്തുനിന്ന് സൈന്യത്തെ ഇറക്കി" },
            { key: "B", text: "വെള്ളപ്പൊക്കം വഴി" },
            { key: "C", text: "ഒരൊറ്റ ഘോരശബ്ദം (സ്വയ്ഹത്തൻ വാഹിദഃ) വഴി" },
            { key: "D", text: "ഭൂമികുലുക്കം വഴി" }
          ],
          answer: "C"
        },
        {
          question: "'യാ ഹസ്രതൻ അലൽ ഇബാദ്' എന്ന 30-ാം ആയത്ത് വ്യക്തമാക്കുന്നത് എന്താണ്?",
          options: [
            { key: "A", text: "ദാസന്മാരുടെ മേലുള്ള ഖേദം/സങ്കടം" },
            { key: "B", text: "പ്രവാചകന്മാരുടെ ദുഃഖം" },
            { key: "C", text: "മലക്കുകളുടെ പ്രാർത്ഥന" },
            { key: "D", text: "സ്വർഗ്ഗവാസികളുടെ വികാരം" }
          ],
          answer: "A"
        },
        {
          question: "നിർജ്ജീവമായ ഭൂമി ജീവിപ്പിക്കുന്ന ദൃഷ്ടാന്തത്തിൽ അറബികൾക്ക് ഏറ്റവും പരിചിതമായ ഏതെല്ലാം തോട്ടങ്ങളാണ് എടുത്തുപറഞ്ഞിരിക്കുന്നത്?",
          options: [
            { key: "A", text: "ആപ്പിൾ, ഓറഞ്ച്" },
            { key: "B", text: "ഈത്തപ്പന, മുന്തിരി" },
            { key: "C", text: "അത്തി, ഒലിവ്" },
            { key: "D", text: "മാതളം, മാവ്" }
          ],
          answer: "B"
        },
        {
          question: "'സുബ്ഹാനല്ലദീ ഖലഖൽ അസ്വാജ കുല്ലഹാ...' (36-ാം ആയത്ത്) പ്രഖ്യാപിക്കുന്നത് അല്ലാഹുവിന്റെ ഏത് കഴിവാണ്?",
          options: [
            { key: "A", text: "ഭൂമിയിലെയും മനുഷ്യരിലെയും അവർക്കറിയാത്തതുമായ സർവ്വ വസ്തുക്കളുടെയും ഇണകളെ സൃഷ്ടിച്ച പരിശുദ്ധി" },
            { key: "B", text: "മഴ പെയ്യിക്കൽ" },
            { key: "C", text: "മലക്കുകളെ സൃഷ്ടിക്കൽ" },
            { key: "D", text: "സൂര്യനെ നിലനിർത്തൽ" }
          ],
          answer: "A"
        },
        {
          question: "രാപ്പകലുകളുടെ മാറ്റത്തെ ഖുർആൻ ഉപമിച്ചിരിക്കുന്നത് ഏതിനോടാണ്?",
          options: [
            { key: "A", text: "വസ്ത്രം മാറുന്നതിനോട്" },
            { key: "B", text: "തോലുരിച്ച് വേർപെടുത്തുന്നതിനോട് (നസ്ലഖു)" },
            { key: "C", text: "തിരമാലകൾ അടിക്കുന്നതിനോട്" },
            { key: "D", text: "വിളക്കണയുന്നതിനോട്" }
          ],
          answer: "B"
        },
        {
          question: "സൂര്യന്റെ സഞ്ചാരത്തെക്കുറിച്ച് 38-ാം ആയത്തിൽ പറയുന്നത് എന്താണ്?",
          options: [
            { key: "A", text: "അത് നിശ്ചലമാണ്" },
            { key: "B", text: "അത് അതിന്റെതായ ഒരു താവളത്തിലേക്ക് ചലിച്ചുകൊണ്ടിരിക്കുന്നു" },
            { key: "C", text: "ചന്ദ്രനെ ചുറ്റുന്നു" },
            { key: "D", text: "ഒരു ലക്ഷ്യവുമില്ലാതെ നീങ്ങുന്നു" }
          ],
          answer: "B"
        },
        {
          question: "ചന്ദ്രന്റെ വൃദ്ധിക്ഷയങ്ങൾക്കൊടുവിലത്തെ രൂപത്തെ ഖുർആൻ ഉപമിച്ചിരിക്കുന്നത് ഏതിനോടാണ്?",
          options: [
            { key: "A", text: "വള്ളിനൂൽ" },
            { key: "B", text: "ഉണങ്ങിപ്പഴകിയ ഈത്തപ്പനക്കുലത്തണ്ട് (ഉർജൂനിൽ ഖദീം)" },
            { key: "C", text: "വളഞ്ഞ വാൾ" },
            { key: "D", text: "അമ്പടയാളം" }
          ],
          answer: "B"
        },
        {
          question: "[Read Carefully] 'കുല്ലുൻ ഫീ ഫലകിൻ യസ്ബഹൂൻ' എന്ന ആയത്തിൽ 'യസ്ബഹൂൻ' എന്ന ക്രിയ ബഹുവചനത്തിലും ബുദ്ധിജീവികൾക്ക് ഉപയോഗിക്കുന്ന രൂപത്തിലും വരാൻ കാരണമായി തഫ്സീറിൽ പറയുന്നതെന്ത്?",
          options: [
            { key: "A", text: "വ്യാകരണപരമായ മാറ്റം മാത്രം" },
            { key: "B", text: "സൂര്യനും ചന്ദ്രനും ഭൂമിയും രാപകലുമെല്ലാം സ്വന്തം ഭ്രമണപഥത്തിൽ ബുദ്ധിജീവികളെപ്പോലെ കൃത്യമായ ചലനങ്ങൾ നിർവ്വഹിക്കുന്നു എന്ന സൂചന നൽകാൻ" },
            { key: "C", text: "മലക്കുകൾ അവയെ നയിക്കുന്നതിനാൽ" },
            { key: "D", text: "നക്ഷത്രങ്ങളെ മാത്രം ഉദ്ദേശിച്ചതിനാൽ" }
          ],
          answer: "B"
        },
        {
          question: "'നിറക്കപ്പെട്ട കപ്പലിൽ അവരുടെ സന്തതികളെ നാം വഹിച്ചു' എന്നത് ഏത് ചരിത്രസംഭവത്തിലേക്കുള്ള സൂചനയായി കണക്കാക്കാം?",
          options: [
            { key: "A", text: "മൂസാ നബിയുടെ യാത്ര" },
            { key: "B", text: "നൂഹ് നബിയുടെ കപ്പൽ" },
            { key: "C", text: "യൂനുസ് നബിയുടെ സംഭവം" },
            { key: "D", text: "സുലൈമാൻ നബിയുടെ യാത്ര" }
          ],
          answer: "B"
        },
        {
          question: "'ഇൻ നശഅ് നുഗ്രിഖ്ഹും' (നാം ഉദ്ദേശിച്ചാൽ അവരെ മുക്കിക്കളയും) എന്ന ആയത്ത് ഓർമ്മിപ്പിക്കുന്നത് എന്തിനെയാണ്?",
          options: [
            { key: "A", text: "യാത്രാവാഹനങ്ങളുടെ സുരക്ഷ അല്ലാഹുവിന്റെ കാരുണ്യത്തിലാണ് നിലകൊള്ളുന്നത്" },
            { key: "B", text: "കപ്പൽ നിർമ്മാണം തെറ്റാണ്" },
            { key: "C", text: "കടൽയാത്ര ഒഴിവാക്കണം" },
            { key: "D", text: "കൊടുങ്കാറ്റുകളെക്കുറിച്ച്" }
          ],
          answer: "A"
        },
        {
          question: "'നിങ്ങളുടെ മുമ്പിലുള്ളതും പിമ്പിലുള്ളതും സൂക്ഷിക്കുക' (45-ാം ആയത്ത്) എന്നതിലെ 'മുമ്പിലുള്ളത്', 'പിമ്പിലുള്ളത്' എന്നിവയുടെ വിവക്ഷ എന്താണ്?",
          options: [
            { key: "A", text: "ധനവും സന്താനങ്ങളും" },
            { key: "B", text: "മുൻസമുദായങ്ങൾക്ക് ബാധിച്ച ഐഹികശിക്ഷകളും വരാനിരിക്കുന്ന പരലോകശിക്ഷയും" },
            { key: "C", text: "ഭൂമിയും ആകാശവും" },
            { key: "D", text: "നന്മകളും തിന്മകളും" }
          ],
          answer: "B"
        },
        {
          question: "'അല്ലാഹു ഉദ്ദേശിച്ചിരുന്നെങ്കിൽ ഭക്ഷണം നൽകുമായിരുന്നവർക്ക് ഞങ്ങളന്തിന് നൽകണം' എന്ന് പറഞ്ഞ് ദാനധർമ്മങ്ങളെ പരിഹസിച്ചത് ആരായിരുന്നു?",
          options: [
            { key: "A", text: "മുനാഫിഖുകൾ" },
            { key: "B", text: "സത്യനിഷേധികൾ (കാഫിറുകൾ)" },
            { key: "C", text: "ദരിദ്രർ" },
            { key: "D", text: "യഹൂദന്മാർ" }
          ],
          answer: "B"
        },
        {
          question: "അന്ത്യനാളിനെ പരിഹസിച്ചുകൊണ്ട് അവിശ്വാസികൾ ചോദിച്ച ചോദ്യമെന്തായിരുന്നു?",
          options: [
            { key: "A", text: "മതാ ഹാദൽ വഅ്ദു ഇൻ കുൻതും സ്വാദിഖീൻ (നിങ്ങൾ സത്യവാന്മാരാണെങ്കിൽ ഈ വാഗ്ദത്തം എപ്പോഴാണ്?)" },
            { key: "B", text: "മൻ റബ്ബുക്കും" },
            { key: "C", text: "ഐനൽ ജന്നഃ" },
            { key: "D", text: "കൈഫ യഹ്ശൂറുനാ" }
          ],
          answer: "A"
        },
        {
          question: "കാഹളത്തിൽ ഊതപ്പെടുമ്പോൾ ഖബ്റുകളിൽ നിന്ന് ആളുകൾ എങ്ങോട്ടാണ് ധൃതിപ്പെട്ട് വരിക?",
          options: [
            { key: "A", text: "വീടുകളിലേക്ക്" },
            { key: "B", text: "തങ്ങളുടെ റബ്ബിങ്കലേക്ക് (മഹ്ശറിലേക്ക്)" },
            { key: "C", text: "സ്വർഗ്ഗത്തിലേക്ക്" },
            { key: "D", text: "മലക്കുകളിലേക്ക്" }
          ],
          answer: "B"
        },
        {
          question: "പുനരുത്ഥാന വേളയിൽ 'ഞങ്ങളുടെ നാശമേ, ഞങ്ങൾ ഉറങ്ങുന്നിടത്തുനിന്ന് ഞങ്ങളെ ഉയിർത്തെഴുന്നേൽപ്പിച്ചതാര്' എന്ന് ചോദിക്കുന്നത് ആരാണ്?",
          options: [
            { key: "A", text: "സത്യവിശ്വാസികൾ" },
            { key: "B", text: "അവിശ്വാസികൾ" },
            { key: "C", text: "മലക്കുകൾ" },
            { key: "D", text: "ജിന്നുകൾ" }
          ],
          answer: "B"
        },
        {
          question: "സ്വർഗ്ഗവാസികൾ അന്ന് ഏർപ്പെട്ടിരിക്കുക എന്തിലായിരിക്കും എന്നാണ് 55-ാം ആയത്ത് പറയുന്നത്?",
          options: [
            { key: "A", text: "കഠിന ജോലിയിൽ" },
            { key: "B", text: "ആനന്ദകരമായ സുഖഭോഗങ്ങളിൽ (ഫീ ശുഗുലിൻ ഫാകിഹൂൻ)" },
            { key: "C", text: "വിചാരണയിൽ" },
            { key: "D", text: "ദീർഘനിദ്രയിൽ" }
          ],
          answer: "B"
        },
        {
          question: "സ്വർഗ്ഗവാസികൾക്ക് കരുണാനിധിയായ രക്ഷിതാവിൽനിന്ന് ലഭിക്കുന്ന അഭിവാദന വചനം എന്താണ്?",
          options: [
            { key: "A", text: "മർഹബൻ" },
            { key: "B", text: "സലാം ഖൗലൻ മിൻ റബ്ബിൻ റഹീം" },
            { key: "C", text: "അഹ്ലൻ" },
            { key: "D", text: "തഹിയ്യത്ത്" }
          ],
          answer: "B"
        },
        {
          question: "അന്ത്യനാളിൽ കുറ്റവാളികളോട് അല്ലാഹു കൽപ്പിക്കുന്ന ആദ്യ വേർതിരിവ് എന്താണ്?",
          options: [
            { key: "A", text: "ഇംതാസുൽ യൗമ അയ്യുഹൽ മുജ്രിമൂൻ (ഹെ കുറ്റവാളികളേ, ഇന്ന് നിങ്ങൾ വേർതിരിഞ്ഞു നിൽക്കുവിൻ)" },
            { key: "B", text: "പോയി രക്ഷപ്പെടുവിൻ" },
            { key: "C", text: "മറുപടി പറയുക" },
            { key: "D", text: "മിണ്ടാതിരിക്കുക" }
          ],
          answer: "A"
        },
        {
          question: "'ആദം സന്തതികളേ, നിങ്ങൾ പിശാചിനെ ആരാധിക്കരുത്' എന്നതിൽ 'ആരാധിക്കരുത്' എന്നതിന്റെ പ്രധാന താല്പര്യമെന്ത്?",
          options: [
            { key: "A", text: "അവനെ കാണരുത്" },
            { key: "B", text: "അവനെ അനുസരിക്കരുത് / വഴിപ്പെടരുത്" },
            { key: "C", text: "അവനോട് സംസാരിക്കരുത്" },
            { key: "D", text: "അവനെ ഭയപ്പെടരുത്" }
          ],
          answer: "B"
        },
        {
          question: "65-ാം ആയത്തു പ്രകാരം ന്യായവിധി നാളിൽ വായകൾക്ക് മുദ്രവെച്ചാൽ മനുഷ്യന്റെ പ്രവർത്തനങ്ങൾക്ക് സാക്ഷി പറയുന്ന അവയവങ്ങൾ ഏവ?",
          options: [
            { key: "A", text: "കണ്ണും കാതും" },
            { key: "B", text: "കൈകളും കാലുകളും" },
            { key: "C", text: "നാക്കും ചുണ്ടും" },
            { key: "D", text: "മുടിയും നഖവും" }
          ],
          answer: "B"
        },
        {
          question: "[Read Carefully] ദീർഘായുസ്സ് ലഭിക്കുമ്പോൾ മനുഷ്യന്റെ ശാരീരിക പ്രകൃതിയിൽ വിപരീതാവസ്ഥ (നുനക്കിസ്ഹു ഫിൽ ഖൽഖ്) വരുത്തുന്നുവെന്ന ആയത്ത് (68) സ്ഥാപിക്കുന്ന പ്രധാന യാഥാർത്ഥ്യമെന്ത്?",
          options: [
            { key: "A", text: "ആയുസ്സ് കുറയുന്നു" },
            { key: "B", text: "മനുഷ്യന്റെ രൂപവും കഴിവും മാറ്റാൻ അല്ലാഹുവിന് പൂർണ്ണ കഴിവുണ്ടന്ന പുനരുത്ഥാന തെളിവ്" },
            { key: "C", text: "പ്രായം കൂടുന്നത് നല്ലതാണ്" },
            { key: "D", text: "മരണം ഒഴിവാക്കാം" }
          ],
          answer: "B"
        },
        {
          question: "നബി(സ)യെ കവി എന്ന് അവിശ്വാസികൾ ആക്ഷേപിച്ചതിനെ ഖുർആൻ നിഷേധിച്ചത് എങ്ങനെയാണ്?",
          options: [
            { key: "A", text: "അദ്ദേഹം ഗായകനാണ്" },
            { key: "B", text: "നാം അദ്ദേഹത്തിന് കവിത പഠിപ്പിച്ചിട്ടില്ല, അതദ്ദേഹത്തിന് യോജിച്ചതുമല്ല" },
            { key: "C", text: "അദ്ദേഹം കവിത ഇഷ്ടപ്പെടുന്നില്ല" },
            { key: "D", text: "കവിതകൾ ഇല്ലാത്ത കാലമാണ്" }
          ],
          answer: "B"
        },
        {
          question: "അല്ലാഹു മനുഷ്യർക്ക് വിധേയമാക്കിക്കൊടുത്ത കന്നുകാലികളിൽ നിന്ന് മനുഷ്യർക്ക് ലഭിക്കുന്ന പ്രയോജനങ്ങളായി ഖുർആൻ എണ്ണിയവ ഏവ?",
          options: [
            { key: "A", text: "വാഹനമായും ഭക്ഷണമായും പാനീയങ്ങളായും ഉപയോഗിക്കാം" },
            { key: "B", text: "വേട്ടയാടാൻ മാത്രം" },
            { key: "C", text: "വിൽക്കാൻ മാത്രം" },
            { key: "D", text: "ഭാരം ചുമക്കാൻ മാത്രം" }
          ],
          answer: "A"
        },
        {
          question: "മനുഷ്യന്റെ സൃഷ്ടിപ്പിന്റെ ഉത്ഭവമായി 77-ാം ആയത്തിൽ പറയുന്നത് എന്തിനെയാണ്?",
          options: [
            { key: "A", text: "കളിമണ്ണ്" },
            { key: "B", text: "ഇന്ദ്രിയത്തുള്ളി (നുത്വ്ഫഃ)" },
            { key: "C", text: "രക്തക്കട്ട" },
            { key: "D", text: "കാറ്റ്" }
          ],
          answer: "B"
        },
        {
          question: "അസ്ഥികൾ ദ്രവിച്ചുപോയ ശേഷം ആരാണ് ഇതിന് ജീവൻ നൽകുക എന്ന് ചോദിച്ച് തർക്കിച്ച സത്യനിഷേധിക്ക് ഖുർആൻ നൽകിയ യുക്തിഭദ്രമായ മറുപടി എന്ത്?",
          options: [
            { key: "A", text: "ആരും ജീവിപ്പിക്കില്ല" },
            { key: "B", text: "ഒന്നാം പ്രാവശ്യം അതിനെ ഉണ്ടാക്കിയവൻ ആരോ അവൻ തന്നെ വീണ്ടും ജീവിപ്പിക്കും" },
            { key: "C", text: "അതൊരു രഹസ്യമാണ്" },
            { key: "D", text: "പ്രകൃതി ജീവിപ്പിക്കും" }
          ],
          answer: "B"
        },
        {
          question: "[Read Carefully] പച്ചമരത്തിൽ നിന്ന് തീയുണ്ടാക്കിത്തരുന്നവൻ എന്ന 80-ാം ആയത്തിന്റെ വ്യാഖ്യാനത്തിൽ, പുരാതന അറേബ്യയിൽ ഉരസി തീയുണ്ടാക്കാൻ ഉപയോഗിച്ചിരുന്ന രണ്ട് മരങ്ങൾ ഏതെല്ലാമാണ്?",
          options: [
            { key: "A", text: "സൈത്തൂൻ, തീൻ" },
            { key: "B", text: "മറഖ്, അഫാർ" },
            { key: "C", text: "സിദ്ർ, സമർ" },
            { key: "D", text: "ഖത്വോഫ്, അരാക്" }
          ],
          answer: "B"
        },
        {
          question: "'കുൻ ഫയകൂൻ' (ഉണ്ടാവുക എന്ന് പറഞ്ഞാൽ അത് ഉണ്ടാകുന്നു) എന്നത് അല്ലാഹുവിന്റെ ഏത് പരമാധികാരത്തെ കുറിക്കുന്നു?",
          options: [
            { key: "A", text: "സൃഷ്ടിപ്പിലുള്ള അപാരമായ ഉദ്ദേശ്യശക്തിയും കഴിവും" },
            { key: "B", text: "ശബ്ദത്തിന്റെ മഹത്വം" },
            { key: "C", text: "പ്രപഞ്ചത്തിന്റെ വലിപ്പം" },
            { key: "D", text: "സമയത്തിന്റെ പ്രാധാന്യം" }
          ],
          answer: "A"
        },
        {
          question: "[Read Carefully] സൂറത്തു യാസീൻ 52-ാം ആയത്തിലെ 'മൻ ബഅഥനാ മിൻ മർഖദിനാ' (ഞങ്ങളുടെ ഉറങ്ങുന്നിടത്തുനിന്ന് ഞങ്ങളെ എഴുന്നേൽപ്പിച്ചതാര്) എന്ന വാക്യത്തെക്കുറിച്ച് ഉബയ്യുബ്നു കഅ്ബ് (റ) വ്യക്തമാക്കിയ അഭിപ്രായം എന്താണ്?",
          options: [
            { key: "A", text: "അവർക്ക് യാതൊരു ശിക്ഷയുമില്ലായിരുന്നു" },
            { key: "B", text: "പുനരുത്ഥാനത്തിന് തൊട്ടുമുമ്പായി അല്ലാഹു അവർക്ക് ഒരു യഥാർത്ഥ ഉറക്കം നൽകുന്നതാണ്" },
            { key: "C", text: "അവർ സ്വപ്നം കാണുകയായിരുന്നു" },
            { key: "D", text: "അവർ മരണപ്പെട്ടിരുന്നില്ല" }
          ],
          answer: "B"
        },
        {
          question: "[Read Carefully] 'അൽ-ഖാമൂസ്', 'ലിസാനുൽ അറബ്' എന്നീ പ്രമുഖ നിഘണ്ടുക്കളിൽ 'ബർസഖ്' എന്ന പദത്തിന് നൽകിയിട്ടുള്ള നിർവ്വചനം എന്താണ്?",
          options: [
            { key: "A", text: "സ്വർഗ്ഗത്തിനും നരകത്തിനും ഇടയിലുള്ള മതിൽ" },
            { key: "B", text: "മരണസമയം മുതൽ പുനരുത്ഥാനം വരെയുള്ള കാലവും രണ്ട് വസ്തുക്കൾക്കിടയിലെ മറയും" },
            { key: "C", text: "വിചാരണാ വേദി" },
            { key: "D", text: "ആത്മാക്കളുടെ ഉറക്കം" }
          ],
          answer: "B"
        },
        {
          question: "[Read Carefully] 'ഹുജ്ജത്തുല്ലാഹിൽ ബാലിഗഃ' എന്ന വിഖ്യാത തത്ത്വചിന്താപരമായ ഗ്രന്ഥം രചിച്ച പണ്ഡിതൻ ആര്?",
          options: [
            { key: "A", text: "ഇമാം ഗസ്സാലി (റ)" },
            { key: "B", text: "അല്ലാമ ഷാ വലിയ്യുല്ലാഹിദ്ദേഹ്ലവി (റ)" },
            { key: "C", text: "ഇബ്നു തൈമിയ്യ (റ)" },
            { key: "D", text: "ഇമാം നവവി (റ)" }
          ],
          answer: "B"
        },
        {
          question: "[Read Carefully] അഭൗതിക യാഥാർത്ഥ്യങ്ങളെ (ഖബ്റിലെ അനുഭവങ്ങൾ, മലക്കുകളുടെ സാന്നിധ്യം തുടങ്ങിയവ) ഉൾക്കൊള്ളുന്നതിൽ ജനങ്ങൾ സ്വീകരിക്കുന്ന മൂന്ന് നിലപാടുകളെ വിശകലനം ചെയ്ത രണ്ട് പ്രമുഖ പണ്ഡിതന്മാർ ആരെല്ലാം?",
          options: [
            { key: "A", text: "ഇമാം ഗസ്സാലി (റ), ഷാ വലിയ്യുല്ലാഹിദ്ദേഹ്ലവി (റ)" },
            { key: "B", text: "ഇമാം ഷാഫിഈ, ഇമാം മാലിക്" },
            { key: "C", text: "ഇമാം ബുഖാരി, ഇമാം മുസ്ലിം" },
            { key: "D", text: "ഇബ്നു ഹസ്മ്, ഇബ്നു ഖയ്യിം" }
          ],
          answer: "A"
        },
        {
          question: "[Read Carefully] ഖബ്റിൽ വെച്ച് പാമ്പ് കടിക്കുന്ന വേദന അനുഭവപ്പെടുന്നത് ബാഹ്യനേത്രങ്ങൾ കൊണ്ട് കാണാൻ കഴിയാത്തതിന് ഇമാം ഗസ്സാലി (റ) നൽകുന്ന ഉപമ എന്ത്?",
          options: [
            { key: "A", text: "വെള്ളത്തിലെ പ്രതിബിംബം" },
            { key: "B", text: "ഒരാൾ സ്വപ്നത്തിൽ പാമ്പ് കടിച്ച് വേദനകൊണ്ട് നിലവിളിക്കുമ്പോൾ അരികിലിരിക്കുന്നയാൾ അത് കാണാത്ത അവസ്ഥ" },
            { key: "C", text: "കാറ്റിന്റെ ചലനം" },
            { key: "D", text: "കണ്ണാടിയിലെ രൂപം" }
          ],
          answer: "B"
        }
      ];
      await Question.insertMany(defaultQuestions);
      console.log('✅ Default quiz questions (50) seeded successfully.');
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

// Dynamic CORS middleware supporting all local ports (localhost:5173, 5174, 3000, etc.) and Vercel deployments
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Origin');

  // Respond immediately to OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Increase JSON body payload size to accept base64 videos (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serverless-friendly DB Connection Middleware
let dbInitPromise = null;
const ensureDbConnected = async (req, res, next) => {
  // Skip DB check for OPTIONS preflight requests
  if (req.method === 'OPTIONS') return next();

  try {
    const mongoose = (await import('mongoose')).default;
    if (mongoose.connection.readyState !== 1) {
      if (!dbInitPromise) {
        dbInitPromise = (async () => {
          await connectDB();
          await seedSuperAdmin();
          await seedQuizData();
        })();
      }
      await dbInitPromise;
    }
    next();
  } catch (err) {
    dbInitPromise = null; // Reset promise to retry on next request
    console.error('❌ DB Connection error in middleware:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed: ' + err.message
    });
  }
};

app.use(ensureDbConnected);

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

// Global Express Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Global Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running in development mode on port ${PORT}`);
    console.log(`📡 Health Check URL: http://localhost:${PORT}/`);
    console.log(`📂 Static Uploads URL: http://localhost:${PORT}/uploads/`);
  });
}

export default app;


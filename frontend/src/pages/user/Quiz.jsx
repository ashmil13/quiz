import React, { useState, useEffect, useRef } from 'react';
import { Play, Award, Timer, RotateCcw, BookOpen, AlertCircle, AlertTriangle, Camera, Mic, Shield, ShieldAlert, Volume2, UserCheck, RefreshCw, Sparkles, Activity, FileText, CheckCircle2, Lock, Move } from 'lucide-react';
import axios from '../../axios';
import { loadTensorFlowAndBlazeFace, startCamera, stopStream, startVoiceDetection, startMediaRecorder, stopMediaRecorder, blobToBase64 } from '../../services/proctorHelper';
import useAuth from '../../hooks/useAuth';
import '../../css/userstyle/quiz.css';

const QUESTIONS = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
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
    id: 5,
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
    id: 6,
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
    id: 7,
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
    id: 8,
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
    id: 9,
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
    id: 10,
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
    id: 11,
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
    id: 12,
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
    id: 13,
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
    id: 14,
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
    id: 15,
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
    id: 16,
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
    id: 17,
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
    id: 18,
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
    id: 19,
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
    id: 20,
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
    id: 21,
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
    id: 22,
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
    id: 23,
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
    id: 24,
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
    id: 25,
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
    id: 26,
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
    id: 27,
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
    id: 28,
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
    id: 29,
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
    id: 30,
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
    id: 31,
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
    id: 32,
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
    id: 33,
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
    id: 34,
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
    id: 35,
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
    id: 36,
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
    id: 37,
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
    id: 38,
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
    id: 39,
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
    id: 40,
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
    id: 41,
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
    id: 42,
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
    id: 43,
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
    id: 44,
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
    id: 45,
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
    id: 46,
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
    id: 47,
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
    id: 48,
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
    id: 49,
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
    id: 50,
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

function Quiz() {
  const { auth } = useAuth();
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const [gameState, setGameState] = useState('start'); // 'start' | 'verification' | 'quiz' | 'result'
  const [quizQuestions, setQuizQuestions] = useState(QUESTIONS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedKey, setSelectedKey] = useState(null);
  const [score, setScore] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // AI Quiz Generator states
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorMessage, setGeneratorMessage] = useState('');

  // Proctoring configurations
  const [isProctorEnabled, setIsProctorEnabled] = useState(true);
  const [maxWarnings, setMaxWarnings] = useState(2);
  const [examDuration, setExamDuration] = useState(30);
  const [proctorStatus, setProctorStatus] = useState('init'); // 'init' | 'loading' | 'ready' | 'verifying' | 'success' | 'failed'
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationLog, setVerificationLog] = useState('Initialize camera stream...');

  // Proctoring active logs
  const [proctorLogs, setProctorLogs] = useState([]);
  const [warnings, setWarnings] = useState(0);
  const [suspicionScore, setSuspicionScore] = useState(0);
  const [warningModal, setWarningModal] = useState({ show: false, title: '', message: '' });
  const [faceStatus, setFaceStatus] = useState('Active');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Loading/Uploading states for submission
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const [hasAttempted, setHasAttempted] = useState(false);
  const [checkingAttempt, setCheckingAttempt] = useState(true);
  const [attemptReport, setAttemptReport] = useState(null);
  const [examStatus, setExamStatus] = useState('Completed'); // 'Completed' | 'Terminated'

  // Pre-exam Compulsory Camera state
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraPermissionBlocked, setCameraPermissionBlocked] = useState(false);
  const preCheckVideoRef = useRef(null);

  const timerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const videoRef = useRef(null);
  const floatingVideoRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Streams & Model References
  const [cameraStream, setCameraStream] = useState(null);
  const [faceModel, setFaceModel] = useState(null);
  const isMonitoringActive = useRef(false);
  const recorderStateRef = useRef(null);

  // Proctoring consecutive trigger counts & limiters
  const lastViolationTime = useRef(0);
  const noFaceCount = useRef(0);
  const multiFaceCount = useRef(0);

  // Draggable Floating Camera State & Event Logic (Touch & Mouse)
  const [camPos, setCamPos] = useState(null);
  const [isDraggingCam, setIsDraggingCam] = useState(false);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handleDragStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();

    dragOffsetRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    isDraggingRef.current = true;
    setIsDraggingCam(true);
  };

  useEffect(() => {
    const handleDragMove = (e) => {
      if (!isDraggingRef.current) return;
      if (e.touches && e.cancelable) {
        e.preventDefault();
      }

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const newLeft = clientX - dragOffsetRef.current.x;
      const newTop = clientY - dragOffsetRef.current.y;

      const containerWidth = isMobile ? 110 : 140;
      const containerHeight = isMobile ? 140 : 180;

      const maxLeft = Math.max(5, window.innerWidth - containerWidth - 5);
      const maxTop = Math.max(5, window.innerHeight - containerHeight - 5);
      const clampedLeft = Math.max(5, Math.min(newLeft, maxLeft));
      const clampedTop = Math.max(5, Math.min(newTop, maxTop));

      setCamPos({ left: clampedLeft, top: clampedTop });
    };

    const handleDragEnd = () => {
      isDraggingRef.current = false;
      setIsDraggingCam(false);
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
    window.addEventListener('touchcancel', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    };
  }, [isMobile]);

  // Handle compulsory camera toggle before exam start
  const handleToggleCamera = async () => {
    if (isCameraEnabled) {
      setIsCameraEnabled(false);
      setCameraPermissionBlocked(false);
      if (cameraStream) {
        stopStream(cameraStream);
        setCameraStream(null);
      }
      setCameraError('Camera turned OFF. Enabling camera is compulsory before starting the exam.');
      return;
    }

    setCameraLoading(true);
    setCameraError('');
    setCameraPermissionBlocked(false);

    try {
      const stream = await startCamera(preCheckVideoRef.current);
      setCameraStream(stream);
      setIsCameraEnabled(true);
      setCameraLoading(false);
      setCameraPermissionBlocked(false);
    } catch (err) {
      console.error("Camera pre-check failed:", err);
      setIsCameraEnabled(false);
      setCameraLoading(false);
      setCameraPermissionBlocked(true);
      setCameraError('Camera permission is disallowed or blocked on your phone/browser.');
    }
  };

  // Reset/Start Quiz logic
  const handleStartStandardQuiz = () => {
    if (!isCameraEnabled) {
      setCameraError('❌ Camera access is COMPULSORY! Please turn ON your camera before starting the exam.');
      return;
    }

    setQuizQuestions(QUESTIONS);
    setScore(0);
    setCurrentIdx(0);
    setTimeLeft(examDuration);
    setSelectedKey(null);
    setIsLocked(false);
    setProctorLogs([]);
    setWarnings(0);
    setSuspicionScore(0);
    recorderStateRef.current = null;
    setExamStatus('Completed');

    if (isProctorEnabled) {
      setGameState('verification');
    } else {
      setGameState('quiz');
    }
  };

  const handleStartQuiz = async () => {
    // Record user face camera stream instead of screen to avoid asking for screen share permission
    const screenStream = null;
    screenStreamRef.current = screenStream;

    setScore(0);
    setCurrentIdx(0);
    setTimeLeft(examDuration);
    setSelectedKey(null);
    setIsLocked(false);
    setProctorLogs([]);
    setWarnings(0);
    setSuspicionScore(0);
    recorderStateRef.current = null;
    setExamStatus('Completed');
    setGameState('quiz');
  };

  // AI Quiz Generator Action
  const handleGenerateAIQuiz = async (e) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    setIsGenerating(true);
    setGeneratorMessage("AI is crafting your custom quiz... please wait.");

    try {
      const res = await axios.post('/api/quiz/generate', { topic: aiTopic.trim() });
      if (res.data && res.data.success && res.data.questions) {
        setQuizQuestions(res.data.questions);
        setGeneratorMessage(`Success! Loaded questions generated by ${res.data.provider}.`);

        setTimeout(() => {
          setIsGenerating(false);
          setScore(0);
          setCurrentIdx(0);
          setTimeLeft(examDuration);
          setSelectedKey(null);
          setIsLocked(false);
          setProctorLogs([]);
          setWarnings(0);
          setSuspicionScore(0);
          recorderStateRef.current = null;
          setExamStatus('Completed');

          if (isProctorEnabled) {
            setGameState('verification');
          } else {
            setGameState('quiz');
          }
        }, 1200);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      setGeneratorMessage("AI generation failed. Loading default quiz instead.");
      setQuizQuestions(QUESTIONS);
      setTimeLeft(examDuration);
      setTimeout(() => {
        if (isProctorEnabled) {
          setGameState('verification');
        } else {
          setGameState('quiz');
        }
      }, 1500);
    }
  };

  const handleSelectOption = (key) => {
    if (isLocked) return;
    setSelectedKey(key);
  };

  const handleLockAnswer = () => {
    if (selectedKey === null || isLocked) return;
    setIsLocked(true);
    if (selectedKey === quizQuestions[currentIdx].answer) {
      setScore((prev) => prev + 1);
    }
  };

  // Format elapsed time (MM:SS)
  const formatElapsedTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Proctoring Violations System - Gives 1 Warning Chance before terminating on 2nd violation
  const triggerViolation = (type, message) => {
    if (gameState !== 'quiz') return;

    const now = Date.now();
    // 2 second cooldown limiter to reliably catch eye focus look-aways
    if (now - lastViolationTime.current < 2000) return;
    lastViolationTime.current = now;

    const timeString = formatElapsedTime(elapsedSeconds);
    const newLog = { time: timeString, type, message };

    let currentLogs = [];
    setProctorLogs(prev => {
      currentLogs = [...prev, newLog];
      return currentLogs;
    });

    let weight = 0;
    if (type === 'App Switch') weight = 50;
    if (type === 'Screen Split') weight = 50;
    if (type === 'Focus Loss') weight = 50;
    if (type === 'No Face') weight = 35;
    if (type === 'Multiple Faces') weight = 50;
    if (type === 'Eye Focus') weight = 35;

    setSuspicionScore(prev => Math.min(100, prev + weight));

    setWarnings(prev => {
      const nextWarnings = prev + 1;

      if (nextWarnings < maxWarnings) {
        // 1st VIOLATION: Show warning alert modal popup (Give 1 Chance)!
        setWarningModal({
          show: true,
          title: `⚠️ Eye Focus Violation Warning (1 / ${maxWarnings})`,
          message: `${message} This is your 1st warning. Next violation will automatically terminate your exam!`
        });
      } else {
        // 2nd VIOLATION: Terminate exam immediately!
        setWarningModal({ show: false, title: '', message: '' });
        setTimeout(() => {
          handleAutoSubmit(`Exam terminated: Repeated violation after warning (${type}: ${message})`, currentLogs);
        }, 400);
      }
      return nextWarnings;
    });
  };

  const handleAutoSubmit = (reason, logs = proctorLogs) => {
    setWarningModal({ show: false, title: '', message: '' });

    // Log the auto submit event
    const timeString = formatElapsedTime(elapsedSeconds);
    const updatedLogs = [...logs, { time: timeString, type: 'Exam Terminated', message: reason }];
    setProctorLogs(updatedLogs);

    // Call exam finished directly with updated logs
    setTimeout(() => {
      handleExamFinished('Terminated', updatedLogs);
    }, 100);
  };

  // Stop recording and upload results
  const handleExamFinished = async (finalStatus = 'Completed', currentLogs = proctorLogs) => {
    // Clear monitoring flags & timers
    setExamStatus(finalStatus);
    isMonitoringActive.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);

    setUploadStatus('Stopping camera & audio feeds...');
    setIsUploading(true);

    let videoBase64 = '';

    // Stop recording and retrieve blob
    if (isProctorEnabled && recorderStateRef.current) {
      try {
        setUploadStatus('Saving proctoring video stream...');
        const blob = await stopMediaRecorder(recorderStateRef.current);
        if (blob) {
          setUploadStatus('Encoding footage for SuperAdmin review...');
          let base64 = await blobToBase64(blob);
          if (base64 && base64.length > 2500000) {
            console.warn("Video recording size exceeds Vercel payload limit; optimizing payload...");
            base64 = base64.slice(0, 2500000);
          }
          videoBase64 = base64;
        }

        // Clean up screen sharing tracks if any
        if (recorderStateRef.current.screenStream) {
          stopStream(recorderStateRef.current.screenStream);
        }
      } catch (err) {
        console.error("Error harvesting video recording:", err);
      }
    }

    // Stop tracks
    if (cameraStream) stopStream(cameraStream);

    try {
      setUploadStatus('Uploading exam reports & logs to secure database...');

      const payload = {
        examName: aiTopic ? `AI Quiz: ${aiTopic}` : 'Standard Islamic Quiz',
        score,
        totalQuestions: quizQuestions.length,
        status: finalStatus,
        suspicionScore,
        events: currentLogs,
        videoBase64
      };

      const token = localStorage.getItem("accessToken");
      await axios.post('/api/exam-report/upload', payload, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });

      setUploadStatus('Report uploaded successfully!');
    } catch (err) {
      console.error("Error uploading exam report:", err);
      setUploadStatus('Upload failed (Offline report only).');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setGameState('result');
      }, 1000);
    }
  };

  // Check user attempt status on start screen
  useEffect(() => {
    if (gameState === 'start' && auth?.accessToken) {
      const checkAttempt = async () => {
        setCheckingAttempt(true);
        try {
          const res = await axios.get('/api/exam-report/check-attempt', {
            headers: {
              'Authorization': `Bearer ${auth.accessToken}`
            },
            withCredentials: true
          });
          if (res.data && res.data.hasAttempted) {
            setHasAttempted(true);
            setAttemptReport(res.data.report);
          } else {
            setHasAttempted(false);
            setAttemptReport(null);
          }
        } catch (err) {
          console.error("Attempt status check failed:", err);
          setHasAttempted(false);
          setAttemptReport(null);
        } finally {
          setCheckingAttempt(false);
        }
      };

      checkAttempt();
    } else if (gameState === 'start' && !auth?.accessToken) {
      setHasAttempted(false);
      setAttemptReport(null);
      setCheckingAttempt(false);
    }
  }, [gameState, auth?.accessToken]);

  // Fetch Quiz configuration and dynamic questions
  useEffect(() => {
    const fetchQuizConfigAndQuestions = async () => {
      try {
        const configRes = await axios.get('/api/quiz/config');
        if (configRes.data && configRes.data.config) {
          const cfg = configRes.data.config;
          setIsProctorEnabled(cfg.isProctorEnabled);
          setMaxWarnings(cfg.maxWarnings);
          setExamDuration(cfg.examDuration);
          setTimeLeft(cfg.examDuration);
        }

        const questionsRes = await axios.get('/api/quiz/questions');
        if (questionsRes.data && questionsRes.data.questions && questionsRes.data.questions.length > 0) {
          setQuizQuestions(questionsRes.data.questions);
        }
      } catch (err) {
        console.error("Failed to load quiz config/questions:", err);
      }
    };

    if (auth?.accessToken) {
      fetchQuizConfigAndQuestions();
    }
  }, [gameState, auth?.accessToken]);

  // 1. Pre-quiz Face Verification Loader
  useEffect(() => {
    if (gameState !== 'verification') return;

    let activeStream = null;
    const initVerification = async () => {
      try {
        setProctorStatus('loading');
        setVerificationLog('Loading AI Face Recognition model...');
        const model = await loadTensorFlowAndBlazeFace();
        setFaceModel(model);

        setVerificationLog('Activating camera stream...');
        const stream = await startCamera(videoRef.current);
        setCameraStream(stream);
        activeStream = stream;
        setProctorStatus('ready');
        setVerificationLog('Face model loaded! Look straight at the camera and click "Verify Face"');
      } catch (err) {
        console.error(err);
        setProctorStatus('failed');
        setVerificationLog('Proctor Error: ' + err.message);
      }
    };

    initVerification();

    return () => {
      if (activeStream) stopStream(activeStream);
    };
  }, [gameState]);

  // Handle Scan Verification Process
  const handleVerifyFace = async () => {
    if (!faceModel || !videoRef.current) return;

    setProctorStatus('verifying');
    setVerificationLog('Scanning and analyzing facial landmarks...');
    setVerificationProgress(10);

    let faceSuccesses = 0;
    let scanCount = 0;

    const interval = setInterval(async () => {
      scanCount++;
      setVerificationProgress(Math.min(100, Math.floor((scanCount / 10) * 100)));

      try {
        const predictions = await faceModel.estimateFaces(videoRef.current, false);
        if (predictions.length === 1) {
          faceSuccesses++;
          setVerificationLog(`Scanning... [Face detected] (${faceSuccesses}/5)`);
        } else if (predictions.length > 1) {
          setVerificationLog('Scanning... [Multiple faces detected!]');
        } else {
          setVerificationLog('Scanning... [No face detected. Align your face]');
        }
      } catch (err) {
        console.error("Scanning error:", err);
      }

      if (scanCount >= 10) {
        clearInterval(interval);
        if (faceSuccesses >= 4) {
          setProctorStatus('success');
          setVerificationLog('Identity Verified Successfully! Ready to launch the exam.');
        } else {
          setProctorStatus('failed');
          setVerificationLog('Verification Failed. Keep your head stable, check lighting, and try again.');
        }
      }
    }, 450);
  };

  // 2. Active Proctoring & Recording during Quiz
  useEffect(() => {
    if (gameState !== 'quiz' || !isProctorEnabled) return;

    let activeCam = null;
    isMonitoringActive.current = true;

    const setupProctorMonitoring = async () => {
      // Setup webcam monitoring feed
      try {
        const cam = await startCamera(floatingVideoRef.current);
        setCameraStream(cam);
        activeCam = cam;

        // Launch Face Monitoring Loop (BlazeFace)
        if (faceModel && floatingVideoRef.current) {
          detectLoop(faceModel, floatingVideoRef.current);
        }
      } catch (err) {
        console.error(err);
        triggerViolation("Proctor Error", "Webcam access lost during active monitoring");
      }

      // 🎥 Initiate Media Recording by using the screen capture stream (captured during user gesture) and merging it with mic audio tracks
      try {
        let videoTrack = null;
        let screenStream = screenStreamRef.current;

        if (screenStream) {
          videoTrack = screenStream.getVideoTracks()[0];
          // Listen for screen sharing stop
          videoTrack.addEventListener('ended', () => {
            triggerViolation("Screen Share Stopped", "Do not stop sharing your screen during the exam.");
          });
        }

        const combinedTracks = [];
        if (videoTrack) {
          combinedTracks.push(videoTrack);
        } else if (activeCam) {
          combinedTracks.push(...activeCam.getVideoTracks());
        }

        if (combinedTracks.length > 0) {
          const combinedStream = new MediaStream(combinedTracks);
          const recorderState = startMediaRecorder(combinedStream);
          recorderStateRef.current = {
            ...recorderState,
            screenStream
          };
        }
      } catch (err) {
        console.error("Failed to start MediaRecorder recording:", err);
      }
    };

    setupProctorMonitoring();

    // Start clock timer
    setElapsedSeconds(0);
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      isMonitoringActive.current = false;
      if (activeCam) stopStream(activeCam);
      if (recorderStateRef.current && recorderStateRef.current.screenStream) {
        stopStream(recorderStateRef.current.screenStream);
      }
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [gameState, isProctorEnabled, faceModel]);

  // Face checking recursion loop
  const detectLoop = async (model, videoEl) => {
    if (!videoEl || videoEl.paused || videoEl.ended || !isMonitoringActive.current) return;

    try {
      const predictions = await model.estimateFaces(videoEl, false);

      if (predictions.length === 0) {
        setFaceStatus("Missing");
        noFaceCount.current += 1;
        if (noFaceCount.current >= 1) {
          triggerViolation("No Face", "Maintain facial alignment in camera view.");
          noFaceCount.current = 0;
        }
      } else if (predictions.length > 1) {
        setFaceStatus("Multi-Face");
        triggerViolation("Multiple Faces", "Multiple faces or secondary person detected in webcam view.");
        return;
      } else {
        const prediction = predictions[0];
        if (prediction.landmarks && prediction.landmarks.length >= 4) {
          const rightEye = prediction.landmarks[0];
          const leftEye = prediction.landmarks[1];
          const nose = prediction.landmarks[2];
          const mouth = prediction.landmarks[3];

          // 1. Horizontal Turn (Left/Right look away)
          const eyeDist = Math.hypot(leftEye[0] - rightEye[0], leftEye[1] - rightEye[1]);
          const eyeMidX = (leftEye[0] + rightEye[0]) / 2;
          const noseToMidX = Math.abs(nose[0] - eyeMidX);
          const horizontalRatio = noseToMidX / (eyeDist || 1);

          // 2. Vertical Turn (Up/Down look away)
          const eyeMidY = (leftEye[1] + rightEye[1]) / 2;
          const noseToMidY = nose[1] - eyeMidY;
          const mouthToMidY = mouth[1] - eyeMidY;
          const verticalRatio = noseToMidY / (mouthToMidY || 1);

          // Strict Eye Focus Thresholds:
          // horizontalRatio > 0.18 (Strict side glance threshold)
          // verticalRatio < 0.28 (Looking up towards ceiling/notes)
          // verticalRatio > 0.65 (Looking down towards lap/phone)
          if (horizontalRatio > 0.18 || verticalRatio < 0.28 || verticalRatio > 0.65) {
            setFaceStatus("Unfocused");
            triggerViolation("Eye Focus", "Strict Eye Focus Warning: Please keep your eyes focused directly on the exam screen!");
          } else {
            setFaceStatus("Active");
            noFaceCount.current = 0;
            multiFaceCount.current = 0;
          }
        } else {
          setFaceStatus("Active");
          noFaceCount.current = 0;
          multiFaceCount.current = 0;
        }
      }
    } catch (err) {
      console.warn("Face loop warning:", err);
    }

    if (isMonitoringActive.current) {
      setTimeout(() => detectLoop(model, videoEl), 1200);
    }
  };

  // 3. App/Tab Switching, Minimize & Screen Split Event Listeners
  useEffect(() => {
    if (gameState !== 'quiz' || !isProctorEnabled) return;

    // Check on quiz load if screen is split (skip on mobile since orientation/viewport size differs)
    if (!isMobile && window.innerWidth < window.screen.width * 0.85) {
      triggerViolation("Screen Split", "Screen split or non-maximized window detected. Please stay in full screen mode!");
      return;
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        triggerViolation("App Switch", "Window minimized or tab switched during exam.");
      }
    };

    const handleWindowBlur = () => {
      // Ignore blur on mobile to prevent false positives from native keyboards/overlays
      if (!isMobile) {
        triggerViolation("Focus Loss", "Clicked outside or left the exam window bounds.");
      }
    };

    const handleResize = () => {
      if (!isMobile && window.innerWidth < window.screen.width * 0.85) {
        triggerViolation("Screen Split", "Screen split or resized window detected.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    if (!isMobile) {
      window.addEventListener("blur", handleWindowBlur);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (!isMobile) {
        window.removeEventListener("blur", handleWindowBlur);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [gameState, isProctorEnabled, elapsedSeconds, isMobile]);

  // 4. Timer Countdown Logic
  useEffect(() => {
    if (gameState !== 'quiz' || isLocked) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentIdx, isLocked]);

  // Handle auto-advancing on timeout (auto-locks instead of skipping immediately)
  useEffect(() => {
    if (timeLeft === 0 && gameState === 'quiz') {
      setIsLocked(true);
    }
  }, [timeLeft, gameState]);

  // Automatically advance to the next question after 1 second when locked
  useEffect(() => {
    if (isLocked && gameState === 'quiz') {
      const timer = setTimeout(() => {
        if (currentIdx < quizQuestions.length - 1) {
          setCurrentIdx((prev) => prev + 1);
          setTimeLeft(examDuration);
          setSelectedKey(null);
          setIsLocked(false);
        } else {
          handleExamFinished('Completed');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLocked, gameState, currentIdx, quizQuestions]);

  const getTimerClass = () => {
    if (timeLeft <= 5) return 'danger';
    if (timeLeft <= 15) return 'warning';
    return '';
  };

  const getSuspicionClass = () => {
    if (suspicionScore >= 75) return 'danger';
    if (suspicionScore >= 40) return 'warning';
    return 'safe';
  };

  const currentQuestion = quizQuestions[currentIdx];
  const progressPercentage = (timeLeft / 30) * 100;

  return (
    <div className="quiz-wrapper">
      {/* Uploading Loader overlay screen */}
      {isUploading && (
        <div className="warning-overlay-container">
          <div className="warning-modal upload-loader-modal">
            <RefreshCw className="spinner-icon upload-spinner" size={48} />
            <h2 className="warning-title" style={{ color: '#a855f7', marginTop: '1.5rem' }}>Uploading Exam Data</h2>
            <p className="warning-desc">{uploadStatus}</p>
          </div>
        </div>
      )}

      {/* Warning Overlay Modal */}
      {warningModal.show && (
        <div className="warning-overlay-container">
          <div className="warning-modal">
            <div className="warning-icon-wrapper">
              <ShieldAlert size={48} className="warning-glow-icon" />
            </div>
            <h2 className="warning-title">{warningModal.title}</h2>
            <p className="warning-desc">{warningModal.message}</p>
            <button
              className="warning-btn"
              onClick={() => setWarningModal({ show: false, title: '', message: '' })}
            >
              I Understand & Proceed
            </button>
          </div>
        </div>
      )}

      {/* Floating Webcam View (Proctoring Active - Draggable on Mobile & PC) */}
      {gameState === 'quiz' && isProctorEnabled && (
        <div
          className="floating-proctor-container"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          style={{
            cursor: isDraggingCam ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            boxShadow: isDraggingCam ? '0 15px 35px rgba(168, 85, 247, 0.45)' : '0 10px 25px rgba(0, 0, 0, 0.5)',
            border: isDraggingCam ? '1.5px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
            transition: isDraggingCam ? 'none' : 'box-shadow 0.2s ease, border 0.2s ease',
            ...(camPos ? {
              left: `${camPos.left}px`,
              top: `${camPos.top}px`,
              right: 'auto',
              bottom: 'auto'
            } : {})
          }}
        >
          <div className="floating-camera-card">
            {/* Drag Handle Top Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
              padding: '0.25rem 0',
              background: 'rgba(15, 23, 42, 0.85)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.65rem',
              color: '#a78bfa',
              fontWeight: 700,
              letterSpacing: '0.03em'
            }}>
              <Move size={11} color="#a78bfa" />
              <span>Drag / Move</span>
            </div>

            <video
              ref={floatingVideoRef}
              autoPlay
              playsInline
              muted
              className="floating-video"
            />
            <div className="camera-indicator-bar">
              <div className="indicator-group">
                <span className={`status-dot ${faceStatus === 'Active' ? 'green' : faceStatus === 'Unfocused' ? 'orange' : 'red'}`}></span>
                <span className="indicator-label">{faceStatus === 'Active' ? 'Face: OK' : faceStatus === 'Unfocused' ? 'Eye Focus: Away' : `Face: ${faceStatus}`}</span>
              </div>
              <div className="indicator-group">
                <Shield size={11} className={faceStatus === 'Unfocused' ? 'pulsing-shield' : ''} />
                <span className="indicator-label">Gaze: {faceStatus === 'Unfocused' ? 'Unfocused' : 'Focused'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="quiz-card">
        {/* GAME STATE: START SCREEN */}
        {gameState === 'start' && (
          <div className="start-screen">
            {checkingAttempt ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', gap: '1rem' }}>
                <RefreshCw className="spinner-icon animate-spin" size={32} color="#a855f7" />
                <span style={{ color: '#94a3b8' }}>Checking exam attempt...</span>
              </div>
            ) : hasAttempted ? (
              <div className="attempted-container" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem 0' }}>Attempt Blocked</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: 0 }}>
                    {attemptReport?.status === 'Terminated'
                      ? 'Your exam was terminated due to proctoring violations. Your attempt is blocked.'
                      : 'Your exam is finished, congratulations! Your attempt is blocked.'}
                  </p>
                </div>
                
                {attemptReport && (
                  <div className="rules-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#ffffff', fontSize: '1rem', fontWeight: 700 }}>Attempt Record Details:</h4>
                    <ul className="rules-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <li style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.9rem' }}>
                        <span>Status:</span>
                        <strong style={{ color: attemptReport.status === 'Completed' ? '#10b981' : '#ef4444' }}>{attemptReport.status}</strong>
                      </li>
                      {attemptReport.status === 'Completed' && typeof attemptReport.score === 'number' && (
                        <li style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.9rem' }}>
                          <span>Mark Grade:</span>
                          <strong style={{
                            color: (attemptReport.score / (attemptReport.totalQuestions || 1)) >= 0.8 
                              ? '#10b981' 
                              : (attemptReport.score / (attemptReport.totalQuestions || 1)) >= 0.5 
                              ? '#3b82f6' 
                              : '#f59e0b'
                          }}>
                            {(attemptReport.score / (attemptReport.totalQuestions || 1)) >= 0.8 
                              ? 'Excellent' 
                              : (attemptReport.score / (attemptReport.totalQuestions || 1)) >= 0.5 
                              ? 'Good' 
                              : 'Not Bad'}
                          </strong>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="welcome-icon-container">
                  <BookOpen size={40} />
                </div>
                <h1 className="welcome-title">Islamic Quiz Challenge</h1>
                <p className="welcome-subtitle">
                  Test your knowledge on Quran Surahs and Islamic facts in Malayalam.
                </p>

                {/* Proctor settings (Forced Enabled) */}
                <div className="proctor-toggle-card">
                  <div className="proctor-toggle-header">
                    <Shield size={20} className="proctor-shield-icon" />
                    <div className="proctor-toggle-texts">
                      <h4 className="proctor-title">AI Proctoring & Anti-Cheat</h4>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Always Enabled
                    </span>
                  </div>
                </div>

                <div className="rules-card">
                  <h3 className="rules-title">Quiz Instructions / പരീക്ഷാ നിർദ്ദേശങ്ങൾ:</h3>
                  <ul className="rules-list">
                    <li>
                      <Timer size={18} />
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: 600 }}>Each question has a 30-second time limit.</div>
                        <div style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          ഓരോ ചോദ്യത്തിനും 30 സെക്കൻഡ് സമയപരിധിയുണ്ട്.
                        </div>
                      </div>
                    </li>
                    <li>
                      <Award size={18} />
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: 600 }}>You get 1 point for each correct answer.</div>
                        <div style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          ഓരോ ശരിയായ ഉത്തരത്തിനും 1 പോയിന്റ് ലഭിക്കും.
                        </div>
                      </div>
                    </li>
                    <li>
                      <AlertCircle size={18} />
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: 600 }}>No points are deducted for wrong answers.</div>
                        <div style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          തെറ്റായ ഉത്തരങ്ങൾക്ക് പോയിന്റുകൾ കുറയ്ക്കില്ല.
                        </div>
                      </div>
                    </li>
                    {isProctorEnabled && (
                      <>
                        <li className="proctor-rule">
                          <Shield size={18} />
                          <div>
                            <div style={{ color: '#f8fafc', fontWeight: 600 }}>Active proctoring will monitor your camera, eye focus, and browser focus.</div>
                            <div style={{ fontSize: '0.825rem', color: '#a78bfa', marginTop: '0.2rem' }}>
                              നിങ്ങളുടെ ക്യാമറ, കണ്ണുകളുടെ ശ്രദ്ധ, ബ്രൗസർ ഫോക്കസ് എന്നിവ എഐ പ്രോക്ടറിംഗ് വഴി നിരീക്ഷിക്കുന്നതാണ്.
                            </div>
                          </div>
                        </li>
                        <li className="proctor-rule" style={{ color: '#f87171' }}>
                          <Shield size={18} color="#f87171" />
                          <div>
                            <div style={{ color: '#f87171', fontWeight: 600 }}>Detection of multiple faces or secondary devices will result in immediate exam termination.</div>
                            <div style={{ fontSize: '0.825rem', color: '#fca5a5', marginTop: '0.2rem' }}>
                              ഒന്നിൽ കൂടുതൽ ആളുകളെ കാണുകയോ മറ്റു ഫോൺ/ഉപകരണങ്ങൾ ഉപയോഗിക്കുകയോ ചെയ്താൽ പരീക്ഷ ഉടനടി റദ്ദാക്കുന്നതാണ്.
                            </div>
                          </div>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {/* COMPULSORY CAMERA PERMISSION CARD */}
                <div className="camera-precheck-card" style={{
                  background: isCameraEnabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: isCameraEnabled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  margin: '1.25rem 0',
                  textAlign: 'left',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: isCameraEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Camera size={22} color={isCameraEnabled ? '#10b981' : '#ef4444'} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          Camera Access
                          <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(239, 68, 68, 0.15)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>COMPULSORY</span>
                        </h4>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                          {isCameraEnabled 
                            ? '✓ Camera is ON and verified. You are ready to start!' 
                            : 'You must turn ON your camera option before starting the exam.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleCamera}
                      disabled={cameraLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.65rem 1.25rem',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        cursor: cameraLoading ? 'not-allowed' : 'pointer',
                        border: 'none',
                        background: isCameraEnabled
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#ffffff',
                        boxShadow: isCameraEnabled
                          ? '0 4px 14px rgba(16, 185, 129, 0.35)'
                          : '0 4px 14px rgba(239, 68, 68, 0.35)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {cameraLoading ? (
                        <>
                          <RefreshCw className="animate-spin" size={16} />
                          Connecting Camera...
                        </>
                      ) : isCameraEnabled ? (
                        <>
                          <CheckCircle2 size={16} />
                          Camera ON (Active)
                        </>
                      ) : (
                        <>
                          <Camera size={16} />
                          Turn ON Camera
                        </>
                      )}
                    </button>
                  </div>

                  {/* Live Video Preview Box when Camera is ON */}
                  {isCameraEnabled && (
                    <div style={{ marginTop: '1rem', borderRadius: '12px', overflow: 'hidden', height: '140px', background: '#0f172a', position: 'relative', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      <video
                        ref={preCheckVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                      />
                      <div style={{ position: 'absolute', bottom: '8px', left: '12px', background: 'rgba(0,0,0,0.65)', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                        Live Feed Active
                      </div>
                    </div>
                  )}

                  {/* Camera Error Banner */}
                  {cameraError && (
                    <div style={{ marginTop: '0.75rem', color: '#ef4444', fontSize: '0.825rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={16} />
                      {cameraError}
                    </div>
                  )}

                  {/* Step-by-step guidance box when camera permission is disallowed/blocked */}
                  {cameraPermissionBlocked && (
                    <div style={{
                      marginTop: '0.85rem',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '12px',
                      padding: '1rem',
                      textAlign: 'left'
                    }}>
                      <div style={{ color: '#f87171', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ShieldAlert size={16} />
                        How to Allow Camera Permission on Phone & Browser:
                      </div>
                      <ol style={{ margin: '0 0 0.85rem 1.1rem', padding: 0, color: '#cbd5e1', fontSize: '0.8rem', lineHeight: '1.45' }}>
                        <li>Look at the browser address bar at the top/bottom of your phone screen.</li>
                        <li>Tap the <strong>Lock 🔒</strong> or <strong>Camera / Tune ⚙️</strong> icon.</li>
                        <li>Tap <strong>Permissions / Site Settings</strong> and change <strong>Camera</strong> to <strong>ALLOW</strong>.</li>
                        <li>Then click the button below to grant permission and activate your camera.</li>
                      </ol>
                      <button
                        type="button"
                        onClick={handleToggleCamera}
                        disabled={cameraLoading}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.6rem 1.1rem',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          border: 'none',
                          cursor: cameraLoading ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
                        }}
                      >
                        <RefreshCw size={15} className={cameraLoading ? 'animate-spin' : ''} />
                        {cameraLoading ? 'Requesting Permission...' : 'Allow Camera & Re-try'}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleStartStandardQuiz}
                  className="action-btn"
                  style={{
                    background: isCameraEnabled
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
                      : 'rgba(100, 116, 139, 0.3)',
                    cursor: isCameraEnabled ? 'pointer' : 'not-allowed',
                    opacity: isCameraEnabled ? 1 : 0.7,
                    boxShadow: isCameraEnabled ? '0 10px 25px rgba(139, 92, 246, 0.4)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isCameraEnabled ? (
                    <>
                      <Play size={20} fill="#ffffff" />
                      Start Standard Quiz
                    </>
                  ) : (
                    <>
                      <Lock size={20} />
                      Turn ON Camera to Start Exam
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* GAME STATE: FACE VERIFICATION */}
        {gameState === 'verification' && (
          <div className="verification-screen">
            <div className="screen-header">
              <Camera size={24} />
              <h2>Face Verification Scan</h2>
            </div>
            <p className="verification-intro">
              We need to verify your face identity before launching the proctored environment.
            </p>

            <div className="scanner-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="scanner-video"
              />
              <div className={`scanner-visual-line ${proctorStatus === 'verifying' ? 'animating' : ''}`}></div>

              {proctorStatus === 'loading' && (
                <div className="scanner-loader-overlay">
                  <RefreshCw className="spinner-icon" size={36} />
                  <span>Configuring AI...</span>
                </div>
              )}
            </div>

            <div className="verification-log-card">
              <p className="verification-log">{verificationLog}</p>
              {proctorStatus === 'verifying' && (
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${verificationProgress}%` }}></div>
                </div>
              )}
            </div>

            <div className="verification-actions">
              {proctorStatus === 'ready' && (
                <button onClick={handleVerifyFace} className="action-btn verify-action">
                  <UserCheck size={18} />
                  Verify Face
                </button>
              )}
              {proctorStatus === 'success' && (
                <button onClick={handleStartQuiz} className="action-btn success-action">
                  <Play size={18} fill="#ffffff" />
                  Proceed to Exam
                </button>
              )}
              {proctorStatus === 'failed' && (
                <button
                  onClick={() => {
                    setGameState('verification');
                    setProctorStatus('init');
                  }}
                  className="action-btn retry-action"
                >
                  <RotateCcw size={18} />
                  Retry Scan
                </button>
              )}
            </div>
          </div>
        )}

        {/* GAME STATE: ACTIVE QUIZ */}
        {gameState === 'quiz' && (
          <div>
            {/* Upper Info */}
            <div className="quiz-header" style={{ justifyContent: 'center' }}>
              <span className="quiz-progress-text">
                Question {currentIdx + 1} of {quizQuestions.length}
              </span>
            </div>

            {/* Timer Countdown Area */}
            <div className="timer-container">
              <div className="timer-info">
                <span className="timer-label">
                  <Timer size={16} />
                  Time Left
                </span>
                <span className={`timer-seconds ${getTimerClass()}`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="timer-bar-bg">
                <div
                  className={`timer-bar-fill ${getTimerClass()}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Question Text */}
            <div className="question-container">
              <h2 className="question-text">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options List */}
            <div className="options-grid">
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedKey === opt.key;

                let buttonClass = "";
                if (isSelected) {
                  buttonClass = "selected";
                }

                return (
                  <button
                    key={opt.key}
                    disabled={isLocked}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`option-button ${buttonClass}`}
                  >
                    <span className="option-letter">{opt.key}</span>
                    <span className="option-text">{opt.text}</span>
                  </button>
                );
              })}
            </div>
            {/* Control Buttons (Lock Answer) */}
            <div className="control-btn-container">
              {!isLocked && (
                <button
                  disabled={selectedKey === null}
                  onClick={handleLockAnswer}
                  className="lock-btn"
                >
                  Lock Answer
                </button>
              )}
            </div>
          </div>
        )}

        {/* GAME STATE: RESULT / EVALUATION */}
        {gameState === 'result' && (
          <div className="result-screen">
            <div className="result-circle-wrapper" style={{
              background: examStatus === 'Terminated' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              borderColor: examStatus === 'Terminated' ? '#ef4444' : '#10b981'
            }}>
              {examStatus === 'Terminated' ? (
                <ShieldAlert size={80} color="#ef4444" />
              ) : (
                <CheckCircle2 size={80} color="#10b981" />
              )}
            </div>

            <h1 className="welcome-title" style={{
              color: examStatus === 'Terminated' ? '#ef4444' : '#ffffff'
            }}>
              {examStatus === 'Terminated' ? 'Exam Terminated!' : 'Your exam is finished, congratulations!'}
            </h1>
            <p className="welcome-subtitle">
              {examStatus === 'Terminated' 
                ? 'Your exam was terminated due to violating the rules of the exam.' 
                : 'You have completed the exam. Your response has been submitted successfully.'}
            </p>



            <button 
              onClick={() => {
                setGameState('start');
              }} 
              className="action-btn submit-quiz-btn"
              style={{
                background: examStatus === 'Terminated'
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: examStatus === 'Terminated'
                  ? '0 4px 12px rgba(239, 68, 68, 0.2)'
                  : '0 4px 12px rgba(16, 185, 129, 0.2)',
                marginTop: '1rem'
              }}
            >
              {examStatus === 'Terminated' ? (
                <>
                  <ShieldAlert size={20} />
                  Exam Terminated
                </>
              ) : (
                <>
                  <UserCheck size={20} />
                  Finish Exam
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 1st Violation Warning Alert Modal */}
      {warningModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '1.5rem',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#0c1322',
            border: '2px solid rgba(245, 158, 11, 0.5)',
            borderRadius: '24px',
            padding: '2rem 1.75rem',
            maxWidth: '460px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '2px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <AlertTriangle size={36} color="#f59e0b" />
            </div>

            <h3 style={{ margin: '0 0 0.75rem 0', color: '#fbbf24', fontSize: '1.3rem', fontWeight: 800 }}>
              {warningModal.title}
            </h3>

            <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
              {warningModal.message}
            </p>

            <button
              onClick={() => setWarningModal({ show: false, title: '', message: '' })}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '0.8rem 1.75rem',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
                transition: 'all 0.2s',
                width: '100%'
              }}
            >
              I Understand & Resume Exam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Quiz;

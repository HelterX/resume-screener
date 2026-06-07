// =============================================
//  RESUME SCREENER — Core Logic
// =============================================

// Common words to ignore
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'is','are','was','were','be','been','being','have','has','had','do','does',
  'did','will','would','could','should','may','might','shall','can','need',
  'we','you','they','he','she','it','i','my','your','our','their','its',
  'this','that','these','those','as','by','from','up','about','into','through',
  'than','more','also','both','each','few','more','most','other','some','such',
  'no','not','only','same','so','than','too','very','just','any','all','each',
  'who','which','what','where','when','how','if','then','there','here','work',
  'working','including','etc','must','will','able','experience','years','year',
  'team','company','business','new','good','strong','use','using','used','help',
  'provide','support','ensure','within','across','key','make','well','great'
]);

// Weighted keyword categories
const TECH_KEYWORDS = new Set([
  'html','css','javascript','js','typescript','react','vue','angular','node',
  'python','php','sql','mysql','mongodb','git','github','figma','shopify',
  'liquid','tailwind','bootstrap','wordpress','webflow','api','rest','json',
  'ai','automation','claude','openai','llm','agent','chatbot','seo','ui','ux',
  'responsive','mobile','frontend','backend','fullstack','devops','aws','firebase',
  'redux','nextjs','express','docker','linux','bash','excel','canva','photoshop'
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+#]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function extractKeywords(text) {
  const tokens = tokenize(text);
  const freq = {};
  tokens.forEach(t => freq[t] = (freq[t] || 0) + 1);

  // Score: tech keywords get 3x weight, others 1x
  return Object.entries(freq)
    .map(([word, count]) => ({
      word,
      score: count * (TECH_KEYWORDS.has(word) ? 3 : 1)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 60)
    .map(e => e.word);
}

function screenResume(jobDesc, resume) {
  const jobKeywords = extractKeywords(jobDesc);
  const resumeTokens = new Set(tokenize(resume));

  const matched = [];
  const missing = [];

  jobKeywords.forEach(kw => {
    // Also check plural/partial matches
    if (resumeTokens.has(kw) || [...resumeTokens].some(t => t.includes(kw) || kw.includes(t) && kw.length > 4)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  });

  const total = matched.length + missing.length;
  const score = total === 0 ? 0 : Math.round((matched.length / total) * 100);

  return { score, matched: matched.slice(0, 20), missing: missing.slice(0, 20) };
}

function getVerdict(score) {
  if (score >= 75) return {
    title: 'Strong Match',
    desc: 'Your resume aligns well with this job. You have most of the required skills and keywords. Apply with confidence.',
    badge: 'Strong Match ✓',
    badgeClass: 'badge--strong'
  };
  if (score >= 50) return {
    title: 'Good Match',
    desc: 'Your resume covers a solid portion of the job requirements. A few additions could significantly boost your chances.',
    badge: 'Good Match',
    badgeClass: 'badge--good'
  };
  return {
    title: 'Needs Work',
    desc: 'Your resume is missing several key requirements for this role. Consider tailoring it to include more relevant keywords and skills.',
    badge: 'Needs Improvement',
    badgeClass: 'badge--weak'
  };
}

function generateTips(missing, score) {
  const tips = [];

  if (missing.length > 0) {
    const top = missing.slice(0, 5).join(', ');
    tips.push(`Add these missing keywords naturally into your resume: <strong>${top}</strong>.`);
  }

  if (score < 75) {
    tips.push('Tailor your resume for each job — copy exact phrases from the job description where you genuinely have that experience.');
  }

  if (missing.some(k => TECH_KEYWORDS.has(k))) {
    const missingTech = missing.filter(k => TECH_KEYWORDS.has(k)).slice(0, 4).join(', ');
    tips.push(`The job requires technical skills you haven\'t mentioned: <strong>${missingTech}</strong>. Add them if you have experience.`);
  }

  tips.push('Use strong action verbs: <strong>Built, Developed, Automated, Designed, Deployed, Optimized</strong>.');
  tips.push('Quantify your results where possible — e.g. "Increased Shopify store sales by 30%" instead of "Improved store performance".');

  if (score >= 75) {
    tips.push('Your resume looks great for this role! Double-check your contact info and make sure your LinkedIn is up to date.');
  }

  return tips;
}

// =============================================
//  ANIMATE SCORE
// =============================================
function animateScore(targetScore) {
  const numEl = document.getElementById('scoreNum');
  const circle = document.getElementById('scoreCircle');
  const circumference = 326.7;

  let current = 0;
  const duration = 1200;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic

    current = Math.round(eased * targetScore);
    numEl.textContent = current;

    const offset = circumference - (current / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Color based on score
    if (current >= 75) circle.style.stroke = '#4ade80';
    else if (current >= 50) circle.style.stroke = 'var(--gold)';
    else circle.style.stroke = '#f87171';

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// =============================================
//  RENDER RESULTS
// =============================================
function renderResults({ score, matched, missing }) {
  const verdict = getVerdict(score);
  const tips = generateTips(missing, score);

  // Score section
  document.getElementById('scoreTitle').textContent = verdict.title;
  document.getElementById('scoreDesc').textContent = verdict.desc;
  const badge = document.getElementById('scoreBadge');
  badge.textContent = verdict.badge;
  badge.className = `score-badge ${verdict.badgeClass}`;

  // Matched keywords
  document.getElementById('matchedCount').textContent = `${matched.length} found`;
  const matchedList = document.getElementById('matchedList');
  matchedList.className = 'keyword-list keyword-list--matched';
  matchedList.innerHTML = matched.map(k => `<li>${k}</li>`).join('');

  // Missing keywords
  document.getElementById('missingCount').textContent = `${missing.length} missing`;
  const missingList = document.getElementById('missingList');
  missingList.className = 'keyword-list keyword-list--missing';
  missingList.innerHTML = missing.map(k => `<li>${k}</li>`).join('');

  // Tips
  document.getElementById('tipsList').innerHTML = tips.map(t => `<li>${t}</li>`).join('');

  // Show results
  const resultsEl = document.getElementById('results');
  resultsEl.classList.add('visible');
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Animate score after short delay
  setTimeout(() => animateScore(score), 200);
}

// =============================================
//  PDF UPLOAD & PARSING
// =============================================
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const uploadZone    = document.getElementById('uploadZone');
const pdfInput      = document.getElementById('pdfInput');
const uploadContent = document.getElementById('uploadContent');
const uploadLoaded  = document.getElementById('uploadLoaded');
const uploadFilename = document.getElementById('uploadFilename');
const uploadRemove  = document.getElementById('uploadRemove');
const resumeTextarea = document.getElementById('resume');

// Click anywhere on zone to open file picker
uploadZone.addEventListener('click', (e) => {
  if (e.target === uploadRemove || uploadZone.classList.contains('loaded')) return;
  pdfInput.click();
});

uploadContent.querySelector('.upload-link').addEventListener('click', () => pdfInput.click());

// Drag & drop
uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') processPDF(file);
});

pdfInput.addEventListener('change', () => {
  if (pdfInput.files[0]) processPDF(pdfInput.files[0]);
});

uploadRemove.addEventListener('click', (e) => {
  e.stopPropagation();
  pdfInput.value = '';
  resumeTextarea.value = '';
  uploadZone.classList.remove('loaded');
  uploadFilename.textContent = '';
});

async function processPDF(file) {
  uploadFilename.textContent = '⏳ Reading PDF...';
  uploadZone.classList.add('loaded');

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(' ') + '\n';
    }

    resumeTextarea.value = fullText.trim();
    uploadFilename.textContent = `📄 ${file.name}`;
  } catch (err) {
    uploadZone.classList.remove('loaded');
    resumeTextarea.placeholder = 'Could not read PDF. Please paste your resume text manually.';
    console.error(err);
  }
}

// =============================================
//  EVENT LISTENERS
// =============================================
const screenBtn = document.getElementById('screenBtn');
const resetBtn = document.getElementById('resetBtn');

screenBtn.addEventListener('click', () => {
  const jobDesc = document.getElementById('jobDesc').value.trim();
  const resume = document.getElementById('resume').value.trim();

  if (!jobDesc || !resume) {
    screenBtn.textContent = 'Please fill both fields ✗';
    screenBtn.style.background = '#c0392b';
    setTimeout(() => {
      screenBtn.textContent = 'Screen My Resume ✦';
      screenBtn.style.background = '';
    }, 2500);
    return;
  }

  screenBtn.textContent = 'Analyzing...';
  screenBtn.disabled = true;

  setTimeout(() => {
    const result = screenResume(jobDesc, resume);
    renderResults(result);
    screenBtn.textContent = 'Screen My Resume ✦';
    screenBtn.disabled = false;
  }, 900);
});

resetBtn.addEventListener('click', () => {
  document.getElementById('jobDesc').value = '';
  document.getElementById('resume').value = '';
  document.getElementById('results').classList.remove('visible');
  document.getElementById('scoreNum').textContent = '0';
  document.getElementById('scoreCircle').style.strokeDashoffset = '326.7';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

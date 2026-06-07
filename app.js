// =============================================
//  RESUME SCREENER — Core Logic
// =============================================

const ACTION_VERBS = [
  'built','developed','designed','created','launched','deployed','automated',
  'optimized','managed','led','improved','increased','reduced','delivered',
  'implemented','integrated','maintained','collaborated','achieved','generated',
  'streamlined','coordinated','executed','produced','established','resolved'
];

const TECH_KEYWORDS = [
  'html','css','javascript','react','vue','angular','node','python','php',
  'sql','mysql','mongodb','git','github','figma','shopify','liquid','tailwind',
  'bootstrap','wordpress','api','rest','json','ai','automation','seo','ui','ux',
  'responsive','mobile','frontend','backend','fullstack','aws','firebase','canva',
  'typescript','nextjs','express','docker','linux','claude','openai','chatbot'
];

const RESUME_SECTIONS = [
  { label: 'Contact Info',  keywords: ['email','phone','linkedin','github','portfolio','contact'] },
  { label: 'Work Experience', keywords: ['experience','work','employment','position','role','job','company','intern'] },
  { label: 'Skills',        keywords: ['skills','technologies','tools','proficient','expertise','competencies'] },
  { label: 'Education',     keywords: ['education','degree','university','college','certification','course','diploma','graduate'] },
  { label: 'Projects',      keywords: ['project','projects','built','developed','created','portfolio'] },
];

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1);
}

function analyzeResume(resumeText) {
  const tokens = tokenize(resumeText);
  const tokenSet = new Set(tokens);
  let score = 0;
  const matched = [];
  const missing = [];

  // 1. Check sections (30 pts)
  let sectionScore = 0;
  RESUME_SECTIONS.forEach(section => {
    const found = section.keywords.some(k => tokenSet.has(k));
    if (found) { sectionScore += 6; matched.push(section.label); }
    else        { missing.push(section.label); }
  });
  score += sectionScore;

  // 2. Action verbs (25 pts)
  const foundVerbs = ACTION_VERBS.filter(v => tokenSet.has(v));
  const verbScore = Math.min(25, foundVerbs.length * 3);
  score += verbScore;
  if (foundVerbs.length > 0) matched.push(...foundVerbs.slice(0, 5));
  else missing.push('action verbs (built, developed, optimized...)');

  // 3. Tech keywords (30 pts)
  const foundTech = TECH_KEYWORDS.filter(k => tokens.some(t => t.includes(k)));
  const techScore = Math.min(30, foundTech.length * 3);
  score += techScore;
  if (foundTech.length > 0) matched.push(...foundTech.slice(0, 8));
  const missingTech = TECH_KEYWORDS.filter(k => !tokens.some(t => t.includes(k))).slice(0, 6);
  missing.push(...missingTech);

  // 4. Quantifiable results (15 pts)
  const hasNumbers = /\d+\s*(%|percent|x|projects?|clients?|years?|months?|users?)/i.test(resumeText);
  if (hasNumbers) { score += 15; matched.push('quantified results'); }
  else              missing.push('quantified results (e.g. "increased sales by 30%")');

  score = Math.min(100, Math.round(score));
  return {
    score,
    matched: [...new Set(matched)].slice(0, 20),
    missing: [...new Set(missing)].slice(0, 20)
  };
}

function getVerdict(score) {
  if (score >= 75) return {
    title: 'Strong Resume',
    desc: 'Your resume is well-structured and keyword-rich. You have strong action verbs, measurable results, and the right technical skills.',
    badge: 'Strong ✓',
    badgeClass: 'badge--strong'
  };
  if (score >= 50) return {
    title: 'Good Resume',
    desc: 'Your resume has a solid foundation. A few targeted improvements to keywords and structure could significantly boost your chances.',
    badge: 'Good',
    badgeClass: 'badge--good'
  };
  return {
    title: 'Needs Improvement',
    desc: 'Your resume is missing key sections, action verbs, or technical keywords. The tips below will help you strengthen it.',
    badge: 'Needs Work',
    badgeClass: 'badge--weak'
  };
}

function generateTips(missing, score) {
  const tips = [];

  const missingSections = missing.filter(m => RESUME_SECTIONS.map(s => s.label).includes(m));
  if (missingSections.length > 0)
    tips.push(`Add missing sections: <strong>${missingSections.join(', ')}</strong>.`);

  if (missing.includes('quantified results (e.g. "increased sales by 30%")'))
    tips.push('Add numbers to your experience — e.g. <strong>"Increased Shopify sales by 40%"</strong> or <strong>"Managed 10+ client accounts"</strong>.');

  if (missing.some(m => m.includes('action verb')))
    tips.push('Start bullet points with strong action verbs: <strong>Built, Designed, Automated, Deployed, Optimized, Delivered</strong>.');

  const missingTech = missing.filter(m => TECH_KEYWORDS.includes(m)).slice(0, 5);
  if (missingTech.length > 0)
    tips.push(`Consider adding relevant tech skills you know: <strong>${missingTech.join(', ')}</strong>.`);

  tips.push('Keep your resume to <strong>1 page</strong> if you have under 5 years of experience.');
  tips.push('Add a <strong>portfolio or GitHub link</strong> so employers can see your actual work.');

  if (score >= 75)
    tips.push('Great resume! Tailor it slightly for each job by mirroring keywords from the job description.');

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

  // Score card glow based on result
  const scoreCard = document.querySelector('.score-card');
  scoreCard.classList.remove('glow-green', 'glow-gold', 'glow-red');
  if (score >= 75)      scoreCard.classList.add('glow-green');
  else if (score >= 50) scoreCard.classList.add('glow-gold');
  else                  scoreCard.classList.add('glow-red');

  // Animate score after short delay
  setTimeout(() => animateScore(score), 200);
}

// =============================================
//  PDF UPLOAD & PARSING
// =============================================
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const uploadZone     = document.getElementById('uploadZone');
const pdfInput       = document.getElementById('pdfInput');
const uploadFilename = document.getElementById('uploadFilename');
const uploadRemove   = document.getElementById('uploadRemove');
const uploadTrigger  = document.getElementById('uploadTrigger');
const resumeTextarea = document.getElementById('resume');

// Click zone (idle state) or browse link to open picker
uploadZone.addEventListener('click', (e) => {
  if (uploadZone.classList.contains('loaded')) return;
  pdfInput.click();
});

uploadTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  pdfInput.click();
});

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
  const resume = document.getElementById('resume').value.trim();

  if (!resume) {
    screenBtn.textContent = 'Please add your resume first ✗';
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
    const result = analyzeResume(resume);
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
  document.querySelector('.score-card').classList.remove('glow-green', 'glow-gold', 'glow-red');
  // Reset upload zone
  pdfInput.value = '';
  uploadZone.classList.remove('loaded');
  uploadFilename.textContent = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

function getApiBaseUrl() {
  var fromWindow = window.APP_CONFIG && typeof window.APP_CONFIG.apiBaseUrl === 'string'
    ? window.APP_CONFIG.apiBaseUrl.trim()
    : '';
  var fromMeta = (function() {
    var tag = document.querySelector('meta[name="api-base-url"]');
    return tag ? String(tag.getAttribute('content') || '').trim() : '';
  })();
  var base = fromWindow || fromMeta || '';
  return base.replace(/\/+$/, '');
}

function buildApiUrl(path, queryParams) {
  var normalizedPath = String(path || '').replace(/^\/+/, '');
  var url = (getApiBaseUrl() ? getApiBaseUrl() + '/' : '/') + normalizedPath;
  if (queryParams && typeof queryParams === 'object') {
    var search = new URLSearchParams();
    Object.keys(queryParams).forEach(function(key) {
      var value = queryParams[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        search.set(key, String(value));
      }
    });
    if (search.toString()) {
      url += '?' + search.toString();
    }
  }
  return url;
}

var CHECKER_MODES = {
  main: {
    title: 'Check Your Result',
    subtitle: 'Enter your Application Number as indicated on your Examination Permit to view your admission result.',
    infoSubtitle: 'Important instructions for Main Campus first-choice qualifiers confirming slots.',
    loadingText: 'Preparing secure Main Campus qualifier lookup&hellip;',
    loadErrorText: 'Could not load secure Main Campus qualifier data.',
    emptyText: 'Please enter your Application Number before checking.',
    buttonText: 'Check My Result',
    placeholder: 'e.g. 2026-00001'
  },
  dpwas: {
    title: 'Check Your DPWAS Eligibility',
    subtitle: 'Enter your Application Number as indicated on your Examination Permit to view your Degree Programs with Available Slots (DPWAS) eligibility and schedule.',
    infoSubtitle: 'Important instructions for DPWAS eligible applicants confirming slots.',
    loadingText: 'Preparing secure DPWAS eligible lookup&hellip;',
    loadErrorText: 'Could not load secure DPWAS eligible data.',
    emptyText: 'Please enter your Application Number before checking.',
    buttonText: 'Check My Status',
    placeholder: 'e.g. 2026-00001'
  },
  satellite: {
    title: 'Check Your Satellite Campus Qualification',
    subtitle: 'Enter your Application Number as indicated on your Examination Permit to view your assigned satellite campus, first-choice course, and reporting schedule.',
    infoSubtitle: 'Important instructions for Satellite Campus qualified applicants confirming slots.',
    loadingText: 'Preparing secure satellite campus qualifier lookup&hellip;',
    loadErrorText: 'Could not load secure satellite qualifier data.',
    emptyText: 'Please enter your Application Number before checking.',
    buttonText: 'Check My Status',
    placeholder: 'e.g. 2026-00001'
  }
};

var currentCheckerMode = 'satellite';

var COMMON_FAQ_HTML =
  '<div class="faq-item"><p class="faq-q">Does the posted admission result include all SLSU campuses?</p><p class="faq-a">No. Results for the Main Campus are posted first, followed by Satellite Campuses after all their exams and evaluations are completed.</p></div>' +
  '<div class="faq-item"><p class="faq-q">How will I know if I am admitted to the program I applied for?</p><p class="faq-a">Check the official Facebook page and the SLSU website for the list of qualifiers, DPWAS eligible applicants, and satellite campus qualifiers.</p></div>' +
  '<div class="faq-item"><p class="faq-q">If I did not confirm my slot, can I recommend someone to replace me?</p><p class="faq-a">No. Slots are forfeited and given to the next qualified applicant. Replacement recommendations are not allowed.</p></div>' +
  '<div class="faq-item"><p class="faq-q">Are there any reservation fees or any other fees that I need to pay upon confirmation of my slot?</p><p class="faq-a">None. There are no fees to be collected to confirm your slot.</p></div>';

var INFO_CONTENT = {
  main: {
    reminders:
      '<div class="info-card"><h4><span>&#128204;</span> Important Reminders</h4><ol class="reminder-list">' +
        '<li>College applicants must pass the interview, laboratory examination for specific programs, and other admission requirements to proceed with the confirmation process.</li>' +
        '<li><strong>Incomplete requirements will be processed provided that primary documents such as original report card or academic records are presented on the day of confirmation.</strong> Qualifiers should bring the following requirements:' +
          '<ol class="sub-reminder-list">' +
            '<li>Examination Permit (duly signed by the test administrator)</li>' +
            '<li>Long White Folders (2 pcs)</li>' +
            '<li>Black Ballpen</li>' +
            '<li>2x2 Picture with nametag and White background (4 pcs)</li>' +
            '<li>Original and Photocopy of Birth Certificate from PSA</li>' +
            '<li>Original and Photocopy of Good Moral Character</li>' +
            '<li>Original and Photocopy of Police Clearance</li>' +
            '<li>Original and Photocopy of Academic Records' +
              '<ol class="sub-sub-reminder-list">' +
                '<li>Grade 12 Report Card</li>' +
                '<li>Transcript of Records (For Transferees)</li>' +
                '<li>ALS Certification of rating qualified for College Admission</li>' +
              '</ol>' +
            '</li>' +
          '</ol>' +
        '</li>' +
        '<li>College applicants are <strong>required to wear a plain white shirt and maong pants</strong> during slot confirmation.</li>' +
        '<li>The Student Admission Staff will distribute queuing numbers starting at 7:00 AM at SLSU Gate 1.</li>' +
        '<li><strong>No reservation fees</strong> are to be collected to confirm the admission slot.</li>' +
        '<li>Applicants who require a companion may bring only one (1) person inside the premises.</li>' +
        '<li>Applicants for BS Nursing, BS Radiologic Technology, BS Midwifery, BS Accountancy, BS Hospitality Management, BA Psychology, and College of Agriculture are <strong>required to be accompanied</strong> by a parent or guardian for a short program orientation.</li>' +
        '<li>Non-appearance on the given schedule means forfeiture of the admission slot. Qualifiers with valid reasons may report to the confirmation venue on <strong>April 27 and 28, 2026 only</strong>.</li>' +
        '<li>In case a program reaches its quota, qualified applicants may still apply for reconsideration in programs with available slots. However, reconsideration is still subject to approval and the availability of slots.</li>' +
        '<li><strong>Only qualified applicants will be entertained.</strong></li>' +
        '<li>Practice CLAYGO before leaving the confirmation venue.</li>' +
      '</ol></div>',
    schedule:
      '<div class="info-card"><h4><span>&#128197;</span> Confirmation Schedule (Main Campus Qualifiers)</h4><div class="schedule-grid">' +
        '<div class="sched-date">April 20, 2026</div><div class="sched-college">College of Engineering</div>' +
        '<div class="sched-date">April 21, 2026</div><div class="sched-college">College of Agriculture<br>College of Administration, Business, Hospitality and Accountancy</div>' +
        '<div class="sched-date">April 22, 2026</div><div class="sched-college">College of Allied Medicine<br>College of Teacher Education</div>' +
        '<div class="sched-date no-border">April 23, 2026</div><div class="sched-college no-border">College of Industrial Technology<br>College of Arts and Sciences</div>' +
      '</div></div>',
    requirements:
      '<div class="info-card"><h4><span>&#128203;</span> General Admission Requirements</h4><div class="req-grid">' +
        '<div class="req-item">Examination Permit (duly signed by test administrator)</div>' +
        '<div class="req-item">Long White Folders (2 pcs)</div>' +
        '<div class="req-item">Black Ballpen</div>' +
        '<div class="req-item">2x2 Picture with nametag, white background (4 pcs)</div>' +
        '<div class="req-item">Original &amp; Photocopy - Birth Certificate from PSA</div>' +
        '<div class="req-item">Original &amp; Photocopy - Good Moral Character</div>' +
        '<div class="req-item">Original &amp; Photocopy - Police Clearance</div>' +
        '<div class="req-item">Original &amp; Photocopy - Academic Records</div>' +
        '<div class="req-item">Grade 12 Report Card</div>' +
        '<div class="req-item">Transcript of Records (For Transferees)</div>' +
        '<div class="req-item">ALS Certification of Rating qualified for College Admission</div>' +
      '</div></div>',
    medical:
      '<div class="info-card"><h4><span>&#129514;</span> Additional Medical Laboratory Examination Results</h4><table class="med-table"><thead><tr><th>Program</th><th>Required Tests</th></tr></thead><tbody>' +
        '<tr><td>Bachelor of Science in Nursing<br>Bachelor of Science in Radiologic Technology<br>Bachelor of Science in Midwifery</td><td>&bull; Chest X-Ray<br>&bull; CBC<br>&bull; Hepa B Screening (HBSAg, Anti-HBS, Anti-HBc)</td></tr>' +
        '<tr><td>Bachelor of Science in Hospitality Management<br>Bachelor of Industrial Technology major in Culinary Technology</td><td>&bull; Chest X-Ray<br>&bull; Hepa B Screening (HBSAg, Anti-HBS, Anti-HBc)</td></tr>' +
      '</tbody></table></div>',
    faq:
      '<div class="info-card"><h4><span>&#10067;</span> Frequently Asked Questions</h4>' +
        COMMON_FAQ_HTML +
        '<div class="faq-item"><p class="faq-q">What if my examinee number is not on the qualifiers or DPWAS lists?</p><p class="faq-a">You may apply for reconsideration, subject to approval and slot availability. Follow official announcements and visit the Admission Office on the scheduled date.</p></div>' +
        '<div class="faq-item"><p class="faq-q">Can I change or shift my course if I am in DPWAS or reconsideration?</p><p class="faq-a">No. Applicants must sign a waiver stating they waive the right to shift to any other program offered by the university.</p></div>' +
        '<div class="faq-item"><p class="faq-q">I missed the confirmation schedule. Can I still confirm my slot beyond my schedule?</p><p class="faq-a">Qualifiers who are unable to attend their scheduled date for valid reasons, such as transportation difficulties, medical concerns, or other justifiable circumstances, may report to the confirmation venue on <strong>April 27 and 28, 2026 only</strong>. For DPWAS applicants, missing the confirmation schedule forfeits the slot, but they may still report during reconsideration dates for programs with available slots.</p></div>' +
        '<div class="faq-item"><p class="faq-q">How will I be notified of the confirmation schedule?</p><p class="faq-a">Confirmation schedules will be posted on the Facebook page of Southern Luzon State University Main Campus and on the SLSU website.</p></div>' +
        '<div class="faq-item"><p class="faq-q">Can I confirm and enroll in an SLSU Satellite Campus if I took my entrance exam at the Main Campus?</p><p class="faq-a">Yes. You may apply for reconsideration during the Satellite Campus reconsideration dates.</p></div>' +
        '<div class="faq-item"><p class="faq-q">Can I confirm and enroll in SLSU Main Campus if I took an entrance exam at an SLSU Satellite Campus?</p><p class="faq-a">No. Applications for SLSU Satellite Campuses are only valid for those respective campuses.</p></div>' +
        '<div class="faq-item"><p class="faq-q">Can I still confirm my slot if some confirmation requirements are incomplete?</p><p class="faq-a">Yes, but your original report card or academic record must be presented on the day of confirmation.</p></div>' +
        '<div class="faq-item"><p class="faq-q">What is the process of slot confirmation in the program I applied to?</p><p class="faq-a"><strong>If Qualifier:</strong> Report on the date of confirmation scheduled per program and submit all requirements for confirmation of slots.<br><strong>If listed on DPWAS:</strong> Access, download, and fill out the reconsideration form and waiver form for admission with the signature of the parent; report on the date of confirmation set by the Student Admission Office; and submit all requirements for confirmation of slots.</p></div>' +
      '</div>'
  },
  dpwas: {
    reminders:
      '<div class="info-card"><h4><span>&#128204;</span> Important Reminders</h4><ol class="reminder-list">' +
        '<li>College applicants must pass the interview, laboratory examination for specific programs, and other admission requirements to proceed with the confirmation process.</li>' +
        '<li><strong>Incomplete requirements will be processed, provided that primary documents such as academic records and filled out Admission Forms are presented on the day of confirmation.</strong> Qualifiers should bring the following requirements:' +
          '<ol class="sub-reminder-list">' +
            '<li>Examination Permit (duly signed by the test administrator)</li>' +
            '<li>Long White Folders (2 pcs)</li>' +
            '<li>Black Ballpen</li>' +
            '<li>2x2 Picture with nametag and White background (4 pcs)</li>' +
            '<li>Original and Photocopy of Birth Certificate from PSA</li>' +
            '<li>Original and Photocopy of Good Moral Character</li>' +
            '<li>Original and Photocopy of Police Clearance</li>' +
            '<li>Original and Photocopy of Academic Records' +
              '<ol class="sub-sub-reminder-list">' +
                '<li>Grade 12 Report Card</li>' +
                '<li>Transcript of Records (For Transferees)</li>' +
                '<li>ALS Certification of rating qualified for College Admission</li>' +
              '</ol>' +
            '</li>' +
            '<li><strong>Filled out and signed Reconsideration and Waiver Forms (waiver must be signed by the parent/guardian),</strong> accessible here: <a href="https://tinyurl.com/SLSUAdmissionForms" target="_blank" rel="noopener noreferrer" class="fb-link">https://tinyurl.com/SLSUAdmissionForms</a><br><strong>A photocopy of the parent/guardian valid ID with signature is required for validation.</strong></li>' +
          '</ol>' +
        '</li>' +
        '<li>College applicants are <strong>required to wear a plain white shirt and maong pants</strong> during slot confirmation.</li>' +
        '<li><strong>No reservation fees</strong> are to be collected to confirm the admission slot.</li>' +
        '<li>Applicants who require a companion may bring only one (1) person inside the premises.</li>' +
        '<li>Non-appearance on the given schedule means forfeiture of the admission slot.</li>' +
        '<li>In case a program reaches its quota, qualified applicants may still apply for reconsideration in programs with available slots. However, reconsideration is still subject to approval and the availability of slots.</li>' +
        '<li><strong>Only those who are scheduled will be entertained.</strong></li>' +
        '<li>Practice CLAYGO before leaving the confirmation venue.</li>' +
      '</ol></div>',
    schedule:
      '<div class="info-card"><h4><span>&#128197;</span> Confirmation Schedule (DPWAS)</h4><p class="read-note"><strong>Schedule Notice:</strong> DPWAS schedule is individualized. Please enter your Application Number in the checker to view your assigned Date and Time.</p><ul class="quick-points"><li>Venue: SLSU Gymnasium, Lucban, Quezon</li><li>Please arrive at least 30 minutes before your assigned schedule.</li></ul></div>',
    requirements:
      '<div class="info-card"><h4><span>&#128203;</span> General Admission Requirements</h4><div class="req-section"><p class="req-heading">Primary Documents and Forms (Priority)</p><ul class="req-list"><li>Examination Permit (duly signed by test administrator)</li><li><strong>Required:</strong> Filled out and signed Reconsideration Form and Waiver Form</li><li><strong>Waiver must be signed by the parent/guardian.</strong></li><li><strong>Photocopy of parent/guardian valid ID with signature is required for validation.</strong></li></ul></div><div class="req-section"><p class="req-heading">(SuAcademic Records bmit whichever is applicable)</p><ul class="req-list"><li>Original &amp; Photocopy - Grade 12 Report Card</li><li>Original &amp; Photocopy - Transcript of Records (For Transferees)</li><li>Original &amp; Photocopy - ALS Certification of rating qualified for College Admission</li></ul></div><div class="req-section"><p class="req-heading">Supporting Documents</p><ul class="req-list"><li>2x2 Picture with nametag, white background (4 pcs)</li><li>Original &amp; Photocopy - Birth Certificate from PSA</li><li>Original &amp; Photocopy - Good Moral Character</li><li>Original &amp; Photocopy - Police Clearance</li></ul></div><div class="req-section"><p class="req-heading">Supplies</p><ul class="req-list"><li>Long White Folders (2 pcs)</li><li>Black Ballpen</li></ul></div><p class="req-link-card">Forms Link: <a href="https://tinyurl.com/SLSUAdmissionForms" target="_blank" rel="noopener noreferrer" class="fb-link">https://tinyurl.com/SLSUAdmissionForms</a></p></div>',
    medical:
      '<div class="info-card"><h4><span>&#129514;</span> Additional Medical Laboratory Examination Results</h4><p class="read-note"><strong>Note:</strong> DPWAS qualifiers are only required to submit laboratory examination results after securing a slot and once advised to do so.</p><table class="med-table"><thead><tr><th>Program</th><th>Required Tests</th></tr></thead><tbody><tr><td>Bachelor of Science in Nursing<br>Bachelor of Science in Radiologic Technology<br>Bachelor of Science in Midwifery</td><td>&bull; Chest X-Ray<br>&bull; CBC<br>&bull; Hepa B Screening (HBSAg, Anti-HBS, Anti-HBc)</td></tr><tr><td>Bachelor of Science in Hospitality Management<br>Bachelor of Industrial Technology major in Culinary Technology</td><td>&bull; Chest X-Ray<br>&bull; Hepa B Screening (HBSAg, Anti-HBS, Anti-HBc)</td></tr></tbody></table></div>',
    faq:
      '<div class="info-card"><h4><span>&#10067;</span> Frequently Asked Questions</h4>' +
        COMMON_FAQ_HTML +
        '<div class="faq-item"><p class="faq-q">What if my examinee number is not on the qualifiers or DPWAS lists?</p><p class="faq-a">You may apply for reconsideration, subject to approval and slot availability. Follow the instructions on the official Facebook page and visit the Admission Office on the scheduled date.</p></div>' +
        '<div class="faq-item"><p class="faq-q">Can I change or shift my course if I am in DPWAS or reconsideration?</p><p class="faq-a">No. Applicants must sign a waiver stating they waive the right to shift to any other program offered by the university.</p></div>' +
        '<div class="faq-item"><p class="faq-q">I missed the confirmation schedule. Can I still confirm my slot beyond my schedule?</p><p class="faq-a">For DPWAS applicants, missing the confirmation schedule forfeits the slot, but you may still report during reconsideration dates for programs with available slots.</p></div>' +
        '<div class="faq-item"><p class="faq-q">How will I be notified of the confirmation schedule?</p><p class="faq-a">Confirmation schedules will be posted on the Facebook page of Southern Luzon State University Main Campus and on the SLSU website.</p></div>' +
        '<div class="faq-item"><p class="faq-q">Can I confirm and enroll in an SLSU Satellite Campus if I took my entrance exam at the Main Campus?</p><p class="faq-a">Yes. You may apply for reconsideration during the Satellite Campus reconsideration dates.</p></div>' +
        '<div class="faq-item"><p class="faq-q">Can I still confirm my slot if some confirmation requirements are incomplete?</p><p class="faq-a">Yes, but your original report card or academic record must be presented on the day of confirmation.</p></div>' +
        '<div class="faq-item"><p class="faq-q">What should I do if I do not have a copy of my Examination Permit?</p><p class="faq-a">Submit a request letter for a second copy of your Examination Permit addressed to the Head of the Student Admission Office. The second copy will be released on the same day as your scheduled confirmation.</p></div>' +
        '<div class="faq-item"><p class="faq-q">What is the process of slot confirmation?</p><p class="faq-a">Access, download, and fill out the reconsideration form and waiver form for admission with the signature of the parent; report on the date of confirmation set by the Student Admission Office; and submit all requirements for confirmation of slots.</p></div>' +
      '</div>'
  },
  satellite: {
    reminders:
      '<div class="info-card"><h4><span>&#128204;</span> Important Reminders</h4><ol class="reminder-list">' +
        '<li>College applicants must pass the interview, laboratory examination (for specific programs), and other admission requirements to proceed with the confirmation process.</li>' +
        '<li><strong>Incomplete requirements will be processed, provided that primary documents such as original report card or academic records are presented on the day of confirmation.</strong> Qualifiers should bring the following requirements:' +
          '<ol class="sub-reminder-list">' +
            '<li>Examination Permit (duly signed by the test administrator)</li>' +
            '<li>Long White Folders (2 pcs)</li>' +
            '<li>Black Ballpen</li>' +
            '<li>2x2 Picture with nametag and White background (4 pcs)</li>' +
            '<li>Original and Photocopy of Birth Certificate from PSA</li>' +
            '<li>Original and Photocopy of Good Moral Character</li>' +
            '<li>Original and Photocopy of Police Clearance</li>' +
            '<li>Original and Photocopy of Academic Records' +
              '<ol class="sub-sub-reminder-list">' +
                '<li>Grade 12 Report Card</li>' +
                '<li>Transcript of Records (For Transferees)</li>' +
                '<li>ALS Certification of rating qualified for College Admission</li>' +
              '</ol>' +
            '</li>' +
          '</ol>' +
        '</li>' +
        '<li>College applicants are <strong>required to wear a plain white shirt and maong pants</strong> during slot confirmation.</li>' +
        '<li><strong>No reservation fees</strong> are to be collected to confirm the admission slot.</li>' +
        '<li>Applicants who require a companion may bring only one (1) person inside the premises.</li>' +
        '<li>Applicants for BS Hospitality Management are <strong>required to be accompanied</strong> by a parent or guardian for a short program orientation.</li>' +
        '<li>Non-appearance on the given schedule means forfeiture of the admission slot. Qualifiers who are unable to attend their scheduled date with valid reasons, such as transportation difficulties, medical concerns, or other justifiable circumstances.</li>' +
        '<li>In case a program reaches its quota, qualified applicants may still apply for reconsideration in programs with available slots, subject to approval and availability.</li>' +
        '<li><strong>Only qualified applicants will be entertained.</strong></li>' +
        '<li>Practice CLAYGO before leaving the confirmation venue.</li>' +
      '</ol></div>',
    schedule:
      '<div class="info-card"><h4><span>&#128197;</span> Schedule of Confirmation</h4><p class="read-note"><strong>Schedule Notice:</strong> Use the checker to view your assigned satellite campus, first-choice course, and report date.</p><ul class="quick-points"><li>SLSU Tiaong Campus: May 5-6, 2026</li><li>SLSU Tayabas Campus: May 5-6, 2026</li><li>Please proceed to the satellite campus indicated in your result on your scheduled confirmation date.</li><li>Bring all required documents and arrive at least 30 minutes early.</li><li>Non-appearance means forfeiture of your slot.</li></ul></div><div class="info-card"><h4><span>&#128260;</span> Schedule of Reconsideration</h4><ul class="quick-points"><li>SLSU Tiaong Campus: May 11, 2026</li><li>SLSU Tayabas Campus: May 11, 2026</li><li>Reconsideration is subject to approval and the availability of slots.</li></ul></div>',
    requirements:
      '<div class="info-card"><h4><span>&#128203;</span> General Admission Requirements</h4><div class="req-section"><p class="req-heading">Primary Documents and Forms (Priority)</p><ul class="req-list"><li>Examination Permit (duly signed by test administrator)</li></ul></div><div class="req-section"><p class="req-heading">Academic Records (Submit whichever is applicable)</p><ul class="req-list"><li>Original &amp; Photocopy - Grade 12 Report Card</li><li>Original &amp; Photocopy - Transcript of Records (For Transferees)</li><li>Original &amp; Photocopy - ALS Certification of rating qualified for College Admission</li></ul></div><div class="req-section"><p class="req-heading">Supporting Documents</p><ul class="req-list"><li>2x2 Picture with nametag, white background (4 pcs)</li><li>Original &amp; Photocopy - Birth Certificate from PSA</li><li>Original &amp; Photocopy - Good Moral Character</li><li>Original &amp; Photocopy - Police Clearance</li></ul></div><div class="req-section"><p class="req-heading">Supplies</p><ul class="req-list"><li>Long White Folders (2 pcs)</li><li>Black Ballpen</li></ul></div></div>',
    medical:
      '<div class="info-card"><h4><span>&#129514;</span> Additional Medical Laboratory Examination Results</h4><table class="med-table"><thead><tr><th>Program</th><th>Required Tests</th></tr></thead><tbody><tr><td>Bachelor of Science in Hospitality Management (SLSU Tayabas)<br>Bachelor of Technical-Vocational Teacher Education major in Food and Service Management (SLSU Lucena)<br>Bachelor of Science in Industrial Technology major in Food and Beverage Technology (SLSU-JGE Tagkawayan)</td><td>&bull; Chest X-Ray<br>&bull; Hepa B Screening (HBSAg, Anti-HBS, Anti-HBc)</td></tr><tr><td>Bachelor of Science in Nursing</td><td>&bull; Chest X-Ray<br>&bull; CBC<br>&bull; Hepa B Screening (HBSAg, Anti-HBS, Anti-HBc)</td></tr></tbody></table></div>',
    faq:
      '<div class="info-card"><h4><span>&#10067;</span> Frequently Asked Questions</h4>' +
        COMMON_FAQ_HTML +
        '<div class="faq-item"><p class="faq-q">What will the checker show?</p><p class="faq-a">It will show your assigned satellite campus, your first-choice course, and the date when you should report to that campus.</p></div>' +
        '<div class="faq-item"><p class="faq-q">Can I report to a different satellite campus?</p><p class="faq-a">No. Applicants should report to the satellite campus indicated in their result unless officially instructed otherwise.</p></div>' +
        '<div class="faq-item"><p class="faq-q">Should I screenshot my result?</p><p class="faq-a">Yes. Keep a screenshot of your result as proof of your assigned campus and schedule.</p></div>' +
        '<div class="faq-item"><p class="faq-q">What if I am not qualified?</p><p class="faq-a">Other opportunities such as reconsideration may still be available, subject to the availability of slots.</p></div>' +
      '</div>'
  }
};

function getCurrentModeConfig() {
  return CHECKER_MODES[currentCheckerMode] || CHECKER_MODES.satellite;
}

async function parseJsonResponse(response) {
  var payload = null;
  try {
    payload = await response.json();
  } catch (e) {
    payload = {};
  }
  return payload;
}

async function loadAllData() {
  var statusEl = document.getElementById('dataStatus');
  var modeConfig = getCurrentModeConfig();
  statusEl.innerHTML = '<div class="loading-bar"><div class="spinner"></div>' + modeConfig.loadingText + '</div>';
  try {
    var res = await fetch(buildApiUrl('/api/search-result', { mode: currentCheckerMode }), { cache: 'no-store' });
    var payload = await parseJsonResponse(res);
    if (!res.ok || !payload.ready) {
      throw new Error(payload && payload.error ? payload.error : 'Secure lookup is not available.');
    }
    statusEl.innerHTML = '';
    document.getElementById('appInput').disabled = false;
    document.getElementById('checkBtn').disabled = false;
    document.getElementById('appInput').focus();
  } catch (err) {
    statusEl.innerHTML = '<div class="error-bar">&#9888;&#65039; ' + modeConfig.loadErrorText + ' ' + escapeHtml(err.message) + '<br>Please refresh the page or contact the admission office.</div>';
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeAppNo(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function formatDateString(value) {
  var text = String(value || '').trim();
  if (!text) return text;
  var parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  return text;
}

function formatTimePart(value) {
  var text = String(value || '').trim().toUpperCase().replace(/\s+/g, '');
  var match = text.match(/^(\d{1,2})(?::?(\d{2}))?(AM|PM|NN|MN)$/);
  if (!match) return String(value || '').trim();

  var hour = Number(match[1]);
  var minute = match[2] || '00';
  var period = match[3];

  if (period === 'NN') period = 'PM';
  if (period === 'MN') period = 'AM';

  return hour + ':' + minute + ' ' + period;
}

function formatTimeRange(value) {
  var text = String(value || '').trim();
  if (!text) return text;

  var parts = text.split(/\s*[-–—]\s*/);
  if (parts.length === 2) {
    return formatTimePart(parts[0]) + ' - ' + formatTimePart(parts[1]);
  }

  return formatTimePart(text);
}

function getMainCampusCollege(program) {
  var normalized = normalizeAppNo(program);
  var exactMatches = {
    BACHELOROFARTSINHISTORY: 'College of Arts and Sciences',
    BACHELOROFARTSINPSYCHOLOGY: 'College of Arts and Sciences',
    BACHELOROFSCIENCEINPSYCHOLOGY: 'College of Arts and Sciences',
    BACHELOROFSCIENCEINBIOLOGY: 'College of Arts and Sciences',
    BACHELOROFSCIENCEINENVIRONMENTALSCIENCE: 'College of Arts and Sciences',
    BACHELOROFSCIENCEINMATHEMATICS: 'College of Arts and Sciences',
    BACHELOROFPUBLICADMINISTRATION: 'College of Administration, Business, Hospitality and Accountancy',
    BACHELOROFSCIENCEINACCOUNTANCY: 'College of Administration, Business, Hospitality and Accountancy',
    BACHELOROFSCIENCEINHOSPITALITYMANAGEMENT: 'College of Administration, Business, Hospitality and Accountancy',
    BACHELOROFSCIENCEINAGRICULTURE: 'College of Agriculture',
    BACHELOROFSCIENCEINFORESTRY: 'College of Agriculture',
    BACHELOROFSCIENCEINMIDWIFERY: 'College of Allied Medicine',
    BACHELOROFSCIENCEINNURSING: 'College of Allied Medicine',
    BACHELOROFSCIENCEINRADIOLOGICTECHNOLOGY: 'College of Allied Medicine',
    BACHELOROFSECONDARYEDUCATION: 'College of Teacher Education',
    BACHELOROFSECONDARYEDUCATIONMAJORINSCIENCES: 'College of Teacher Education',
    BACHELOROFSECONDARYEDUCATIONMAJORINSOCIALSTUDIES: 'College of Teacher Education',
    BACHELOROFTECHNOLOGYANDLIVELIHOODEDUCATIONMAJORINHOMEECONOMICS: 'College of Teacher Education',
    BACHELOROFTECHNOLOGYANDLIVELIHOODEDUCATIONMAJORININFORMATIONANDCOMMUNICATIONTECHNOLOGY: 'College of Teacher Education'
  };

  if (exactMatches[normalized]) return exactMatches[normalized];
  if (normalized.indexOf('BACHELOROFSCIENCEINBUSINESSADMINISTRATION') === 0) return 'College of Administration, Business, Hospitality and Accountancy';
  if (normalized.indexOf('BACHELOROFSCIENCEIN') === 0 && normalized.indexOf('ENGINEERING') !== -1) return 'College of Engineering';
  if (normalized.indexOf('BACHELOROFINDUSTRIALTECHNOLOGY') === 0) return 'College of Industrial Technology';

  return 'Main Campus';
}

function setActiveModeButton(mode) {
  document.querySelectorAll('.checker-switcher-link').forEach(function(button) {
    var isActive = button.getAttribute('data-checker-mode') === mode;
    button.classList.toggle('active', isActive);
    if (isActive) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  });
}

function updateCheckerCopy() {
  var modeConfig = getCurrentModeConfig();
  var titleEl = document.getElementById('checkerTitle');
  var subtitleEl = document.getElementById('checkerSubtitle');
  var infoTitleEl = document.getElementById('infoTitle');
  var infoSubtitleEl = document.getElementById('infoSubtitle');
  var inputEl = document.getElementById('appInput');

  if (titleEl) titleEl.textContent = modeConfig.title;
  if (subtitleEl) subtitleEl.textContent = modeConfig.subtitle;
  if (infoTitleEl) infoTitleEl.textContent = 'Information & Reminders';
  if (infoSubtitleEl) infoSubtitleEl.textContent = modeConfig.infoSubtitle;
  if (inputEl) inputEl.setAttribute('placeholder', modeConfig.placeholder);
  var buttonEl = document.getElementById('checkBtn');
  if (buttonEl && !buttonEl.disabled) buttonEl.innerHTML = '<span class="btn-shine"></span>' + modeConfig.buttonText;
}

function resetInfoTabs() {
  document.querySelectorAll('.tab-btn').forEach(function(button, index) {
    button.classList.toggle('active', index === 0);
  });
}

function renderInfoPanels(mode) {
  var content = INFO_CONTENT[mode] || INFO_CONTENT.satellite;
  var infoPanelsEl = document.getElementById('infoPanels');
  if (!infoPanelsEl) return;

  infoPanelsEl.innerHTML =
    '<div id="tab-reminders" class="tab-panel active">' + content.reminders + '</div>' +
    '<div id="tab-schedule" class="tab-panel">' + content.schedule + '</div>' +
    '<div id="tab-requirements" class="tab-panel">' + content.requirements + '</div>' +
    '<div id="tab-medical" class="tab-panel">' + content.medical + '</div>' +
    '<div id="tab-faq" class="tab-panel">' + content.faq + '</div>';
  resetInfoTabs();
}

function switchCheckerMode(mode) {
  if (!CHECKER_MODES[mode] || mode === currentCheckerMode) return;

  currentCheckerMode = mode;
  setActiveModeButton(mode);
  updateCheckerCopy();
  renderInfoPanels(mode);

  var inputEl = document.getElementById('appInput');
  var resultEl = document.getElementById('result');
  if (inputEl) inputEl.value = '';
  if (resultEl) resultEl.innerHTML = '';
}

function renderNotFoundResult(mode) {
  if (mode === 'main') {
    return '<div class="result-box result-fail">' +
      '<div class="res-header">' +
        '<div class="res-icon icon-fail">&#10069;</div>' +
        '<div class="res-header-text">' +
          '<div class="res-tag res-tag-fail">NOT ON THE QUALIFIER LIST</div>' +
        '</div>' +
      '</div>' +
      '<div class="res-divider-red"></div>' +
      '<p class="advisory-text">Southern Luzon State University (SLSU) will release the <strong>Degree Program with Available Slot (DPWAS)</strong> and <strong>Reconsideration</strong> lists for remaining available slots.</p>' +
      '<p class="advisory-text">The lists, along with the corresponding guidelines, will be posted <strong>after the confirmation of slots for qualified applicants has been completed</strong>.</p>' +
      '<p class="advisory-text">For updates and further instructions, please wait for official announcements on the SLSU Facebook page and website.</p>' +
    '</div>';
  }

  if (mode === 'dpwas') {
    return '<div class="result-box result-warning">' +
      '<div class="res-header">' +
        '<div class="res-icon icon-warning">&#8505;</div>' +
        '<div class="res-header-text">' +
          '<div class="res-tag res-tag-warning">NOT ON THE DPWAS LIST</div>' +
        '</div>' +
      '</div>' +
      '<div class="res-divider-warning"></div>' +
      '<p class="advisory-text">Thank you for your interest in SLSU. Although you are not included in the DPWAS list at this time, other opportunities such as reconsideration may still be available.<br><br>Please stay tuned for further announcements through the official Facebook pages of <a href="https://www.facebook.com/slsuMain" target="_blank" rel="noopener noreferrer" class="fb-link">SLSU Main</a> or the <a href="https://www.facebook.com/SLSUAdmission" target="_blank" rel="noopener noreferrer" class="fb-link">SLSU Student Admission Office</a>.</p>' +
    '</div>';
  }

  return '<div class="result-box result-warning">' +
    '<div class="res-header">' +
      '<div class="res-icon icon-warning">&#8505;</div>' +
      '<div class="res-header-text">' +
        '<div class="res-tag res-tag-warning">NO SATELLITE CAMPUS QUALIFIER RECORD FOUND</div>' +
      '</div>' +
    '</div>' +
    '<div class="res-divider-warning"></div>' +
    '<p class="advisory-text">Thank you for checking. Your Application Number is not found in the Satellite Campus qualifier data currently uploaded to this checker.<br><br>Please wait for further announcements from your target satellite campus, the <a href="https://www.facebook.com/slsuMain" target="_blank" rel="noopener noreferrer" class="fb-link">SLSU Main Campus</a>, and the <a href="https://www.facebook.com/SLSUAdmission" target="_blank" rel="noopener noreferrer" class="fb-link">SLSU Student Admission Office</a>.</p>' +
  '</div>';
}

function renderMainQualifierResult(displayKey, payload) {
  var displayProgram = String(payload.program || '').trim() || 'To be announced';
  var displayCollege = getMainCampusCollege(displayProgram);
  return '<div class="result-box result-success">' +
    '<div class="res-header">' +
      '<div class="res-icon icon-success">&#127881;</div>' +
      '<div class="res-header-text">' +
        '<div class="res-tag">&#10003; Qualified</div>' +
        '<h3>Congratulations!</h3>' +
      '</div>' +
    '</div>' +
    '<div class="res-divider"></div>' +
    '<div class="res-row"><div class="res-label">App. No.</div><div class="res-val">' + escapeHtml(displayKey) + '</div></div>' +
    '<div class="res-row"><div class="res-label">College</div><div class="res-val program">' + escapeHtml(displayCollege) + '</div></div>' +
    '<div class="res-row"><div class="res-label">1st Choice Program</div><div class="res-val program">' + escapeHtml(displayProgram) + '</div></div>' +
    '<div class="congrats-note">' +
      'You have qualified for your first choice program. Please proceed to the <strong>SLSU Student Admission Office</strong> on your scheduled confirmation date. Bring all required documents and arrive at least <strong>30 minutes early</strong>. Non-appearance means <strong>forfeiture of your slot</strong>.' +
    '</div>' +
  '</div>';
}

function renderDpwasResult(displayKey, payload) {
  var dpwasDate = formatDateString(payload.date) || 'To be announced';
  var dpwasTime = formatTimeRange(payload.time) || 'To be announced';
  return '<div class="result-box result-success">' +
    '<div class="res-header">' +
      '<div class="res-icon icon-success">&#127881;</div>' +
      '<div class="res-header-text">' +
        '<h3>DPWAS Eligible</h3>' +
      '</div>' +
    '</div>' +
    '<div class="res-divider"></div>' +
    '<div class="res-row"><div class="res-label">App. No.</div><div class="res-val">' + escapeHtml(displayKey) + '</div></div>' +
    '<div class="res-row"><div class="res-label">Date</div><div class="res-val program">' + escapeHtml(dpwasDate) + '</div></div>' +
    '<div class="res-row"><div class="res-label">Time</div><div class="res-val program">' + escapeHtml(dpwasTime) + '</div></div>' +
    '<div class="congrats-note">' +
      'Thank you for your participation in the SLSU College Admissions 2026.<br><br>' +
      'The slots in the degree program you applied for have already been filled. However, you have been placed on the waitlist under the Degree Program with Available Slots (DPWAS) category at SLSU Main Campus.<br><br>' +
      'Your admission will depend on the availability of slots after the confirmation period, during which waitlisted applicants may be selected to fill vacated slots. Please note that being waitlisted under DPWAS does not guarantee admission to the university.<br><br>' +
      'You are advised to report on ' + escapeHtml(dpwasDate) + ', from ' + escapeHtml(dpwasTime) + ' at the SLSU Gymnasium in Lucban, Quezon. Kindly bring all required documents and arrive at least 30 minutes early. Rescheduling will not be accommodated.' +
    '</div>' +
    '<p class="screenshot-note">Screenshot this as proof of your schedule.</p>' +
  '</div>';
}

function renderDpwasFirstReleaseResult(displayKey, payload) {
  var displayProgram = String(payload.program || '').trim() || 'To be announced';
  return '<div class="result-box result-info">' +
    '<div class="res-header">' +
      '<div class="res-icon icon-info">&#10003;</div>' +
      '<div class="res-header-text">' +
        '<div class="res-tag res-tag-info">&#10003; First Release Qualifier</div>' +
      '</div>' +
    '</div>' +
    '<div class="res-divider"></div>' +
    '<div class="res-row"><div class="res-label res-label-info">App. No.</div><div class="res-val">' + escapeHtml(displayKey) + '</div></div>' +
    '<div class="res-row"><div class="res-label res-label-info">1st Choice Program</div><div class="res-val program program-info">' + escapeHtml(displayProgram) + '</div></div>' +
    '<div class="congrats-note congrats-note-info">You are included in the first admission results and have qualified for your first-choice program.</div>' +
  '</div>';
}

async function checkResult() {
  var raw = document.getElementById('appInput').value.trim();
  var resultEl = document.getElementById('result');
  var buttonEl = document.getElementById('checkBtn');
  var modeConfig = getCurrentModeConfig();

  if (!raw) {
    resultEl.innerHTML = '<div class="result-box result-fail"><p style="font-size:14px;color:#8b4513;">&#9888;&#65039; ' + escapeHtml(modeConfig.emptyText) + '</p></div>';
    return;
  }

  var displayKey = raw.toUpperCase();
  var lookupKey = normalizeAppNo(raw);

  buttonEl.disabled = true;
  buttonEl.textContent = 'Checking...';

  try {
    var response = await fetch(buildApiUrl('/api/search-result', { q: lookupKey, mode: currentCheckerMode }), {
      cache: 'no-store'
    });
    var payload = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(payload && payload.error ? payload.error : 'Lookup failed.');
    }

    if (payload.found) {
      if (payload.type === 'satellite_qualifier' && currentCheckerMode === 'satellite') {
        var displaySatellite = String(payload.satellite || '').trim() || 'To be announced';
        var displayCourse = String(payload.course || '').trim() || 'To be announced';
        var displayDate = formatDateString(payload.date) || 'To be announced';
        resultEl.innerHTML =
          '<div class="result-box result-success">' +
            '<div class="res-header">' +
              '<div class="res-icon icon-success">&#127881;</div>' +
              '<div class="res-header-text">' +
                '<h3>Satellite Campus Qualifier</h3>' +
              '</div>' +
            '</div>' +
            '<div class="res-divider"></div>' +
            '<div class="res-row"><div class="res-label">App. No.</div><div class="res-val">' + escapeHtml(displayKey) + '</div></div>' +
            '<div class="res-row"><div class="res-label res-label-info">Satellite Campus</div><div class="res-val program program-info">' + escapeHtml(displaySatellite) + '</div></div>' +
            '<div class="res-row"><div class="res-label res-label-info">Course</div><div class="res-val program program-info">' + escapeHtml(displayCourse) + '</div></div>' +
            '<div class="res-row"><div class="res-label res-label-info">Date</div><div class="res-val program program-info">' + escapeHtml(displayDate) + '</div></div>' +
            '<div class="congrats-note">' +
              'Congratulations. You are included in the SLSU Satellite Campus qualifier list for A.Y. 2026-2027.<br><br>' +
              'Please report to <strong>' + escapeHtml(displaySatellite) + '</strong> on <strong>' + escapeHtml(displayDate) + '</strong> for your first-choice course, <strong>' + escapeHtml(displayCourse) + '</strong>. Bring your required documents and follow the instructions of the assigned campus.' +
            '</div>' +
            '<p class="screenshot-note">Screenshot this as proof of your assigned campus and schedule.</p>' +
          '</div>';
      } else if (payload.type === 'main_dpwas' && currentCheckerMode === 'dpwas') {
        resultEl.innerHTML = renderDpwasResult(displayKey, payload);
      } else if (payload.type === 'main_first_choice' && currentCheckerMode === 'main') {
        resultEl.innerHTML = renderMainQualifierResult(displayKey, payload);
      } else if (payload.type === 'main_first_choice' && currentCheckerMode === 'dpwas') {
        resultEl.innerHTML = renderDpwasFirstReleaseResult(displayKey, payload);
      } else {
        resultEl.innerHTML = renderNotFoundResult(currentCheckerMode);
      }
    } else {
      resultEl.innerHTML = renderNotFoundResult(currentCheckerMode);
    }
  } catch (err) {
    resultEl.innerHTML = '<div class="result-box result-fail"><p style="font-size:14px;color:#8b4513;">&#9888;&#65039; ' + escapeHtml(err.message) + '</p></div>';
  } finally {
    buttonEl.disabled = false;
    buttonEl.innerHTML = '<span class="btn-shine"></span>' + modeConfig.buttonText;
  }

  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function switchTab(btn, tab) {
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('tab-' + tab).classList.add('active');
  btn.classList.add('active');
}

updateCheckerCopy();
setActiveModeButton(currentCheckerMode);
renderInfoPanels(currentCheckerMode);
loadAllData();


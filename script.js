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
  statusEl.innerHTML = '<div class="loading-bar"><div class="spinner"></div>Preparing secure satellite campus qualifier lookup&hellip;</div>';
  try {
    var res = await fetch(buildApiUrl('/api/search-result'), { cache: 'no-store' });
    var payload = await parseJsonResponse(res);
    if (!res.ok || !payload.ready) {
      throw new Error(payload && payload.error ? payload.error : 'Secure lookup is not available.');
    }
    statusEl.innerHTML = '';
    document.getElementById('appInput').disabled = false;
    document.getElementById('checkBtn').disabled = false;
    document.getElementById('appInput').focus();
  } catch (err) {
    statusEl.innerHTML = '<div class="error-bar">&#9888;&#65039; Could not load secure satellite qualifier data. ' + escapeHtml(err.message) + '<br>Please refresh the page or contact the admission office.</div>';
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

async function checkResult() {
  var raw = document.getElementById('appInput').value.trim();
  var resultEl = document.getElementById('result');
  var buttonEl = document.getElementById('checkBtn');

  if (!raw) {
    resultEl.innerHTML = '<div class="result-box result-fail"><p style="font-size:14px;color:#8b4513;">&#9888;&#65039; Please enter your Application Number before checking.</p></div>';
    return;
  }

  var displayKey = raw.toUpperCase();
  var lookupKey = normalizeAppNo(raw);

  buttonEl.disabled = true;
  buttonEl.textContent = 'Checking...';

  try {
    var response = await fetch(buildApiUrl('/api/search-result', { q: lookupKey }), {
      cache: 'no-store'
    });
    var payload = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(payload && payload.error ? payload.error : 'Lookup failed.');
    }

    if (payload.found) {
      if (payload.type === 'satellite_qualifier') {
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
      } else if (payload.type === 'main_dpwas') {
        var dpwasDate = formatDateString(payload.date) || 'To be announced';
        var dpwasTime = String(payload.time || '').trim() || 'To be announced';
        resultEl.innerHTML =
          '<div class="result-box result-info">' +
            '<div class="res-header">' +
              '<div class="res-icon icon-info">&#10003;</div>' +
              '<div class="res-header-text">' +
                '<div class="res-tag res-tag-info">MAIN CAMPUS DPWAS LIST</div>' +
              '</div>' +
            '</div>' +
            '<div class="res-divider"></div>' +
            '<div class="res-row"><div class="res-label res-label-info">App. No.</div><div class="res-val">' + escapeHtml(displayKey) + '</div></div>' +
            '<div class="res-row"><div class="res-label res-label-info">Date</div><div class="res-val program program-info">' + escapeHtml(dpwasDate) + '</div></div>' +
            '<div class="res-row"><div class="res-label res-label-info">Time</div><div class="res-val program program-info">' + escapeHtml(dpwasTime) + '</div></div>' +
            '<div class="congrats-note congrats-note-info">This Application Number is included in the SLSU Main Campus DPWAS list. Please report on <strong>' + escapeHtml(dpwasDate) + '</strong> at <strong>' + escapeHtml(dpwasTime) + '</strong> and follow the Main Campus DPWAS instructions.</div>' +
          '</div>';
      } else if (payload.type === 'main_first_choice') {
        var displayProgram = String(payload.program || '').trim() || 'To be announced';
        resultEl.innerHTML =
          '<div class="result-box result-info">' +
            '<div class="res-header">' +
              '<div class="res-icon icon-info">&#10003;</div>' +
              '<div class="res-header-text">' +
                '<div class="res-tag res-tag-info">MAIN CAMPUS FIRST-CHOICE QUALIFIER</div>' +
              '</div>' +
            '</div>' +
            '<div class="res-divider"></div>' +
            '<div class="res-row"><div class="res-label res-label-info">App. No.</div><div class="res-val">' + escapeHtml(displayKey) + '</div></div>' +
            '<div class="res-row"><div class="res-label res-label-info">1st Choice Program</div><div class="res-val program program-info">' + escapeHtml(displayProgram) + '</div></div>' +
            '<div class="congrats-note congrats-note-info">This Application Number is included in the SLSU Main Campus first-choice qualifier list.</div>' +
          '</div>';
      }
    } else {
      resultEl.innerHTML =
        '<div class="result-box result-warning">' +
          '<div class="res-header">' +
            '<div class="res-icon icon-warning">&#8505;</div>' +
            '<div class="res-header-text">' +
              '<div class="res-tag res-tag-warning">NO CURRENT RECORD FOUND</div>' +
            '</div>' +
          '</div>' +
          '<div class="res-divider-warning"></div>' +
          '<p class="advisory-text">Thank you for checking. Your Application Number is not found in the qualifier data currently uploaded to this checker.<br><br>This does not automatically mean that you are not qualified. Some SLSU Satellite Campuses may release their qualifier lists on different dates, and this checker will only show records from campuses whose data has already been provided and uploaded.<br><br>Please wait for further announcements from your target satellite campus and the <a href="https://www.facebook.com/SLSUAdmission" target="_blank" rel="noopener noreferrer" class="fb-link">SLSU Student Admission Office</a>.</p>' +
        '</div>';
    }
  } catch (err) {
    resultEl.innerHTML = '<div class="result-box result-fail"><p style="font-size:14px;color:#8b4513;">&#9888;&#65039; ' + escapeHtml(err.message) + '</p></div>';
  } finally {
    buttonEl.disabled = false;
    buttonEl.innerHTML = '<span class="btn-shine"></span>Check My Status';
  }

  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function switchTab(btn, tab) {
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('tab-' + tab).classList.add('active');
  btn.classList.add('active');
}

loadAllData();



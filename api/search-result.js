var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var SATELLITE_FILE = path.join(process.cwd(), 'api', 'satellite_qualifiers.secure.json');
var FIRST_RELEASE_FILE = path.join(process.cwd(), 'api', 'data.secure.json');
var DPWAS_FILE = path.join(process.cwd(), 'api', 'dpwas.secure.json');

var PROTOTYPE_RECORDS = {
  '202690001': {
    found: true,
    type: 'satellite_qualifier',
    satellite: 'SLSU Lucena Campus',
    course: 'Bachelor of Science in Information Technology',
    date: 'May 8, 2026'
  },
  '202690002': {
    found: true,
    type: 'satellite_qualifier',
    satellite: 'SLSU Tiaong Campus',
    course: 'Bachelor of Science in Business Administration',
    date: 'May 8, 2026'
  },
  '202690003': {
    found: true,
    type: 'satellite_qualifier',
    satellite: 'SLSU Gumaca Campus',
    course: 'Bachelor of Elementary Education',
    date: 'May 9, 2026'
  },
  '202690004': {
    found: true,
    type: 'satellite_qualifier',
    satellite: 'SLSU Catanauan Campus',
    course: 'Bachelor of Science in Hospitality Management',
    date: 'May 9, 2026'
  },
  '202690005': {
    found: true,
    type: 'satellite_qualifier',
    satellite: 'SLSU Polillo Campus',
    course: 'Bachelor of Science in Agriculture',
    date: 'May 10, 2026'
  },
  '202690006': {
    found: true,
    type: 'main_first_choice',
    program: 'BACHELOR OF SCIENCE IN NURSING'
  },
  '202690007': {
    found: true,
    type: 'main_first_choice',
    program: 'BACHELOR OF SCIENCE IN MIDWIFERY'
  },
  '202690008': {
    found: true,
    type: 'main_first_choice',
    program: 'BACHELOR OF SCIENCE IN PSYCHOLOGY'
  },
  '202690009': {
    found: true,
    type: 'main_first_choice',
    program: 'BACHELOR OF SCIENCE IN CIVIL ENGINEERING'
  },
  '202690010': {
    found: true,
    type: 'main_first_choice',
    program: 'BACHELOR OF SECONDARY EDUCATION'
  },
  '202690011': {
    found: true,
    type: 'main_dpwas',
    date: 'April 29, 2026',
    time: '10AM-11AM'
  },
  '202690012': {
    found: true,
    type: 'main_dpwas',
    date: 'April 29, 2026',
    time: '11AM-12NN'
  },
  '202690013': {
    found: true,
    type: 'main_dpwas',
    date: 'April 30, 2026',
    time: '8AM-9AM'
  },
  '202690014': {
    found: true,
    type: 'main_dpwas',
    date: 'April 30, 2026',
    time: '9AM-10AM'
  },
  '202690015': {
    found: true,
    type: 'main_dpwas',
    date: 'April 30, 2026',
    time: '10AM-11AM'
  }
};

function getEnv(name) {
  var value = process.env[name];
  return value ? String(value).trim() : '';
}

function normalizeAppNo(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function deriveKeys(secret) {
  var digest = crypto.createHash('sha512').update(secret, 'utf8').digest();
  return {
    encKey: digest.subarray(0, 32),
    macKey: digest.subarray(32, 64)
  };
}

function decryptRecord(payload, keys) {
  var iv = Buffer.from(payload.iv, 'base64');
  var ciphertext = Buffer.from(payload.data, 'base64');
  var mac = Buffer.from(payload.mac, 'base64');
  var expectedMac = crypto.createHmac('sha256', keys.macKey)
    .update(iv)
    .update(ciphertext)
    .digest();

  if (mac.length !== expectedMac.length || !crypto.timingSafeEqual(mac, expectedMac)) {
    throw new Error('Encrypted record integrity check failed.');
  }

  var decipher = crypto.createDecipheriv('aes-256-cbc', keys.encKey, iv);
  var plaintext = decipher.update(ciphertext, undefined, 'utf8');
  plaintext += decipher.final('utf8');
  return plaintext;
}

function loadSecureData(filePath, secretName) {
  var selectedSecretName = secretName || 'DATA_ENCRYPTION_KEY';
  var secret = getEnv(selectedSecretName);
  if (!secret) {
    throw new Error('Missing ' + selectedSecretName + ' environment variable.');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error('Missing secure data file: ' + path.basename(filePath) + '. Generate it before deploying.');
  }

  var raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  var payload = JSON.parse(raw);
  if (!payload || payload.version !== 1 || !payload.records) {
    throw new Error('Invalid secure data file format for ' + path.basename(filePath) + '.');
  }

  return {
    keys: deriveKeys(secret),
    records: payload.records
  };
}

function findEncryptedRecord(filePath, appHash, secretName) {
  try {
    var secureData = loadSecureData(filePath, secretName);
    var encryptedRecord = secureData.records[appHash];
    if (!encryptedRecord) {
      return null;
    }
    return decryptRecord(encryptedRecord, secureData.keys);
  } catch (e) {
    return null;
  }
}

function getPrototypeRecord(normalized) {
  return PROTOTYPE_RECORDS[normalized] || null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    var query = req.query && typeof req.query.q === 'string' ? req.query.q : '';
    var normalized = normalizeAppNo(query);

    if (!normalized) {
      try {
        loadSecureData(SATELLITE_FILE);
        return res.status(200).json({ ready: true, protected: true });
      } catch (error) {
        return res.status(200).json({ ready: true, protected: false, prototype: true });
      }
    }

    var appHash = crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
    var satelliteRecord = findEncryptedRecord(SATELLITE_FILE, appHash);

    if (satelliteRecord) {
      var qualifierInfo = JSON.parse(satelliteRecord);
      return res.status(200).json({
        found: true,
        type: 'satellite_qualifier',
        satellite: qualifierInfo.satellite,
        course: qualifierInfo.course,
        date: qualifierInfo.date
      });
    }

    var prototypeRecord = getPrototypeRecord(normalized);
    if (prototypeRecord) {
      return res.status(200).json(prototypeRecord);
    }

    var mainSecretName = getEnv('MAIN_DATA_ENCRYPTION_KEY') ? 'MAIN_DATA_ENCRYPTION_KEY' : 'DATA_ENCRYPTION_KEY';
    var dpwasRecord = findEncryptedRecord(DPWAS_FILE, appHash, mainSecretName);
    if (dpwasRecord) {
      var dpwasInfo = JSON.parse(dpwasRecord);
      return res.status(200).json({
        found: true,
        type: 'main_dpwas',
        date: dpwasInfo.date,
        time: dpwasInfo.time
      });
    }

    var firstReleaseRecord = findEncryptedRecord(FIRST_RELEASE_FILE, appHash, mainSecretName);
    if (firstReleaseRecord) {
      return res.status(200).json({
        found: true,
        type: 'main_first_choice',
        program: firstReleaseRecord
      });
    }

    return res.status(200).json({ found: false });
  } catch (error) {
    return res.status(500).json({
      error: error && error.message ? error.message : 'Unexpected server error'
    });
  }
};



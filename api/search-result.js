var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var SATELLITE_FILE = path.join(process.cwd(), 'api', 'satellite_qualifiers.secure.json');

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

function loadSecureData(filePath) {
  var secret = getEnv('DATA_ENCRYPTION_KEY');
  if (!secret) {
    throw new Error('Missing DATA_ENCRYPTION_KEY environment variable.');
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

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    var query = req.query && typeof req.query.q === 'string' ? req.query.q : '';
    var normalized = normalizeAppNo(query);

    if (!normalized) {
      loadSecureData(SATELLITE_FILE);
      return res.status(200).json({ ready: true, protected: true });
    }

    var satelliteData = loadSecureData(SATELLITE_FILE);
    var appHash = crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
    var encryptedRecord = satelliteData.records[appHash];

    if (!encryptedRecord) {
      return res.status(200).json({ found: false });
    }

    var qualifierInfo = JSON.parse(decryptRecord(encryptedRecord, satelliteData.keys));
    return res.status(200).json({
      found: true,
      satellite: qualifierInfo.satellite,
      course: qualifierInfo.course,
      date: qualifierInfo.date
    });
  } catch (error) {
    return res.status(500).json({
      error: error && error.message ? error.message : 'Unexpected server error'
    });
  }
};

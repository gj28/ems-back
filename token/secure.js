const crypto = require('crypto');

function encryptData(data, secretKey) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.createHash('sha256').update(secretKey).digest('base64').substr(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encryptedData = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encryptedData += cipher.final('hex');

  return {
    data: encryptedData,
    iv: iv.toString('hex')
  };
}

function decryptData(data, iv, secretKey) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.createHash('sha256').update(secretKey).digest('base64').substr(0, 32);
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
  let decryptedData = decipher.update(data, 'hex', 'utf8');
  decryptedData += decipher.final('utf8');

  return JSON.parse(decryptedData);
}

module.exports = { encryptData, decryptData };

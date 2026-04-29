const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const JWT_SECRET = env.JWT_SECRET || "hcdc_iarchive_secret_key_2025";

const adminPayload = {
  userId: 'b879c68b-d398-4909-9572-1c4a2bca3b45',
  email: 'iarchive@hcdc.edu.ph',
  role: 'admin',
  name: 'System Admin'
};

const token = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '1h' });
console.log(token);

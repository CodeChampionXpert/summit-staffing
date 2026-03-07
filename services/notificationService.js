require('dotenv').config();

const axios = require('axios');

const pool = require('../config/database');

const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const serverKey = process.env.FIREBASE_SERVER_KEY;
    if (!serverKey) {
      return;
    }

    const tokensRes = await pool.query('SELECT token FROM user_push_tokens WHERE user_id = $1', [userId]);
    const tokens = tokensRes.rows.map((r) => r.token).filter(Boolean);

    if (tokens.length === 0) {
      return;
    }

    await axios.post(
      'https://fcm.googleapis.com/fcm/send',
      {
        registration_ids: tokens,
        notification: {
          title,
          body
        },
        data
      },
      {
        headers: {
          Authorization: `key=${serverKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
  } catch (err) {
    // swallow notification errors
  }
};

module.exports = {
  sendPushNotification
};

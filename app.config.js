require('dotenv').config();

module.exports = {
  expo: {
    ...require('./app.json').expo,
    extra: {
      EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      EXPO_PUBLIC_CLOUDCONVERT_API_KEY: process.env.EXPO_PUBLIC_CLOUDCONVERT_API_KEY,
    },
  },
};

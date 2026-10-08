// Vercel Serverless Function entry point
module.exports = async (req, res) => {
  let handler;
  try {
    const mod = require('../backend/dist/serverless');
    handler = mod.default || mod;
  } catch (err) {
    try {
      const mod = require('../backend/src/serverless');
      handler = mod.default || mod;
    } catch (e) {
      console.error('Failed to load serverless backend module:', err, e);
      return res.status(500).json({
        success: false,
        error: 'Backend handler initialization error',
        details: err.message,
      });
    }
  }

  return handler(req, res);
};

function notFound(req, res) {
  res.status(404).json({ message: 'Resource not found.' });
}

// Centralised error handler — formats errors cleanly
function errorHandler(err, req, res, next) {
  console.error('[error]', err.message || err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum allowed size is 20MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  res.status(status).json({
    message: err.message || 'Something went wrong. Please try again.',
  });
}

module.exports = { notFound, errorHandler };

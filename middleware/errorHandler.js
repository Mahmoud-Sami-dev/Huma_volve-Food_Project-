const errorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((item) => item.message);
    return res.status(400).json({
      status: 'fail',
      message: messages.join(', '),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid ID format.',
    });
  }

  console.error(err);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong on the server.',
  });
};

module.exports = errorHandler;

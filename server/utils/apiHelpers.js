class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

const sendSuccess = (res, statusCode, data, message = 'Success') => {
  res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

const sendError = (res, statusCode, message) => {
  res.status(statusCode).json({
    status: 'fail',
    message,
  });
};

module.exports = { AppError, catchAsync, sendSuccess, sendError };

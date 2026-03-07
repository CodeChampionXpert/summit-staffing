const express = require('express');
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

const emailValidator = body('email').isEmail().withMessage('Valid email is required').normalizeEmail();
const passwordValidator = body('password')
  .isString()
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters');

router.post(
  '/register',
  [
    emailValidator,
    passwordValidator,
    body('role')
      .isIn(['worker', 'participant', 'admin'])
      .withMessage("Role must be one of: 'worker', 'participant', 'admin'"),
    body('abn')
      .optional({ nullable: true })
      .isLength({ min: 11, max: 11 })
      .withMessage('ABN must be 11 characters'),
    body('first_name').optional({ nullable: true }).isString(),
    body('last_name').optional({ nullable: true }).isString(),
    body('ndis_number').optional({ nullable: true }).isLength({ min: 10, max: 10 })
  ],
  (req, res, next) => {
    // Enforce required worker fields
    if (req.body.role === 'worker') {
      if (!req.body.abn || !req.body.first_name || !req.body.last_name) {
        return res.status(400).json({
          ok: false,
          error: 'Worker registration requires abn, first_name, last_name'
        });
      }
    }
    return next();
  },
  authController.register
);

router.post('/login', [emailValidator, body('password').isString()], authController.login);

router.post('/forgot-password', [emailValidator], authController.forgotPassword);

router.post(
  '/reset-password',
  [
    body('token').isString().isLength({ min: 10 }).withMessage('Reset token is required'),
    body('newPassword')
      .isString()
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
  ],
  authController.resetPassword
);

router.post('/verify-email', [body('token').isString().isLength({ min: 10 }).withMessage('Verification token is required')], authController.verifyEmail);

router.post('/refresh', auth, authController.refreshToken);

module.exports = router;

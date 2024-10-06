const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const Multer = require("multer");
const path = require('path');

const { 
    sendingVerificationCodeForEmailVerify,
    verifyingEmailVerification,
    sendVerificationCodeForPasswordReset,
    verifyingPasswordReset,
    resettingPassword,
    updateUserInfo,
    getUserInfoWithUpdatedToken,
    updatingUserPassword,
    createContactOrFaqForm,
    creatingSubscribedUser
 } = require("../controller/userController");


 // Define the maximum file size (in bytes) for each image. For example, 5MB:
const MAX_SIZE = 5 * 1024 * 1024;

// Define allowed image extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];

// Create the memory storage:
const storage = Multer.memoryStorage();

// Create the upload middleware with file filter and size limits:
const upload = Multer({
  storage,
  limits: {
    fileSize: MAX_SIZE, // Limit each file size to MAX_SIZE
  },
  fileFilter: (req, file, cb) => {
    // Check the file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      // If the file has an allowed extension, accept it
      cb(null, true);
    } else {
      // If the file does not have an allowed extension, reject it
      cb(new Error('Only image files with .jpg, .jpeg, .png, .gif, .bmp extensions are allowed!'), false);
    }
  },
});

//endpoint to send verification code to verify email
router.post("/request-verify-code", sendingVerificationCodeForEmailVerify);

//endpoint to verify email
router.post("/verify-email", verifyingEmailVerification);

//endpoint to send verification code to reset password
router.post("/request-reset-password-code", sendVerificationCodeForPasswordReset);

//endpoint to verify password reset
router.post("/verify-password-reset", verifyingPasswordReset);

//endpoint to reset password
router.post("/reset-password", resettingPassword);

//endpoint to update user info
router.put("/update-user-info", authMiddleware, upload.single("dp"), updateUserInfo);

//endpoint to get user info with updated token
router.get("/user-info", authMiddleware, getUserInfoWithUpdatedToken);

//endpoint to check the validity of the token
router.get("/check-token-validity", authMiddleware, (req, res) => {
    return res.status(200).json({ user: req.user, message: "Token is valid" });
});

//endpoint to update user password
router.patch("/update-user-password", authMiddleware, updatingUserPassword);

//endpoint to create contact form
router.post("/submit-contact-or-faq-form", createContactOrFaqForm);

//endpoint to create subscribed user
router.post("/submit-subscribed-user",creatingSubscribedUser);

 module.exports = router;
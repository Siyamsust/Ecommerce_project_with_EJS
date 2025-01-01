const express = require('express');

const authController = require('../controllers/auth');
//const isauth = require('../middleware/isauth');
const {check,body}=require('express-validator');
const router = express.Router();

router.get('/login', authController.getLogin);

router.post('/login', authController.postLogin);
router.get('/signup', authController.getSignup);
router.post('/signup',[
    check('email')
    .isEmail()
    .withMessage('Enter a valid email'),
    body('phone','phone number must be 11 characters')
    .matches(/^[0-9]{11}$/),
    body('password','please enter a password with 5 characters')
    .isLength({min: 5}),
body('confirmPassword').custom((value,{req})=>{
 if(value!==req.body.password){
     throw new Error('passwords have to match');
 }
return true;

}) ],authController.postSignup);  
router.post('/logout', authController.postLogout);
router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);
router.get('/reset/:token',authController.getNewPassword);
router.post('/new-password', body('password','please enter a password with 5 characters')
.isLength({min: 5}),authController.postNewPassword);
module.exports = router;
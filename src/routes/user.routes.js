import { Router } from "express";

import { loginUser, registerUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from '../controllers/user.controller.js';

import { verifyJWT } from "../middlewares/auth.middleware.js";

import { upload } from "../middlewares/multer.middleware.js";


const router = Router();

router.route('/register').post(
    upload.fields([
        {
            name: 'coverImage',
            maxCount: 1
        },
        {
            name: 'avatar',
            maxCount: 1
        },

    ]),
    registerUser
);



router.route('/login').post(loginUser);


// secured routes
router.route('/logout').post(verifyJWT, logoutUser);

// refresh token route
router.route('/refresh-token').post(verifyJWT, refreshAccessToken);

// change password route
router.route('/change-password').put(verifyJWT, changePassword);

// get loggedin user
router.route('/get-user').get(verifyJWT, getCurrentUser);

// update account details
router.route('/update-user').put(verifyJWT, updateAccountDetails);


// update avatar
router.route('/update-avatar').put(verifyJWT, upload.fields([{name: 'avatar', maxCount: 1}]), updateUserAvatar);


// update cover image
router.route('/update-cover').put(verifyJWT, upload.fields([{name: 'coverImage', maxCount: 1}]),  updateUserCoverImage);




export default router;
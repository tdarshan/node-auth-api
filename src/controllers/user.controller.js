import { asyncHandler } from '../utils/asyncHandler.js'

import { ApiError } from '../utils/ApiError.js'

import { User } from '../models/user.model.js';

import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

import jwt from "jsonwebtoken";



const generateAccessRefreshToken = async function (userId) {
    try {

        const user = await User.findById(userId);

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {

        throw new ApiError(500, "Something went wrong while generating tokens");

    }
}



const registerUser = asyncHandler(async (req, res) => {


    const { fullName, email, username, password } = req.body;


    if (
        [fullName, email, username, password].some((field) => field == "")
    ) {
        throw new ApiError(400, "All fields are required!");
    }


    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with email/username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }


    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar image is required");
    }


    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    });


    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }


    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )


});

const loginUser = asyncHandler(async (req, res) => {

    // request body
    // username or email
    // find user
    // check password
    // access and refresh token
    // send cookies

    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or Email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exists");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect password");
    }


    const { accessToken, refreshToken } = await generateAccessRefreshToken(user._id);


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");


    const options = {
        httpOnly: true,
        secure: true
    };


    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out!")
        );

});

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorised request");
    }


    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );


        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }


        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }


        const options = {
            httpOnly: true,
            secure: true
        };

        const { accessToken, refreshToken } = await generateAccessRefreshToken(user._id);


        return res.status(200)
            .cookie("accessToken", accessToken)
            .cookie("refreshToken", refreshToken)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: refreshToken,
                    },
                    "Access token refreshed"
                )
            );

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }


});

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!oldPassword || !newPassword) {
        throw new ApiError(400, "Old and New Password fields are required");
    }

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully"
            )
        );
});

const getCurrentUser = asyncHandler(async (req, res) => {

    return res.status(200)
        .json(
            new ApiResponse(200, req.user, "Current User fetched successfully")
        );
});

const updateAccountDetails = asyncHandler(async (req, res) => {

    try {

        const { fullName } = req.body;

        if (!fullName) {
            throw new ApiError(400, "All fields are required");
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    fullName,
                }
            },
            { new: true }
        ).select("-password -refreshToken");


        return res.status(200)
            .json(
                new ApiResponse(
                    200,
                    user,
                    "Account details updated successfully"
                )
            )

    } catch (error) {
        throw new ApiError(400, error.message || "Something went wrong while updating profile!");
    }

});

const updateUserAvatar = asyncHandler(async (req, res) => {

    // const avatarLocalPath = req.files[0]?.path;
    const avatarLocalPath = req.files.avatar[0].path;

    // console.log(req.files.avatar[0].path);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing!");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    return res.status(200)
            .json(
                new ApiResponse(
                    200,
                    user,
                    "Avatar image updated successfully!"
                )
            );

});

const updateUserCoverImage = asyncHandler(async (req, res) => {

    // const coverLocalPath = req.file?.path;
    const coverLocalPath = req.files.coverImage[0].path;

    console.log(coverLocalPath);

    if(!coverLocalPath) {
        throw new ApiError(400, "Cover image is missing");
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath);

    if(!coverImage.url) {
        throw new ApiError(400, "Error while uploading image!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");


    return res.status(200)
            .json(
                new ApiResponse(
                    200,
                    user,
                    "Cover image updated successfully!"
                )
            )
});


export { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getCurrentUser };
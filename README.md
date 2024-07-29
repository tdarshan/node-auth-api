NodeJS, ExpressJS, MongoDB Login - Auth API

Live URL : 


Summary: A JWT (JSON Web Token) based authentication API to use as authentication
for any frontend.
Technology : JavaScript, NodeJS, ExpressJS, MongoDB (Mongoose), JWT
Team Size : 1
Role : Developed independently
Features:
    ● Bcrypt based hashing for password
    ● Access and Refresh token using JWT.
    ● Multer file upload


Routes : 

Register User 
    POST : '/users/register'
    payload : {fullName, email, password, username, avatar(file), coverImage(file)}
    response : {statusCode, data: User, message, success}

Login 
    POST : '/users/login'
    payload: {email, password}
    response : {statusCode, data: {user, accessToken, refreshToken}, message, success}

Logout : 
    POST : '/users/logout'
    Headers : {Cookie: accessToken=ACCESS_TOKEN; refreshToken: REFRESH_TOKEN}
    response : { "statusCode": 200, "data": {}, "message": "User logged out!", "success": true}

Refresh Tokens : 
    POST : '/users/refresh-token'
    Headers : {Cookie: accessToken=ACCESS_TOKEN; refreshToken: REFRESH_TOKEN}
    response : {
                "statusCode": 200, "data": { "accessToken": ACCESS_TOKEN, "refreshToken": REFRESH_TOKEN }, 
                "message": "Access token refreshed",
                "success": true
               }


Change Password : 
    PUT : '/users/change-password'
    payload: { "oldPassword": OLD_PASSWORD, "newPassword": NEW_PASSWORD }
    response : { "statusCode": 200, "data": {}, "message": "Password changed successfully", "success": true }


Get User : 
    GET : '/users/get-user'
    response: Current user saved in request (req.user)


Update Detais : 
    PUT : '/users/update-user'
    payload : { "fullName": NEW_FULL_NAME }
    response : { "statusCode": 200, "data": UPDATED_USER, "message": "Account details updated successfully", 
                  "success": true
               }


Update avatar : 
    PUT : '/users/update-avatar'
    payload : (File : avatar)
    response : { "statusCode": 200, "data": UPDATED_USER, 
                 "message": "Avatar image updated successfully!", 
                 "success": true
               }

Update CoverImage : 
    PUT : '/users/update-cover'
    payload : {File: coverImage}
    response : {
                "statusCode": 200, "data": UPDATED_USER, "message": "Cover image updated successfully!", "success": true
               }


!!!
Every routes except Register are protected routes which requires authentication from cookies / headers 
(verifyJWT is middleware that authenticates)
!!!

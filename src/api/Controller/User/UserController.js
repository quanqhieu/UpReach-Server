const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { v4: uuidv4 } = require("uuid")

const auth = require('../../Authen/auth');
const sendMail = require('../../sendMail/sendMail')
const userService = require('../../Service/User/UserService')
const userModels = require('../User/UserController');
const clientModel = require('../../Model/MogooseSchema/clientModel');
const influModel = require('../../Model/MogooseSchema/influModel');


auth.initialize(
    passport,
    id => userModels.find(user => user.userId === id),
    email => userModels.find(user => user.userEmail === email),
    password => userModels.find(user => user.userPassword === password),
)

function changeCheckExist() {
    userModels.checkExist = false;
    console.log('Giá trị của checkExist đã thay đổi thành:', userModels.checkExist);
}

async function register(req, res, next) {
    try {
        const otpData = sendMail.generateOTP()
        const { email, password, role, name } = req.body.Data
        const hashedPassword = await bcrypt.hash(password, 10);
        userModels.userId = uuidv4();
        userModels.userEmail = email;
        userModels.userPassword = hashedPassword;
        userModels.userRole = role;
        userModels.otpData = otpData.otp;
        userModels.checkExist = otpData.checkExist;
        existingEmail = await userService.getUserByEmail(userModels.userEmail);
        if (Object.keys(existingEmail).length > 0) {
            return res.json({ status: 'False', message: "Email đã được sử dụng" });
        } else {
            const mailOptions = {
                from: 'UpReachFpt2023@gmail.com',
                to: userModels.userEmail,
                subject: 'OTP for Registration',
                text: `Your OTP for registration is: ${userModels.otpData}`
            };
            // Set tồn tại của OTP sau 30s
            setTimeout(changeCheckExist, 600 * 1000);
            sendMail.sendMailToUser(mailOptions).then(() => {
                res.json({ otpData: userModels.otpData });
            }).catch((error) => {
                res.json({ message: error });
            });
        }
    } catch (err) {
        res.json({ status: 'False', message: "Lỗi ", err });
    }
}

async function confirmRegister(req, res, next) {
    try {
        // return res.json({ message: req.body });
        const sessionId = req.sessionID;
        const maxAge = req.session.cookie.maxAge;
        const expiry = new Date(Date.now() + maxAge);
        const { otp, email, password, role } = req.body
        // const {Data} = req.body || {} 
        // const {otp, email, password, role} = Data || {}
        // console.log(userModels.userPassword, password)
        const passwordMatch = await bcrypt.compare(password, userModels.userPassword);

        const existingEmail = await userService.getUserByEmail(email);
        if (Object.keys(existingEmail).length > 0) {
            return res.json({ status: 'False', message: "Email đã được sử dụng" });
        }
        if (!userModels.checkExist) {
            return res.json({ status: 'False', message: "OTP hết hạn" });
        }
        if (otp === userModels.otpData && email === userModels.userEmail && passwordMatch) {
            // if (role === '3') {
            //     const infoInflue = await createClientOrInflu(email, role);
            //     return res.json({
            //         status: "True",
            //         message: "Account Influencer Is Created",
            //         idInflue: infoInflue._id
            //     });
            // }
            result = await userService.insertInfoUser(userModels.userId, role, email, userModels.userPassword);
            if (result.rowsAffected) {
                passport.authenticate("local", async (err, user, info) => {
                    if (err) {
                        return res.status(500).json({ status: 'False', message: "Internal server error at confirm" });
                    }
                    if (!user) {
                        return res.status(401).json({ status: 'False', message: "Sai email hoặc sai mật khẩu" });
                    }
                    req.logIn(user, async (err) => {
                        if (err) {
                            return res.status(500).json({ status: 'False', message: "Internal server error" });
                        }
                        const result = await userService.insertSessionUser(sessionId, userModels.userId, maxAge.toString(), expiry.toString());
                        if (!result) {
                            console.log('fails add session');
                            return res.json({ status: 'False', message: 'Fails Add Session' });
                        }
                        return res.status(200).json({
                            status: 'True',
                            message: "Them session vao db thanh cong",
                            data: user,
                        });
                    });

                })(req, res, next);
            } else {
                return res.json({ status: 'False', message: "Dữ liệu Add Fail" });
            }
        } else {
            return res.json({
                status: 'False',
                message: "Sai Dữ liệu truyền vào để confirm"
            })
        }
    } catch (err) {
        console.log(err);
        return res.json({ message: "Lỗi ", err });
    }
}

async function login(req, res, next) {
    try {
        const sessionId = req.sessionID;
        const maxAge = req.session.cookie.maxAge;
        const expiry = new Date(Date.now() + maxAge);
        const email = req.body.email;

        const userSearch = await userService.getUserByEmail(email);
        console.log("User", userSearch)
        const userId = userSearch.userId;
        const roleUser = userSearch.userRole
        const existedUserId = await userService.getSessionUserById(userId);

        const infoInfluencer = await userService.getUserInfluencerByEmail(email)
        const infoClient = await userService.getUserClientByEmail(email)
        const client = await clientModel.findOne({ email })
        const influ = await influModel.findOne({ email })

        passport.authenticate("local", async (err, user, info) => {
            if (err) {
                return res.status(500).json({ message: "Error Authenticate User" });
            }
            if (!user) {
                return res.status(401).json({ message: "Sai email hoặc sai mật khẩu" });
            }
            if (existedUserId.length > 0) {
                return res.status(200).json({
                    message: "User Đã Đăng Nhập ",
                    data: {
                        "Admin": user.roleId === '1' ? user : null,
                        "User": user.roleId === '1' ? userSearch : user.roleId === '3' ? infoInfluencer : infoClient
                    },
                    // idInMogodb: user.roleId === '3' ? influ._id : client._id
                    idInMogodb: user.roleId === '3' ? influ._id : (user.roleId === '1' ? null : client._id)
                });
            }

            req.logIn(user, async (err) => {
                if (err) {
                    return res.status(500).json({ message: "Internal server error at Login" });
                }
                const result = await userService.insertSessionUser(sessionId, userId, maxAge.toString(), expiry.toString());
                if (!result) {
                    return res.json({ message: 'Fails Add Session' });
                }
                const infoInfluencer = await userService.getUserInfluencerByEmail(email)
                const infoClient = await userService.getUserInfluencerByEmail(email)
                return res.status(200).json({
                    message: "Login Success !",
                    data: {
                        "Admin": user.roleId === '1' ? user : null,
                        "User": user.roleId === '1' ? userSearch : user.roleId === '3' ? infoInfluencer : infoClient
                    },
                    // idInMogodb: user.roleId === '3' ? influ._id : client._id
                    idInMogodb: user.roleId === '3' ? influ._id : (user.roleId === '1' ? null : client._id)
                });
            });
        })(req, res, next);
    } catch (err) {
        res.json({ message: err });
    }
}

async function logout(req, res, next) {
    try {
        const email = req.body.email;
        const user = await userService.getUserByEmail(email);
        const userId = user.userId;
        const result = await userService.deleteSessionUserById(userId);
        if (result.rowsAffected > 0) {
            req.logout(() => {
                return res.json({ message: "Đăng Xuất Thành Công " });
            })
        } else if (result.rowsAffected === 0) {
            return res.json({ message: 'User đang không đăng nhập' });
        } else {
            return res.json({ message: 'Fails Delete Session' });
        }
    } catch (err) {
        return res.json({ message: ' ' + err });
    }
}

async function forgotPassword(req, res, next) {
    try {
        // return res.json({data : req.body})
        const otpData = sendMail.generateOTP()
        const { email } = req.body
        userModels.emailUser = email
        userModels.otpData = otpData.otp;
        userModels.checkExist = otpData.checkExist;
        existingEmail = await userService.getUserByEmail(email);
        if (Object.keys(existingEmail).length <= 0) {
            return res.json({ status: 'False', message: "Email Not Exist" });
        } else {
            const mailOptions = {
                from: 'UpReachFpt2023@gmail.com',
                to: email,
                subject: 'OTP for Registration',
                text: `Your OTP for registration is: ${userModels.otpData}`
            };
            // Set tồn tại của OTP sau 30s
            setTimeout(changeCheckExist, 600 * 1000);
            sendMail.sendMailToUser(mailOptions).then(() => {
                res.json({status: 'True', otpData: userModels.otpData });
            }).catch((error) => {
                res.json({status: 'False', message: error });
            });
        }
    } catch (err) {
        res.json({ status: 'False', message: "Lỗi ", err });
    }
}

async function confirmForgotPassword(req, res, next) {
    try {
        // return res.json({data : req.body})
        const { otp } = req.body
        if(!otp){
            return res.json({ status: 'False', message: "Input OTP" });
        }
        if (!userModels.checkExist) {
            return res.json({ status: 'False', message: "OTP Is Expired" });
        }
        if (otp === userModels.otpData){
            return res.json({ status: 'True', message: "OTP Is Match !" });
        }
        return res.json({ status: 'False', message: "OTP Is Not Match !" });
    }
    catch (err) {
        return res.json({ message: ' ' + err });
    }
}
async function changePassword(req,res,next){
    try {
    // return res.json({data : req.body, email : userModels.emailUser})
      const {  newPassword } = req.body;
      email = userModels.emailUser;
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const response = await userService.updatePasswordUser(email,hashedPassword)
      if(response.rowsAffected[0]){
        return res.json({ status : "True", message : "Update Success !!! "})
      }
      return res.json({ status : "False", message : "Update Fails !!! "})
    } catch (error) {
      console.log(error);
      return res.json({ message: " " + error });
    }
  }

// async function createClientOrInflu(email, roleId) {
//     try {
//         if (roleId === '2') {
//             const client = await clientModel.create({
//                 email: email
//             });
//             return client
//         }
//         if (roleId === '3') {
//             const influ = await influModel.create({
//                 email: email
//             });
//             return influ
//         }
//     }
//     catch (err) {
//         return res.json({ message: ' ' + err });
//     }
// }

async function createClient(req, res, next) {
    try {
        const { username, email } = req.body;
        const usernameCheck = await clientModel.findOne({ username })
        const emailCheck = await clientModel.findOne({ email })
        if (usernameCheck) {
            return res.json({ msg: "Nick name already used", status: false });
        }
        if (emailCheck) {
            return res.json({ msg: "Email already used", status: false });
        }
        const client = await clientModel.create({
            email: email,
            username: username
        });
        return res.json({ status: true, data: client })
    }
    catch (err) {
        return res.json({ message: ' ' + err });
    }
}



// module.exports = router;
module.exports = { login, register, confirmRegister, logout, createClient, confirmForgotPassword, forgotPassword ,changePassword}


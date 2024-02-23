const nodemailer = require('nodemailer');
const { authenticator } = require('otplib');
// Tạo một transporter để gửi email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
    user: 'upreach07@gmail.com', // Địa chỉ email của bạn
    pass: 'immklawziavhtopu' // Mật khẩu email của bạn
    }
});
// Gửi email
function sendMailToUser(mailOptions) {
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error:', error);
                reject(error);
            } else {
                console.log('Email sent:', info.response);
                resolve(info);
            }
        });
    });
}

function generateOTP() {
    // Tạo mã OTP
    const secret = authenticator.generateSecret();
    const otp = authenticator.generate(secret);
    var checkExist = true;
    // In ra mã OTP
    console.log('Mã OTP:', otp);
  
    const startTime = Date.now();
    // Tạo interval để in ra thời gian còn lại của mã OTP sau mỗi giây
    const interval = setInterval(() => {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - startTime) / 1000;
        const remainingTime = 600 - elapsedTime;
        
        if (remainingTime > 0) {
        //   console.log(`Còn lại ${Math.floor(remainingTime)} giây để mã OTP hết hạn`);
        } else {
          clearInterval(interval);
        }
      }, 1000);

    return {otp,checkExist}
}

module.exports = {sendMailToUser,generateOTP}

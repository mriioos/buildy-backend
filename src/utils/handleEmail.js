const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const OAuth2 = google.auth.OAuth2;

const { GMAIL_USER, GMAIL_CLIENT, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, REDIRECT_URI } = process.env;
const oauth2Client = new OAuth2(
    GMAIL_CLIENT,
    GMAIL_CLIENT_SECRET,
    REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: GMAIL_REFRESH_TOKEN
});

const sendEmail = async (emailOptions) => {
    try {
        const accessToken = await oauth2Client.getAccessToken();
        const transporter = nodemailer.createTransport({
            service : 'gmail',
            auth : {
                type : 'OAuth2',
                user : GMAIL_USER,
                clientId : GMAIL_CLIENT,
                clientSecret : GMAIL_CLIENT_SECRET,
                refreshToken : GMAIL_REFRESH_TOKEN,
                accessToken : accessToken.token
            }
        });
        return await transporter.sendMail(emailOptions);
    } 
    catch (error) {
        console.log('Error sending email:', error);
        throw error;
    }
};

module.exports = { sendEmail };
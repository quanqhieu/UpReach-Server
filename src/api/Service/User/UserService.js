const sql = require('mssql');

const config = require('../../Config/dbConfig');
const common = require('../../../../common/common')
const pool = new sql.ConnectionPool(config);


// Lất tất cả thông tin user
async function getAll() {
    const getUsers = "getAllUser";
    pool.connect().then(() => {
        const request = pool.request();
        request.execute(getUsers).then((result) => {
            return result.recordset;
        }).catch((err) => {
            console.log('Lỗi thực thi stored procedure:', err);
            pool.close();
        })
    }).catch((err) => {
        console.log('Lỗi kết nối:', err);
    });
}
// Lấy tất cả thông tin người dùng bằng ID
async function getUserById(id) {
    try {
        const searchUserById = "getInfoUserById";
        const connection = await pool.connect();
        const request = connection.request();
        request.input('EmailId', sql.NVarChar, id);
        const result = await request.execute(searchUserById);
        const data = common.formatResponseUserToObject(result.recordset)
        connection.close();
        return data;
    } catch (err) {
        console.log('Lỗi thực thi getInfoUserById:', err);
        throw err;
    }
}
// Lấy tất cả thông tin người dùng bằng Email
async function getUserByEmail(email) {
    try {
        const searchUserByEmail = "getInfoUserByEmail";
        const connection = await pool.connect();
        const request = connection.request();
        request.input('EmailUser', sql.NVarChar, email);
        const result = await request.execute(searchUserByEmail);
        const data = common.formatResponseUserToObject(result.recordset)
        connection.close();
        return data;
    } catch (err) {
        console.log('Lỗi thực thi getInfoUserByEmail:', err);
        throw err;
    }
}
// Lấy tất cả thông tin Influencer bằng Email
async function getUserInfluencerByEmail(email) {
    try {
        const getUserInfluencerByEmail = "getInfoUserInfluencerByEmail";
        const connection = await pool.connect();
        const request = connection.request();
        request.input('EmailUser', sql.NVarChar, email);
        const result = await request.execute(getUserInfluencerByEmail);
        const data = common.formatResponseUserToObject(result.recordset)
        connection.close();
        return data;
    } catch (err) {
        console.log('Lỗi thực thi getUserInfluencerByEmail:', err);
        throw err;
    }
}
// Lấy tất cả thông tin Client bằng Email
async function getUserClientByEmail(email) {
    try {
        const getUserClientByEmail = "getInfoUserClientByEmail";
        const connection = await pool.connect();
        const request = connection.request();
        request.input('EmailUser', sql.NVarChar, email);
        const result = await request.execute(getUserClientByEmail);
        const data = common.formatResponseUserToObject(result.recordset)
        connection.close();
        return data;
    } catch (err) {
        console.log('Lỗi thực thi getUserClientByEmail:', err);
        throw err;
    }
}

async function getDataForUser(email) {
    try {
        const getDataForUser = "getDataForUser";
        const connection = await pool.connect();
        const request = connection.request();
        request.input('emailUser', sql.NVarChar, email);
        const result = await request.execute(getDataForUser);
        const data = common.formatResponseClientToArray(result.recordset)
        connection.close();
        return data;
    } catch (err) {
        console.log('Lỗi thực thi getDataForUser:', err);
        throw err;
    }
}

async function updatePasswordUser(email,password){
    try {
        const updatePasswordUser = "updatePassword";
        const connection = await pool.connect();
        const request = connection.request();
        request.input('emailUser', sql.NVarChar, email);
        request.input('newPassword', sql.NVarChar, password);
        const result = await request.execute(updatePasswordUser);
        connection.close();
        return result;
    } catch (error) {
        console.log('Lỗi thực thi updatePasswordUser:', err);
        throw error;
    }
}

async function insertInfoUser(id, role, email, password) {

    try {
        const connection = await pool.connect();
        const insertQuery = "InsertInfoUser";
        const request = connection.request();
        request.input('UserId', sql.NVarChar, id);
        request.input('UserRole', sql.NVarChar, role);
        request.input('UserEmail', sql.NVarChar, email);
        request.input('UserPassword', sql.NVarChar, password);
        const result = await request.execute(insertQuery);
        connection.close();
        return result;
    } catch (err) {
        console.log('Lỗi thực thi InsertInfoUser:', err);
        throw err;
    }
}

async function insertSessionUser(sessionId, userID, maxAge, expired) {
    try {
        const insertSession = "insertSessionQuery";
        const connection = await pool.connect();
        const request = connection.request();
        request.input('sessionId', sql.NVarChar, sessionId);
        request.input('userID', sql.NVarChar, userID);
        request.input('duration', sql.NVarChar, maxAge);
        request.input('expired', sql.NVarChar, expired);

        const result = await request.execute(insertSession);
        console.log('Đã Thêm thành công session')
        connection.close();
        return true;
    } catch (err) {
        console.log('Lỗi thực thi insertSessionQuery:', err);
        return false;
    }
}

async function deleteSessionUser(sessionId) {
    try {
        const deleteSessionUser = "deleteSessionUserBySessionId"
        const connection = await pool.connect();
        const request = connection.request();
        request.input('sessionId', sql.NVarChar, sessionId);

        const result = await request.execute(deleteSessionUser);
        connection.close();
        return result;

    } catch (err) {
        console.log('Lỗi thực thi deleteSessionUserBySessionId:', err);
        throw err;
    }

}

async function deleteSessionUserById(userId) {
    try {
        const deleteSessionUser = "deleteSessionUserById"
        const connection = await pool.connect();
        const request = connection.request();
        request.input('userID', sql.NVarChar, userId);
        const result = await request.execute(deleteSessionUser);
        connection.close();
        return result;
    } catch (err) {
        console.log('Lỗi thực thi deleteSessionUserById:', err);
        throw err;
    }
}

async function getSessionUserById(userId) {
    try {
        const getSessionUser = "getSessionUserId"
        const connection = await pool.connect();
        const request = connection.request();
        request.input('userID', sql.NVarChar, userId);

        const result = await request.execute(getSessionUser);
        const data = result.recordset;
        connection.close();
        return data;
    } catch (err) {
        console.log('Lỗi thực thi getSessionUserId:', err);
        throw err;
    }
}



module.exports = { updatePasswordUser, getAll, getUserById, getUserByEmail, getUserInfluencerByEmail, getUserClientByEmail, getDataForUser, getSessionUserById, insertInfoUser, insertSessionUser, deleteSessionUser, deleteSessionUserById };

//config for database
const config = {
    user: 'sa',
    password: 'a123456',
    server: '26.208.54.35',
    database: 'UpReachDB',
    options: {
        encrypt: false,
        trustedconnection: true,
        enableArithAort: true,
        trustServerCertificate: true,
        instancename: 'SQLEXPRESS'
    },
    port: 1433,
    pool: {
        "max": 10,
        "min": 0,
        "idleTimeoutMillis": 30000
    },
    requestTimeout: 600000
}

module.exports = config


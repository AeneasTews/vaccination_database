const sqlite3 = require('sqlite3').verbose();
const logger = require("./logger");

function connect(file_location) {
    let db =  new sqlite3.Database(file_location, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            logger.error(err);
        }

        logger.info(`Connecting to database ${file_location}`);
    });

    db.serialize();

    return db;
}

// function which closes the connection to the database
function close(database) {
    database.close((err) => {
        if (err) {
            logger.error(err);
        }

        logger.info(`Closing the connection to database ${database}`);
    });
}

// search for the data of a specific user
async function search_user(database, hash) {
    return new Promise((resolve, reject) => {
        database.get(`select * from impf_daten where hash='${hash}'`, (err, row) => {
            if (err) {
                reject(err);
            }

            resolve(row);
        });
    });
}

// check if a given hash is contained within the admin table of the database and return its permissions
async function get_permissions(database, hash) {
    return new Promise((resolve, reject) => {
        database.get(`select permissions from admins where hash='${hash}'`, (err, row) => {
            if (err) {
                reject(err);
            }

            resolve(row);
        });
    });
}

// create a new user without any data
async function create_user(impf_database, admin_database, new_hash) {
    return new Promise((resolve, reject) => {
        impf_database.run(`insert into impf_daten(hash) values('${new_hash}')`, (err) => {
            if (err) {
                reject(err);
            }

            logger.info(`Inserted ${new_hash} into ${impf_database} with rowid: ${this.lastID}`);
            resolve("success");
        });
    });
}

// function which allows the addition of values to specific columns in table
async function write_data(database, hash, column, value) {
    return new Promise((resolve, reject) => {
        database.run(`update impf_daten set '${column}'='${value}' where hash='${hash}'`, (err) => {
            if (err) {
                reject(err);
            }

            logger.info(`Updated ${column} to ${value} for ${hash} with rowid: ${this.lastID}`);
            resolve("success");
        });
    });
}

async function get_vaccines(database) {
    return new Promise((resolve, reject) => {
        database.all("pragma table_info(impf_daten)", (err, rows) => {
            if (err) {
                reject(err);
            }

            const columns = rows.map(row => row.name).filter(row_name => row_name !== "hash");
            resolve(columns);
        });
    });
}

function filter_sql(string) {
    return /^[a-z0-9]+$/.test(string);
}

module.exports = { filter_sql, search_user, close, connect, create_user, get_permissions, write_data, get_vaccines};
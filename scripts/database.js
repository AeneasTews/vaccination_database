const sqlite3 = require('sqlite3').verbose();

// TODO: implement sql query filtering in order to prevent sql-injection

function connect(file_location) {
    let db =  new sqlite3.Database(file_location, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error(err);
        }

        console.log(`Connecting to database ${file_location}`);
    });

    db.serialize();

    return db;
}

// function which closes the connection to the database
function close(database) {
    database.close((err) => {
        if (err) {
            console.error(err);
        }

        console.log(`Closing the connection to database ${database}`);
    });
}

// execute any query TODO: remove this for security reasons
async function search(database, query) {
    return new Promise((resolve, reject) => {
        database.all(query, (err, rows) => {
            if (err) {
                reject(err);
            }

            resolve(rows);
        });
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

// create a new user without any data TODO: check if a user already exists, if so, then do not permit changes
async function create_user(impf_database, admin_database, new_hash, admin_hash) {
    return new Promise((resolve, reject) => {
        impf_database.run(`insert into impf_daten(hash) values('${new_hash}')`, (err, row) => {
            if (err) {
                reject(err);
            }

            resolve(row);
        });
    });
}

// function which allows the addition of values to specific columns in table
async function write_data(database, hash, column, value) {
    return new Promise((resolve, reject) => {
        database.run(`update impf_daten set '${column}'='${value}' where hash='${hash}'`, (err, row) => {
            if (err) {
                reject(err);
            }

            resolve(row);
        });
    });
}

module.exports = { search, search_user, close, connect, create_user, get_permissions};
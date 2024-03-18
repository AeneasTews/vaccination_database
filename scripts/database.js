const sqlite3 = require('sqlite3').verbose();

// connect to the database
let file_location = "./datenbank.db"

function connect() {
    let db =  new sqlite3.Database(file_location, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error(err);
        }

        console.log("Connecting to database");
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

        console.log("Closing the database connection");
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

async function search_user(database, hash) {
    return new Promise((resolve, reject) => {
        database.get(`select * from impf_daten where hash=${hash}`, (err, row) => {
            if (err) {
                reject(err);
            }

            resolve(row);
        });
    });
}

module.exports = { search, search_user, close, connect, file_location };
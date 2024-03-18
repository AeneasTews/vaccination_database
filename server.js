const express = require("express");
const { search, search_user, close, connect, file_location } = require("./scripts/database.js");

// setup
const app = express();

app.use(express.json());

let db = connect(file_location);

let port = 3000;

// endpoints

app.get("/", (req, res) => {
    res.sendFile("./src/index.html", {root: __dirname});
});

app.get("/script.js", (req, res) => {
    res.sendFile("./src/script.js", {root: __dirname});
});

app.get("/rows", async (req, res) => {
    res.json(await search(db, "select hash, fsme from impf_daten"));
});

app.post("/user", async (req, res) => {
    let hash = JSON.stringify(req.body.hash);
    res.json(await search_user(db, hash));
});

// graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received.');

    close(db);
    console.log("Closed database connection.");

    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received.');

    close(db);
    console.log("Closed database connection.");

    process.exit(0);
});

// start the server
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
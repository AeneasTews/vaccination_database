const express = require("express");
const { search, search_user, close, connect, create_user, get_permissions } = require("./scripts/database.js");

// setup
const app = express();

app.use(express.json());

let port = 3000;

const impf_db = connect("./datenbank.db");
const admin_db = connect("./admin.db");

const favicon_path = "./src/assets/Bundeswehr_Kreuz.svg.png";

// website TODO: log all requests and additional information
app.get("/", (req, res) => {
    res.sendFile("./src/index.html", {root: __dirname});
});

app.get("/script.js", (req, res) => {
    res.sendFile("./src/script.js", {root: __dirname});
});

app.get("/favicon.ico", (req, res) => {
    res.sendFile(favicon_path, {root: __dirname});
});

app.get("/style.css", (req, res) => {
    res.setHeader("Content-Type", "text/css");
    res.sendFile("./src/style.css", {root: __dirname});
});

// endpoints
app.get("/rows", async (req, res) => {
    res.json(await search(impf_db, "select hash, fsme from impf_daten"));
});

app.post("/user", async (req, res) => {
    const req_data = req.body;

    res.json(await search_user(impf_db, req_data.hash));
});

app.post("/create_user", async (req, res) => {
    const req_data = req.body;

    if (await get_permissions(admin_db, req_data.admin_hash)) {
        console.log(`Creating user ${req_data.admin_hash} using admin ${req_data.admin_hash}`);
        res.json(await create_user(impf_db, admin_db, req_data.user_hash, req_data.admin_hash));
    } else {
        res.status(403);
        res.sendFile("./src/403.html", {root: __dirname});
    }
});

// graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received.');

    close(impf_db);
    close(admin_db);
    console.log("Closed database connection.");

    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received.');

    close(impf_db);
    close(admin_db);
    console.log("Closed database connection.");

    process.exit(0);
});

// start the server
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
    console.log(`Favicon path: ${favicon_path}`);
});
const express = require("express");
const { filter_sql, search_user, close, connect, create_user, get_permissions, write_data, get_vaccines } = require("./scripts/database.js");
const logger = require("./scripts/logger");

// setup
const app = express();

app.use(express.json());

let port = 3000;

const impf_db = connect("./datenbank.db");
const admin_db = connect("./admin.db");

const favicon_path = "./src/assets/Bundeswehr_Kreuz.svg.png";

let vaccines;

// website TODO: log to a file
app.get("/", (req, res) => {
    logger.info({"ip": req.ip}, `${req.ip} requested /`);
    res.sendFile("./src/index.html", {root: __dirname});
});

app.get("/script.js", (req, res) => {
    logger.info({"ip": req.ip}, `${req.ip} requested /script.js`);
    res.sendFile("./src/script.js", {root: __dirname});
});

app.get("/favicon.ico", (req, res) => {
    logger.info({"ip": req.ip}, `${req.ip} requested /favicon.ico`);
    res.sendFile(favicon_path, {root: __dirname});
});

app.get("/style.css", (req, res) => {
    logger.info({"ip": req.ip}, `${req.ip} requested /style.css`);
    res.setHeader("Content-Type", "text/css");
    res.sendFile("./src/style.css", {root: __dirname});
});

// endpoints
app.post("/user", async (req, res) => {
    const req_data = req.body;

    if (!filter_sql(req_data.hash)){
        res.json({
            "status": "invalid query",
        });
        logger.error({"req_data": req_data}, `${req.ip} posted to /user and failed sql check`);
        return;
    }

    logger.info({"req_data": req_data}, `${req.ip} posted to /user without any issues`);
    res.json(await search_user(impf_db, req_data.hash));
});

app.post("/create_user", async (req, res) => {
    const req_data = req.body;

    if (!filter_sql(req_data.admin_hash) || !filter_sql(req_data.user_hash)) {
        res.json({
            "status": "invalid query",
        });
        logger.error({"req_data": req_data}, `${req.ip} posted to /create_user and failed sql check`);
        return;
    }

    if (!await get_permissions(admin_db, req_data.admin_hash)) {
        res.json({
            "status": "invalid_admin_password",
        });
        logger.error({"req_data": req_data}, `${req.ip} posted to /create_user and failed admin password check`);
        return;
    }

    if(!await search_user(impf_db, req_data.hash)) {
        res.json({
            "status": "user_already_exists",
        });
        logger.error({"req_data": req_data}, `${req.ip} posted to /create_user but user already exists`);
        return;
    }

    logger.info({"req_data": req_data}, `${req.ip} posted to /create_user`);
    const result = await create_user(impf_db, admin_db, req_data.user_hash, req_data.admin_hash);
    if (result === "success") {
        logger.info(`${req.ip} created user ${req_data.user_hash} using admin ${req_data.admin_hash}`);
        res.json({
            "status": "success",
        });
    }
});

app.post("/write_data", async (req, res) => {
    const req_data = req.body;

    if(!filter_sql(req_data.admin_hash) || !filter_sql(req_data.vaccine) || !filter_sql(req_data.date) || !filter_sql(req_data.user_hash)) {
        res.json({
            "status": "invalid query",
        });
        logger.error({"req_data": req_data}, `${req.ip} posted to /write_data and failed sql check`);
        return;
    }

    if (!await get_permissions(admin_db, req_data.admin_hash)) {
        logger.error(`${req.ip} tried changing: ${req_data.vaccine} to ${req_data.date} for ${req_data.user_hash}; failed due to invalid admin_hash: ${req_data.admin_hash}`)
        res.json({
            "status": "invalid_admin_password",
        });
        logger.error({"req_data": req_data}, `${req.ip} posted to /write_data and failed admin password check`);
        return;
    }

    logger.info({"req_data": req_data}, `${req.ip} posted to /write_data`);
    const result = await write_data(impf_db, req_data.user_hash, req_data.vaccine, req_data.date);
    if (result === "success") {
        logger.info(`${req.ip} changed: ${req_data.vaccine} to ${req_data.date} for ${req_data.user_hash}`);
        res.json({
            "status": "success",
        });
    }
});

app.get("/vaccines", async (req, res) => {
    logger.info(`${req.ip} requested /vaccines`);
    res.json(vaccines);
});

// graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received.');

    close(impf_db);
    close(admin_db);
    logger.info("Closed database connection.");

    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received.');

    close(impf_db);
    close(admin_db);
    logger.info("Closed database connection.");

    process.exit(0);
});

// start the server
app.listen(port, async () => {
    logger.info(`Server started on port ${port}`);
    logger.info(`Favicon path: ${favicon_path}`);

    const data = await get_vaccines(impf_db);
    vaccines = {
        "vaccines": data,
    };
});
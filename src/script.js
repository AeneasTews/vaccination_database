const url = window.location.href;

async function sha_256(string) {
    const utf8 = new TextEncoder().encode(string);
    return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        // convert to hex
        return hashArray
            .map((bytes) => bytes.toString(16).padStart(2, '0'))
            .join('');
    });
}

async function hash_data(id_list) {
    let hash_string = "";

    id_list.forEach((id) => {
        hash_string += document.getElementById(id).value;
    });

    return await sha_256(hash_string);
}

function create_table(json) {
    // get references to the vaccination table
    const impf_table = document.getElementById("impf_table");

    // clean up old table data
    impf_table.innerHTML = "";

    // create a new table
    const impf_row = document.createElement("tr");
    const impf_time = document.createElement("tr");
    impf_table.append(impf_row, impf_time);

    // append the headers and vaccination times for the key to the row
    const keys = Object.keys(json);
    keys.forEach((key) => {
        if (key !== "hash") {
            let header = document.createElement("th");
            let text = document.createTextNode(key);
            header.appendChild(text);
            impf_row.appendChild(header);

            let data = document.createElement("td");
            text = new Date(parseInt(json[key]));
            text = document.createTextNode(`${text.toLocaleDateString("de-de", { year:"numeric", month:"short", day:"numeric" })}`);
            data.appendChild(text);
            impf_time.appendChild(data);
        }
    });
}

async function get_user(hash) {
    const req = new Request(`${url}user`);

    const req_data = JSON.stringify({
        "hash": hash,
    });

    const res = await fetch(req, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: req_data,
    });

    const res_data = await res.json();

    create_table(res_data);
}

function confirm_password_creation(pwd_id_1, pwd_id_2) {
    const pwd1 = document.getElementById(pwd_id_1).value;
    const pwd2 = document.getElementById(pwd_id_2).value;

    return pwd1 === pwd2;
}

async function send_creation_request(user_hash, admin_hash) {
    const req = new Request(`${url}create_user`);

    const req_data = JSON.stringify({
        "admin_hash": admin_hash,
        "user_hash": user_hash,
    });

    return await fetch(req, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: req_data,
    });
}

async function create_user() {
    // check if password is identical
    if (!confirm_password_creation("pwd_create", "pwd_create_confirm")) {
        alert("Passwoerter sind nicht identisch!");
        return -1;
    }

    // hash data required for request
    const user_hash = await hash_data(["uname_create", "pwd_create"]);
    const admin_hash = await hash_data(["pwd_admin"])

    // send and handle request
    const res = await send_creation_request(user_hash, admin_hash);
    const res_data = await res.json();

    if (res_data.status === "success") {
        await get_user(user_hash);
    } else if (res_data.status === "invalid_admin_password") {
        alert("Ungueltiges Arzt Passwort");
    } else if (res_data.status === "user_already_exists") {
        alert("Nutzer existiert bereits");
    }
}

function set_current_date() {
    const current_date = new Date();
    const month_list = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    const date_string = `${current_date.getFullYear()}-${month_list[current_date.getMonth()]}-${current_date.getDate()}`;

    const date_picker = document.getElementById("vaccination_date");
    date_picker.setAttribute("value", date_string);
}

async function get_vaccines() {
    const req = new Request(`${url}vaccines`);

    const res = await fetch(req, {
        method: "GET",
    });

    return res.json()
}

function create_vaccine_picker(json) {
    const select = document.getElementById("vaccine_picker");

    json.vaccines.forEach((vaccine) => {
        const option = document.createElement("option");
        option.value = vaccine;
        const text = document.createTextNode(vaccine);
        option.appendChild(text);
        select.appendChild(option);
    });
}

async function send_update_request(user_hash, admin_hash, vaccine_expiry_date, vaccine) {
    const req = new Request(`${url}write_data`);

    const req_data = JSON.stringify({
        "user_hash": user_hash,
        "admin_hash": admin_hash,
        "date": vaccine_expiry_date,
        "vaccine": vaccine,
    });

    return await fetch(req, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: req_data,
    });
}

async function update_vaccine()  {
    // get authorization info
    const user_hash = await hash_data(["uname_write_data", "pwd_write_data"]);
    const admin_hash = await hash_data(["pwd_write_admin"]);

    // get vaccination info
    const vaccine = document.getElementById("vaccine_picker").value;
    const expiry_date = document.getElementById("vaccination_date").value;
    const expiry_time = Date.parse(expiry_date);


    const res = await send_update_request(user_hash, admin_hash, expiry_time, vaccine);
    const res_data = await res.json();

    if (res_data.status === "success") {
        await get_user(user_hash);
    } else if (res_data.status === "invalid_admin_password") {
        alert("Ungueltiges Arzt Passwort");
    }
}

async function setup() {
    set_current_date();
    create_vaccine_picker(await get_vaccines());

    const get_button = document.getElementById("get_button");
    get_button.addEventListener("click", async () => {
        await get_user(await hash_data(["uname_get", "pwd_get"]));
    });

    const create_button = document.getElementById("create_button");
    create_button.addEventListener("click", async () => {
        await create_user();
    });

    const change_button = document.getElementById("write_data_button");
    change_button.addEventListener("click", async () => {
        await update_vaccine();
    });
}

setup();
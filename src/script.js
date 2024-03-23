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

async function hash_user(user_id, pwd_id) {
    const uname = document.getElementById(user_id).value;
    const pwd = document.getElementById(pwd_id).value;

    return await sha_256(uname + pwd);
}

async function get_user(hash) {
    const url = "http://localhost:3000/user";
    const req = new Request(url);

    const req_data = JSON.stringify({
        "hash": `${hash}`,
    });

    const res = await fetch(req, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: req_data,
    });

    const res_data = await res.json();
    console.log(res_data);

    create_table(res_data);
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

async function setup() {
    const submit_get_button = document.getElementById("submit_get");
    submit_get_button.addEventListener("click", async () => {
        await get_user(await hash_user("uname_get", "pwd_get"));
    });
}

setup();
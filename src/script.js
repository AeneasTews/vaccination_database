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
        "hash": `${hash}`
    });

    const res = await fetch(req, {
        method: "POST",
        body: req_data,
        headers: {
            "Content-Type": "application/json",
        },
    });

    const res_data = await res.json();
    console.log(res_data);
}

async function setup() {
    const submit_get_button = document.getElementById("submit_get");
    submit_get_button.addEventListener("click", async () => {
        await get_user(await hash_user("uname_get", "pwd_get"));
    });
}

setup();
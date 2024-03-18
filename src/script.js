function sha_256(string) {
    const utf8 = new TextEncoder().encode(string);
    return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        // convert to hex
        return hashArray
            .map((bytes) => bytes.toString(16).padStart(2, '0'))
            .join('');
    });
}

function hash_user() {
    const uname = document.getElementById("uname").value;
    const pwd = document.getElementById("pwd").value;

    const hash = sha_256(uname + pwd);

    console.log(`${uname}, ${pwd}, ${hash}`);
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

function setup() {
    const submit_button = document.getElementById("submit");
    submit_button.addEventListener("click", hash_user);
}

setup();
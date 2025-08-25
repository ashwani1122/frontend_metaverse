async function signup() {
    alert("Control reached here");
    const userName = document.getElementById("username").value;
    alert(userName);
    alert("control never passes");
    const password = document.getElementById("password").value;
    alert(password);
    const type = document.getElementById("type").value
    alert(type);
    const res = await fetch("http://localhost:3003/api/v1/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: userName,
            password: password,
            type: type
        })
    });
    if (!res.ok) {
        alert("Error: " + res.status);  // handle server errors
        return;
    }

    const data = await res.json();
    alert(JSON.stringify(data));
    
    window.location.href="signIn.html"
}

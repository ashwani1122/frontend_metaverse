let data;
async function spaceCreate() {
    const name = document.getElementById("name").value;
    alert("this name")
    alert(name)

    const dimension = document.getElementById("dimensions").value;
    alert("this is the dimension");
    alert(dimension);
    const mapId = document.getElementById("mapId").value;
    alert("this is mapId");
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:3003/api/v1/space", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            name: name,
            dimensions: dimension,
            mapId: mapId
        })
    });
    data = await res.json();
    console.log(data);
    alert(data.spaceId);
}

async function signup(){
    alert("controle reach here");
    const userName = document.getElementById("username").value
    const password = document.getElementById("password");    
    const type = document.getElementById("type");
    const data = await fetch("http://localhost:3003/api/v1/signup",{
        method:"post",
        body:{
            username:userName,
            password:password,
            type:type
        }
    })
    alert(data);
}
// digitalocean droplet
const API_BASE = "http://104.248.232.237";

// login button
async function handleLogin() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const loginError = document.getElementById("loginError");

  // clear old message 
  loginError.textContent = "";
  loginError.style.display = "none";

  // basic check
  if (email === "" || password === "") {
    loginError.textContent = "Please type an email and password";
    loginError.style.display = "block";
    return;
  }

  const loginInfo = {
    email: email,
    password: password
  };

  try {
    const response = await fetch(API_BASE + "/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(loginInfo)
    });

    const data = await response.json();

    if (response.ok) {
      window.location.href = "contacts.html";
    } else {
      if (data.error) {
        loginError.textContent = data.error;
      } else {
        loginError.textContent = "Login failed";
      }

      loginError.style.display = "block";
    }
  } catch (error) {
    loginError.textContent = "Could not connect to server";
    loginError.style.display = "block";
  }
}



// sign up button
async function handleRegister() {
  const firstName = document.getElementById("regFirstName").value;
  const lastName = document.getElementById("regLastName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirm").value;

  const registerError = document.getElementById("registerError");
  const registerSuccess = document.getElementById("registerSuccess");

  // clear old message
  registerError.textContent = "";
  registerError.style.display = "none";
  registerSuccess.textContent = "";
  registerSuccess.style.display = "none";


  
  // checks before sending to API
  if (
    firstName === "" ||
    lastName === "" ||
    email === "" ||
    password === "" ||
    confirmPassword === ""
  ) {
    registerError.textContent = "Please fill out all fields";
    registerError.style.display = "block";
    return;
  }

  if (password !== confirmPassword) {
    registerError.textContent = "Passwords do not match";
    registerError.style.display = "block";
    return;
  }

  const registerInfo = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
    confirmPassword: confirmPassword
  };

  try {
    const response = await fetch(API_BASE + "/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(registerInfo)
    });

    const data = await response.json();

    if (response.ok) {
      if (data.message) {
        registerSuccess.textContent = data.message;
      } else {
        registerSuccess.textContent = "Account created";
      }

      registerSuccess.style.display = "block";
    } else {
      if (data.error) {
        registerError.textContent = data.error;
      } else {
        registerError.textContent = "Register failed";
      }

      registerError.style.display = "block";
    }
  } catch (error) {
    registerError.textContent = "Could not connect to server";
    registerError.style.display = "block";
  }
}

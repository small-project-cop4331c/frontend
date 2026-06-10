// digitalocean droplet
const API_BASE = "https://stealingyourinfo.xyz";

// auth helpers
// using localStorage 


function saveAuth(user, token) {
  localStorage.setItem("token", token);
  localStorage.setItem("userId", user.id);
  localStorage.setItem("userName", user.firstName + " " + user.lastName);
  localStorage.setItem("userEmail", user.email);
}

function getToken() {
  return localStorage.getItem("token");
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
}

function isLoggedIn() {
  return !!getToken();
}


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
      if (data.user && data.token) {
        saveAuth(data.user, data.token);
      }

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

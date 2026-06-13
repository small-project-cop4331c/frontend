// API_BASE is defined in auth.js

let contactModal;
let deleteModal;
let searchTimeout = null;


// helpers 

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + getToken()
  };
}


function apiFetch(url, options) {
  return fetch(url, options).then(function(res) {
    if (res.status === 401) {
      clearAuth();
      window.location.href = "login.html";
      return Promise.reject("Unauthorized");
    }
    return res.json();
  });
}


function mapContactFromApi(c) {
  return {
    id: c.id,
    firstName: c.first_name,
    lastName: c.last_name,
    email: c.email_address,
    phone: c.phone_number
  };
}

function mapContactToApi(firstName, lastName, email, phone) {
  return {
    first_name: firstName,
    last_name: lastName,
    email_address: email,
    phone_number: phone
  };
}


//init

document.addEventListener("DOMContentLoaded", function() {
  contactModal = new bootstrap.Modal(document.getElementById("contactModal"));
  deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));

  // kick back to login if we dont have a session
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const fullName = localStorage.getItem("userName");
  if (fullName) {
    document.getElementById("navUsername").textContent = "Hello, " + fullName;
  }

  loadContacts();
});


//search

function loadContacts() {
  apiFetch(API_BASE + "/api/contacts", {
    method: "GET",
    headers: authHeaders()
  })
  .then(function(data) {
    if (data.error) {
      showPageMessage(data.error, true);
      return;
    }
    renderContacts(data.contacts.map(mapContactFromApi));
  })
  .catch(function() {
    showPageMessage("Could not connect to server", true);
  });
}


function handleSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(handleSearch, 300);
}


// runs when user clicks search, presses enter, or after debounce delay
function handleSearch() {
  const query = document.getElementById("searchInput").value.trim();

  if (query.length === 0) {
    loadContacts();
    return;
  }

  const url = API_BASE + "/api/contacts?search=" + encodeURIComponent(query);

  apiFetch(url, {
    method: "GET",
    headers: authHeaders()
  })
  .then(function(data) {
    if (data.error) {
      showPageMessage(data.error, true);
      return;
    }
    renderContacts(data.contacts.map(mapContactFromApi));
  })
  .catch(function() {
    showPageMessage("Could not connect to server", true);
  });
}


function renderContacts(contacts) {
  const tbody = document.getElementById("contactsTableBody");
  tbody.textContent = "";

  if (contacts.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.className = "text-center text-muted";
    td.textContent = "No contacts found";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  contacts.forEach(function(c) {
    const tr = document.createElement("tr");

    ["firstName", "lastName"].forEach(function(field) {
      const td = document.createElement("td");
      td.textContent = c[field];
      tr.appendChild(td);
    });

    const emailTd = document.createElement("td");
    emailTd.textContent = c.email || "";
    tr.appendChild(emailTd);

    const phoneTd = document.createElement("td");
    phoneTd.textContent = c.phone || "";
    tr.appendChild(phoneTd);

    const actionsTd = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-sm btn-outline-primary me-1";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", function() { openEditModal(c.id); });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-sm btn-outline-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", function() { openDeleteModal(c.id); });

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(deleteBtn);
    tr.appendChild(actionsTd);

    tbody.appendChild(tr);
  });
}


//add / edit modal

function openAddModal() {
  document.getElementById("contactModalLabel").textContent = "Add Contact";
  document.getElementById("modalContactId").value = "";
  document.getElementById("modalFirstName").value = "";
  document.getElementById("modalLastName").value = "";
  document.getElementById("modalEmail").value = "";
  document.getElementById("modalPhone").value = "";
  hideModalError();

  contactModal.show();
}


function openEditModal(contactId) {
  document.getElementById("contactModalLabel").textContent = "Edit Contact";
  hideModalError();

  apiFetch(API_BASE + "/api/contacts/" + contactId, {
    method: "GET",
    headers: authHeaders()
  })
  .then(function(data) {
    if (data.error) {
      showPageMessage(data.error, true);
      return;
    }
    fillContactForm(mapContactFromApi(data.contact));
    contactModal.show();
  })
  .catch(function() {
    showPageMessage("Could not connect to server", true);
  });
}


function fillContactForm(contact) {
  document.getElementById("modalContactId").value = contact.id;
  document.getElementById("modalFirstName").value = contact.firstName;
  document.getElementById("modalLastName").value = contact.lastName;
  document.getElementById("modalEmail").value = contact.email || "";
  document.getElementById("modalPhone").value = contact.phone || "";
}


function handleSaveContact() {
  const id = document.getElementById("modalContactId").value;
  const firstName = document.getElementById("modalFirstName").value.trim();
  const lastName = document.getElementById("modalLastName").value.trim();
  const email = document.getElementById("modalEmail").value.trim();
  const phone = document.getElementById("modalPhone").value.trim();

  if (firstName === "" || lastName === "" || email === "" || phone === "") {
    showModalError("Please fill in all fields");
    return;
  }

  const isEditing = id !== "";
  const url = isEditing
    ? API_BASE + "/api/contacts/" + id
    : API_BASE + "/api/contacts";
  const method = isEditing ? "PUT" : "POST";

  apiFetch(url, {
    method: method,
    headers: authHeaders(),
    body: JSON.stringify(mapContactToApi(firstName, lastName, email, phone))
  })
  .then(function(data) {
    if (data.error) {
      showModalError(data.error);
      return;
    }
    contactModal.hide();
    showPageMessage(isEditing ? "Contact updated." : "Contact added.", false);
    handleSearch();
  })
  .catch(function() {
    showModalError("Could not connect to server");
  });
}


//delete

function openDeleteModal(contactId) {
  document.getElementById("deleteContactId").value = contactId;
  deleteModal.show();
}


function confirmDelete() {
  const id = document.getElementById("deleteContactId").value;

  apiFetch(API_BASE + "/api/contacts/" + id, {
    method: "DELETE",
    headers: authHeaders()
  })
  .then(function(data) {
    if (data.error) {
      showPageMessage(data.error, true);
      return;
    }
    deleteModal.hide();
    showPageMessage("Contact deleted.", false);
    handleSearch();
  })
  .catch(function() {
    showPageMessage("Could not connect to server", true);
  });
}

//auth

function handleLogout() {
  clearAuth();
  window.location.href = "login.html";
}


//UI feedback

function showPageMessage(message, isError) {
  const el = document.getElementById("pageMessage");
  el.textContent = message;
  el.style.color = isError ? "red" : "green";
  el.style.display = "block";

  setTimeout(function() {
    el.style.display = "none";
  }, 3000);
}


function showModalError(message) {
  const el = document.getElementById("modalError");
  el.textContent = message;
  el.style.display = "block";
}


function hideModalError() {
  document.getElementById("modalError").style.display = "none";
}

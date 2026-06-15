// API_BASE is defined in auth.js

let contactModal;
let deleteModal;
let searchTimeout = null;
let currentContacts = [];
let currentSort = { field: null, direction: "asc" };


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

// (123) 456-7890 style, only for 10 digit numbers
function formatPhone(phone) {
  if (!phone) return "";

  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10) {
    return phone;
  }

  return "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6);
}

function stripPhone(phone) {
  return phone.replace(/\D/g, "");
}

function handlePhoneInput() {
  const input = document.getElementById("modalPhone");
  const digits = input.value.replace(/\D/g, "").slice(0, 10);

  let formatted = "";
  if (digits.length > 0) formatted = "(" + digits.slice(0, 3);
  if (digits.length >= 4) formatted += ") " + digits.slice(3, 6);
  if (digits.length >= 7) formatted += "-" + digits.slice(6, 10);

  input.value = formatted;
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

  document.body.style.visibility = "visible";

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
    currentContacts = data.contacts.map(mapContactFromApi);
    displayContacts();
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
    currentContacts = data.contacts.map(mapContactFromApi);
    displayContacts();
  })
  .catch(function() {
    showPageMessage("Could not connect to server", true);
  });
}


function sortContacts(field, direction) {
  currentSort.field = field;
  currentSort.direction = direction;
  displayContacts();
}

function displayContacts() {
  let contacts = currentContacts.slice();

  if (currentSort.field) {
    contacts.sort(function(a, b) {
      const valA = (a[currentSort.field] || "").toLowerCase();
      const valB = (b[currentSort.field] || "").toLowerCase();

      if (valA < valB) return currentSort.direction === "asc" ? -1 : 1;
      if (valA > valB) return currentSort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  renderContacts(contacts);
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
    phoneTd.textContent = formatPhone(c.phone);
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

function clearModalInvalid() {
  ["modalFirstName", "modalLastName", "modalEmail", "modalPhone"].forEach(function(id) {
    document.getElementById(id).classList.remove("is-invalid");
  });
}

function openAddModal() {
  document.getElementById("contactModalLabel").textContent = "Add Contact";
  document.getElementById("modalContactId").value = "";
  document.getElementById("modalFirstName").value = "";
  document.getElementById("modalLastName").value = "";
  document.getElementById("modalEmail").value = "";
  document.getElementById("modalPhone").value = "";
  hideModalError();
  clearModalInvalid();

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
    clearModalInvalid();
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
  document.getElementById("modalPhone").value = formatPhone(contact.phone);
}


function handleSaveContact() {
  const id = document.getElementById("modalContactId").value;
  const firstName = document.getElementById("modalFirstName").value.trim();
  const lastName = document.getElementById("modalLastName").value.trim();
  const email = document.getElementById("modalEmail").value.trim();
  const phone = stripPhone(document.getElementById("modalPhone").value.trim());

  const modalFields = [
    { id: "modalFirstName", val: firstName },
    { id: "modalLastName",  val: lastName },
    { id: "modalEmail",     val: email },
    { id: "modalPhone",     val: phone }
  ];
  modalFields.forEach(function(f) {
    document.getElementById(f.id).classList.remove("is-invalid");
  });

  if (firstName === "" || lastName === "" || email === "" || phone === "") {
    modalFields.forEach(function(f) {
      if (f.val === "") document.getElementById(f.id).classList.add("is-invalid");
    });
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
    body: JSON.stringify(mapContactToApi(firstName, lastName, email, stripPhone(phone)))
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
  el.className = isError ? "msg-error show" : "msg-success show";

  setTimeout(function() {
    el.className = "";
    el.textContent = "";
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

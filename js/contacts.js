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
  fetch(API_BASE + "/api/contacts", {
    method: "GET",
    headers: authHeaders()
  })
  .then(function(res) { return res.json(); })
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

  fetch(url, {
    method: "GET",
    headers: authHeaders()
  })
  .then(function(res) { return res.json(); })
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

  if (contacts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No contacts found</td></tr>';
    return;
  }

  let rows = "";
  contacts.forEach(function(c) {
    rows += "<tr>";
    rows += "<td>" + c.firstName + "</td>";
    rows += "<td>" + c.lastName + "</td>";
    rows += "<td>" + (c.email || "") + "</td>";
    rows += "<td>" + formatPhone(c.phone) + "</td>";
    rows += '<td>';
    rows += '<button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="openEditModal(' + c.id + ')">Edit</button>';
    rows += '<button type="button" class="btn btn-sm btn-outline-danger" onclick="openDeleteModal(' + c.id + ')">Delete</button>';
    rows += "</td>";
    rows += "</tr>";
  });

  tbody.innerHTML = rows;
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

  fetch(API_BASE + "/api/contacts/" + contactId, {
    method: "GET",
    headers: authHeaders()
  })
  .then(function(res) { return res.json(); })
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
  document.getElementById("modalPhone").value = formatPhone(contact.phone);
}


function handleSaveContact() {
  const id = document.getElementById("modalContactId").value;
  const firstName = document.getElementById("modalFirstName").value.trim();
  const lastName = document.getElementById("modalLastName").value.trim();
  const email = document.getElementById("modalEmail").value.trim();
  const phone = stripPhone(document.getElementById("modalPhone").value.trim());

  if (firstName === "" || lastName === "" || email === "" || phone === "") {
    showModalError("Please fill in all fields");
    return;
  }

  const isEditing = id !== "";
  const url = isEditing
    ? API_BASE + "/api/contacts/" + id
    : API_BASE + "/api/contacts";
  const method = isEditing ? "PUT" : "POST";

  fetch(url, {
    method: method,
    headers: authHeaders(),
    body: JSON.stringify(mapContactToApi(firstName, lastName, email, phone))
  })
  .then(function(res) { return res.json(); })
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

  fetch(API_BASE + "/api/contacts/" + id, {
    method: "DELETE",
    headers: authHeaders()
  })
  .then(function(res) { return res.json(); })
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

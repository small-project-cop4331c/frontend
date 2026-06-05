// digitalocean droplet 
const API_BASE = "http://stealingyourinfo.xyz";

let contactModal;
let deleteModal;

// temp fake contacts list
let allContacts = [
  { id: 1, firstName: "John", lastName: "Smith", email: "john@email.com", phone: "555-1234", dateCreated: "2025-01-10" },
  { id: 2, firstName: "Jane", lastName: "Jones", email: "jane@email.com", phone: "555-5678", dateCreated: "2025-02-14" },
  { id: 3, firstName: "Steve", lastName: "Jobs", email: "steve@email.com", phone: "555-9999", dateCreated: "2025-03-01" }
];
let nextContactId = 4;


document.addEventListener("DOMContentLoaded", function() {
  contactModal = new bootstrap.Modal(document.getElementById("contactModal"));
  deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));

  // kick back to login if we dont have a session
  if (!sessionStorage.getItem("token")) {
    window.location.href = "login.html";
    return;
  }

  const fullName = sessionStorage.getItem("userName");
  if (fullName) {
    document.getElementById("navUsername").textContent = "Hello, " + fullName;
  }
});


// search runs when user clicks Search or presses Enter
function handleSearch() {
  const query = document.getElementById("searchInput").value.trim();

  if (query.length === 0) {
    renderContacts([]);
    return;
  }

  /*
  fetch(API_BASE + "/api/searchContacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + sessionStorage.getItem("token")
    },
    body: JSON.stringify({
      userId: sessionStorage.getItem("userId"),
      search: query
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      showPageMessage(data.error, true);
      return;
    }
    renderContacts(data.contacts);
  })
  .catch(() => {
    showPageMessage("Could not connect to server", true);
  });
  */

  const results = filterContacts(query);
  renderContacts(results);
}


// case insensitive substring match on name fields
function filterContacts(query) {
  const lower = query.toLowerCase();

  return allContacts.filter(function(c) {
    return (
      c.firstName.toLowerCase().includes(lower) ||
      c.lastName.toLowerCase().includes(lower)
    );
  });
}


function renderContacts(contacts) {
  const tbody = document.getElementById("contactsTableBody");
  const query = document.getElementById("searchInput").value.trim();

  if (query.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Search for a contact above</td></tr>';
    return;
  }

  if (contacts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No contacts found</td></tr>';
    return;
  }

  let rows = "";
  contacts.forEach(function(c) {
    rows += "<tr>";
    rows += "<td>" + c.firstName + "</td>";
    rows += "<td>" + c.lastName + "</td>";
    rows += "<td>" + c.email + "</td>";
    rows += "<td>" + c.phone + "</td>";
    rows += "<td>" + c.dateCreated + "</td>";
    rows += '<td>';
    rows += '<button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="openEditModal(' + c.id + ')">Edit</button>';
    rows += '<button type="button" class="btn btn-sm btn-outline-danger" onclick="openDeleteModal(' + c.id + ')">Delete</button>';
    rows += "</td>";
    rows += "</tr>";
  });

  tbody.innerHTML = rows;
}


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

  /*
  fetch(API_BASE + "/api/getContact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + sessionStorage.getItem("token")
    },
    body: JSON.stringify({
      userId: sessionStorage.getItem("userId"),
      id: contactId
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      showPageMessage(data.error, true);
      return;
    }
    fillContactForm(data);
    contactModal.show();
  })
  .catch(() => {
    showPageMessage("Could not connect to server", true);
  });
  */

  const contact = allContacts.find(function(c) { return c.id === contactId; });
  if (!contact) {
    showPageMessage("Contact not found", true);
    return;
  }

  fillContactForm(contact);
  contactModal.show();
}


function fillContactForm(contact) {
  document.getElementById("modalContactId").value = contact.id;
  document.getElementById("modalFirstName").value = contact.firstName;
  document.getElementById("modalLastName").value = contact.lastName;
  document.getElementById("modalEmail").value = contact.email;
  document.getElementById("modalPhone").value = contact.phone;
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

  /*
  const endpoint = isEditing ? "/api/editContact" : "/api/addContact";
  fetch(API_BASE + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + sessionStorage.getItem("token")
    },
    body: JSON.stringify({
      userId: sessionStorage.getItem("userId"),
      id: id,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      showModalError(data.error);
      return;
    }
    contactModal.hide();
    showPageMessage(isEditing ? "Contact updated." : "Contact added.", false);
    handleSearch();
  })
  .catch(() => {
    showModalError("Could not connect to server");
  });
  */

  if (isEditing) {
    const contact = allContacts.find(function(c) { return c.id === parseInt(id, 10); });
    if (contact) {
      contact.firstName = firstName;
      contact.lastName = lastName;
      contact.email = email;
      contact.phone = phone;
    }
  } else {
    const today = new Date().toISOString().slice(0, 10);
    allContacts.push({
      id: nextContactId,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      dateCreated: today
    });
    nextContactId++;
  }

  contactModal.hide();
  showPageMessage(isEditing ? "Contact updated." : "Contact added.", false);
  handleSearch();
}


function openDeleteModal(contactId) {
  document.getElementById("deleteContactId").value = contactId;
  deleteModal.show();
}


function confirmDelete() {
  const id = parseInt(document.getElementById("deleteContactId").value, 10);

  /*
  fetch(API_BASE + "/api/deleteContact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + sessionStorage.getItem("token")
    },
    body: JSON.stringify({
      userId: sessionStorage.getItem("userId"),
      id: id
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      showPageMessage(data.error, true);
      return;
    }
    deleteModal.hide();
    showPageMessage("Contact deleted.", false);
    handleSearch();
  })
  .catch(() => {
    showPageMessage("Could not connect to server", true);
  });
  */

  allContacts = allContacts.filter(function(c) { return c.id !== id; });

  deleteModal.hide();
  showPageMessage("Contact deleted.", false);
  handleSearch();
}


function handleLogout() {
  sessionStorage.clear();
  window.location.href = "login.html";
}


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

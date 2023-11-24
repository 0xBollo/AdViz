"use strict"

class User {
    constructor(username, password, role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }
}

class Contact {
    constructor(owner, firstName, lastName, nickname, streetAndNumber, zip, city, country, 
        phone, email, dob, isPublic, coordinates) {
        this.owner = owner;
        this.firstName = firstName;
        this.lastName = lastName;
        this.nickname = nickname;
        this.streetAndNumber = streetAndNumber;
        this.zip = zip;
        this.city = city;
        this.country = country;
        this.phone = phone;
        this.email = email;
        this.dob = dob;
        this.isPublic = isPublic;
        this.coordinates = coordinates;
    }
}

let contacts = []; 
let map;
let markers = new Map(); 
let sessionUser = JSON.parse(sessionStorage.getItem("session user"));
let loggedInUser;

window.onload = setUp;

function setUp() {
    document.getElementById("login-form").onsubmit = login;
    document.getElementById("register-button").onclick = showCreateAccountScreen;
    document.getElementById("create-account-form").onsubmit = register;
    document.getElementById("cancel-create-account-button").onclick = cancelCreateAccount;
    document.getElementById("logout-button").onclick = logout;
    document.getElementById("all-contacts-button").onclick = showAllContacts;
    document.getElementById("my-contacts-button").onclick = showMyContacts;
    document.getElementById("add-contact-button").onclick = showAddContactScreen;
    document.getElementById("add-contact-form").onsubmit = addContact;
    document.getElementById("cancel-add-contact-button").onclick = showMainScreen;

    let xhr = new XMLHttpRequest();
    let url = "http://34.91.249.158:80/contacts/";

    xhr.open('GET', url, false);
    xhr.onload = (e) => {
        contacts = JSON.parse(xhr.response);
        contacts.forEach(contact => {
            createContactDiv(contact);
            createMarker(contact);
        });
    }
    xhr.send();

    let mapOptions = {
        center: [52.5164, 13.381],
        zoom: 11
    };
    map = new L.map('map', mapOptions);
    let tileLayer = new L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
    map.addLayer(tileLayer);

    if(sessionUser != null) {
        let xhr = new XMLHttpRequest();
        let url = "http://34.91.249.158:80/users/";

        xhr.open('POST', url, false);
        xhr.onload = (e) =>  {
            loggedInUser = JSON.parse(xhr.response);
        };
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({"username": sessionUser.username, "password": sessionUser.password}));

        showMainScreen();
    } else {
        buildSite('flex', 'none', 'none', 'none', 'none');
    }
}

function sendAsyncHttpRequest(method, url, payload) {
    const promise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);

        xhr.onload = () => {
            resolve(xhr);
        };

        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(payload));
    });
    return promise;
}

function login(e) {
    e.preventDefault();
    let username = document.getElementById("username-input").value; 
    let password = document.getElementById("password-input").value;

    const xhr = new XMLHttpRequest();
    let url = "http://34.91.249.158:80/users/"
    xhr.open('POST', url, false);
    xhr.onload = () => {
        if(xhr.status == 200) {
            loggedInUser = JSON.parse(xhr.response);
            showMainScreen();
            document.getElementById("login-form").reset(); 
            sessionStorage.setItem("session user", JSON.stringify(loggedInUser));
        }
        else {
            window.alert("Account details are invalid!");
        }
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({"username": username, "password": password}));
}

function showCreateAccountScreen() {
    buildSite('none', 'flex', 'none', 'none', 'none');
}

function register(e) {
    e.preventDefault();
    let username = document.getElementById("create-username-input").value;
    let password = document.getElementById("create-password-input").value;
    let repeatPassword = document.getElementById("repeat-password-input").value;

    window.alert("Nicht implementiert!");
}

function cancelCreateAccount() {
    buildSite('flex', 'none', 'none', 'none', 'none');
}

function logout(e) {
    sessionStorage.clear();
    showContacts = "all";
    buildSite('flex', 'none', 'none', 'none', 'none');
}

function buildSite(login, createAccount, main, addContact, editContact) {
    document.getElementById("login-screen").style.display = login;
    document.getElementById("create-account-screen").style.display = createAccount;
    document.getElementById("main-screen").style.display = main;
    document.getElementById("add-contact-screen").style.display = addContact;
    document.getElementById("edit-contact-screen").style.display = editContact;
}

function addContact(e) {
    e.preventDefault();

    let contactData = new FormData(e.target);
    let firstName = contactData.get("first-name");
    let lastName = contactData.get("last-name");
    let nickname = contactData.get("nickname");
    let streetAndNumber = contactData.get("street-and-number");
    let zip = contactData.get("zip");
    let city = contactData.get("city");
    let country = contactData.get("country");
    let phone = contactData.get("phone");
    let email = contactData.get("email");
    let dob = contactData.get("dob");
    let isPublic = contactData.get("is-public");
    let coordinates = getCoordinates(streetAndNumber, zip);
    
    document.getElementById('add-contact-form').reset();

    if(coordinates != null) {
        let contact = new Contact(loggedInUser, firstName, lastName, nickname, 
            streetAndNumber, zip, city, country, phone, email, dob, isPublic, coordinates);
    
        sendAsyncHttpRequest('POST', 'http://34.91.249.158:80/contacts/', contact)
            .then((xhr) => {
                contact._id = xhr.getResponseHeader('Location').slice(10);  
                contacts.push(contact);
                createContactDiv(contact);
                createMarker(contact);
                showMainScreen();
            });
    }
}

function createContactDiv(contact) {
    let contactDiv = document.createElement("div");
    contactDiv.className = "contact";
    contactDiv.id = "contact" + contact._id; 

    let contactPhoto = document.createElement("img");
    contactPhoto.className = "contact-photo";
    contactPhoto.src = "images/default_contact_photo.jpg";
    contactPhoto.alt = "Contact photo of " + contact.firstName + " " + contact.lastName;

    let name = document.createElement("div");
    name.className = "name";
    name.id = "name" + contact._id;
    name.innerHTML = contact.firstName + " " + contact.lastName + "<br>"
        + '<span class="from">from ' + contact.owner.username + "</span>";

    contactDiv.appendChild(contactPhoto);
    contactDiv.appendChild(name);
    contactDiv.style.display = 'none';
    
    document.getElementById("contact-list").appendChild(contactDiv);

    contactDiv.onclick = function() {
        showEditContactScreen(contact);
    };
}

function showEditContactScreen(contact) {
    styleMainScreen('100%', '100%', '100%', 'hidden');
    document.getElementById("edit-contact-screen").style.overflow = 'auto';

    document.getElementById("edit-first-name-input").value = contact.firstName;
    document.getElementById("edit-last-name-input").value = contact.lastName;
    document.getElementById("edit-nickname-input").value = contact.nickname;
    document.getElementById("edit-street-and-number-input").value = contact.streetAndNumber;
    document.getElementById("edit-zip-input").value = contact.zip;
    document.getElementById("edit-city-input").value = contact.city;
    document.getElementById("edit-country-input").value = contact.country;
    document.getElementById("edit-phone-input").value = contact.phone;
    document.getElementById("edit-email-input").value = contact.email;
    document.getElementById("edit-dob-input").value = contact.dob;
    document.getElementById("edit-public-checkbox").checked = contact.isPublic;

    if(loggedInUser.role != "admin" && loggedInUser != contact.owner) {
        document.getElementById("edit-first-name-input").readOnly = true;
        document.getElementById("edit-last-name-input").readOnly = true;
        document.getElementById("edit-nickname-input").readOnly = true;
        document.getElementById("edit-street-and-number-input").readOnly = true;
        document.getElementById("edit-zip-input").readOnly = true;
        document.getElementById("edit-city-input").readOnly = true;
        document.getElementById("edit-country-input").readOnly = true;
        document.getElementById("edit-phone-input").readOnly = true;
        document.getElementById("edit-email-input").readOnly = true;
        document.getElementById("edit-dob-input").readOnly = true;
        document.getElementById("edit-public-checkbox").readOnly = true;
    }
    else {
        document.getElementById("edit-first-name-input").readOnly = false;
        document.getElementById("edit-last-name-input").readOnly = false;
        document.getElementById("edit-nickname-input").readOnly = false;
        document.getElementById("edit-street-and-number-input").readOnly = false;
        document.getElementById("edit-zip-input").readOnly = false;
        document.getElementById("edit-city-input").readOnly = false;
        document.getElementById("edit-country-input").readOnly = false;
        document.getElementById("edit-phone-input").readOnly = false;
        document.getElementById("edit-email-input").readOnly = false;
        document.getElementById("edit-dob-input").readOnly = false;
        document.getElementById("edit-public-checkbox").readOnly = false;
    }

    document.getElementById("edit-contact-form").onsubmit = function(e) {
        e.preventDefault();
        editContact(e, contact);
    };
    document.getElementById("remove-button").onclick = function() {
        removeContact(contact);
    };
    document.getElementById("close-button").onclick = showMainScreen;

    buildSite('none', 'none', 'flex', 'none', 'flex');
    style();
}

function editContact(e, contact) {
    if(loggedInUser.role != "admin" && loggedInUser.username != contact.owner.username) {
        window.alert("You do not have permission to edit other people's contacts!");
    }
    else {
        let contactData = new FormData(e.target);
        contact.firstName = contactData.get("first-name");
        contact.lastName = contactData.get("last-name");
        contact.nickname = contactData.get("nickname");
        contact.streetAndNumber = contactData.get("street-and-number");
        contact.zip = contactData.get("zip");
        contact.city = contactData.get("city");
        contact.country = contactData.get("country");
        contact.phone = contactData.get("phone");
        contact.email = contactData.get("email");
        contact.dob = contactData.get("dob");
        contact.isPublic = contactData.get("is-public");
        contact.coordinates = getCoordinates(contact.streetAndNumber, contact.zip);
        
        let id = contact._id;
        delete contact._id;

        sendAsyncHttpRequest('PUT', 'http://34.91.249.158:80/contacts/' + id, contact);

        contact._id = id;
        
        editContactDiv(contact);
        map.removeLayer(markers.get("marker" + contact._id));
        createMarker(contact); 
        showMainScreen();
    }
}

function editContactDiv(contact) {
    document.getElementById("name" + contact._id).innerHTML = contact.firstName + " " 
    + contact.lastName + "<br>" + '<span class="from">from ' + contact.owner.username + "</span>";
}

function removeContact(contact) {
    if(loggedInUser.role != "admin" && loggedInUser.username != contact.owner.username) {
        window.alert("You do not have permission to remove other people's contacts!");
    }
    else {
        sendAsyncHttpRequest('DELETE', 'http://34.91.249.158:80/contacts/' + contact._id);
        contacts.splice(contacts.indexOf(contact), 1);
        document.getElementById("contact" + contact._id).remove();
        map.removeLayer(markers.get("marker" + contact._id));
        showMainScreen();
    }
}

let showContacts = "all";

function showMainScreen() {
    document.getElementById("welcome-message").innerText = "Welcome " + loggedInUser.username;
    styleMainScreen('fit-content', 'none', 'fit-content', 'auto');
    buildSite('none', 'none', 'flex', 'none', 'none');

    if(showContacts == "all") {
        showAllContacts();
    }
    else if(showContacts == "my") {
        showMyContacts();
    }
}

function showAllContacts() {
    showContacts = "all";
    document.getElementById("all-contacts-button").style.backgroundColor = 'transparent';
    document.getElementById("my-contacts-button").style.backgroundColor = 'rgb(48, 48, 48)';

    document.getElementById("you-see").innerText = loggedInUser.role == "admin" ? 
        'You see your contacts and all contacts of others.' 
        : 'You see your contacts and the public contacts of others.';

    let numberOfContacts = 0;
    for(let i = 0; i < contacts.length; i++) {
        if(contacts[i].owner.username == loggedInUser.username || contacts[i].isPublic || loggedInUser.role == "admin") {
            document.getElementById("contact" + contacts[i]._id).style.display = 'flex';
            map.addLayer(markers.get("marker" + contacts[i]._id));
            numberOfContacts++;
        }
        else {
            document.getElementById("contact" + contacts[i]._id).style.display = 'none';
            map.removeLayer(markers.get("marker" + contacts[i]._id));
        }
    }
    document.getElementById("number-of-contacts").innerText = numberOfContacts;
}

function showMyContacts() {
    showContacts = "my";
    document.getElementById("all-contacts-button").style.backgroundColor = 'rgb(48, 48, 48)';
    document.getElementById("my-contacts-button").style.backgroundColor = 'transparent';

    document.getElementById("you-see").innerText = 'You see your contacts.'

    let numberOfContacts = 0;
    for(let i = 0; i < contacts.length; i++) {
        if(contacts[i].owner.username == loggedInUser.username) {
            document.getElementById("contact" + contacts[i]._id).style.display = 'flex';
            map.addLayer(markers.get("marker" + contacts[i]._id));
            numberOfContacts++;
        }
        else {
            document.getElementById("contact" + contacts[i]._id).style.display = 'none';
            map.removeLayer(markers.get("marker" + contacts[i]._id));
        }
    }
    document.getElementById("number-of-contacts").innerText = numberOfContacts;
}

function showAddContactScreen() {
    styleMainScreen('100%', '100%', '100%', 'hidden');
    document.getElementById("add-contact-screen").style.overflow = 'auto';
    buildSite('none', 'none', 'flex', 'flex', 'none');
    style();
}

function styleMainScreen(minWidth, maxWidth, maxHeight, overflow) {
    let mainScreen = document.getElementById("main-screen");
    mainScreen.style.minWidth = minWidth;
    mainScreen.style.maxWidth = maxWidth;
    mainScreen.style.maxHeight = maxHeight;
    mainScreen.style.overflow = overflow;
}

function getCoordinates(streetAndNumber, zip) {
    streetAndNumber.replaceAll(" ", "+");

    let lat, long;
    let xhr = new XMLHttpRequest();
    let url = "https://nominatim.openstreetmap.org/search.php?" + "q=" + streetAndNumber
        + "+" + zip + "&format=jsonv2";

    xhr.open("GET", url, false);
    xhr.onerror = function() {
        window.alert("Connection to " + url + " failed!");
    }; 
    xhr.onload = function(e) {
        let response = JSON.parse(this.response);
        if(this.status === 200) {
            if(Object.keys(response).length > 0) {
                lat = response[0].lat;
                long = response[0].lon;
            }
            else {
                window.alert("Address could not be resolved!");
            }
        }
        else {
            window.alert("HTTP-status code was: " + response.status);
        }
    }; 
    xhr.send();

    if(lat == null || long == null) {
        return null;
    }
    return [lat, long];
}

function style() {
    document.getElementById("add-dob-input").style.height = 
        document.getElementById("add-phone-input").offsetHeight + "px";
    document.getElementById("add-public-checkbox").style.height = 
        document.getElementById("add-email-input").offsetHeight + "px";
    document.getElementById("edit-dob-input").style.height = 
        document.getElementById("edit-phone-input").offsetHeight + "px";
    document.getElementById("edit-public-checkbox").style.height = 
        document.getElementById("edit-email-input").offsetHeight + "px";
}

function createMarker(contact) {
    let iconOptions = {
        title: contact.firstName + ' ' + contact.lastName,
        draggable: false
    };
    let marker = new L.Marker(contact.coordinates, iconOptions);

    let popup = '<strong>' + contact.firstName + ' ' + contact.lastName + '</strong>' + '<br><br>'
        + contact.streetAndNumber + '<br>' + contact.zip + ' ' + contact.city;
    if(contact.country.length > 0) {
        popup += '<br>(' + contact.country + ')';
    }
    marker.bindPopup(popup);

    markers.set("marker" + contact._id, marker);
}
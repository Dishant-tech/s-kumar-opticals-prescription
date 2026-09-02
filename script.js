import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBcDTjYehWnLb0MRoZ21UosklXopGeTm-w",
  authDomain: "fir-kumar-opticals.firebaseapp.com",
  projectId: "fir-kumar-opticals",
  storageBucket: "fir-kumar-opticals.firebasestorage.app",
  messagingSenderId: "380381941388",
  appId: "1:380381941388:web:85250c1727d42ab98375a9",
  measurementId: "G-QGFEB2SPG5"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


// Separate collection for Prescription Manager
const customersCollection =
    collection(db, "prescriptionManagerCustomers");
let customers = [];
let currentCustomer = null;
let editingPrescriptionId = null;
let currentPreviewPrescription = null;
let editingCustomerId = null;

const STORAGE_KEY = "sKumarOpticalsCustomers";


/* =========================
   SAVE & LOAD DATA
========================= */

async function saveData() {

    try {

        const savePromises = customers.map(customer =>
            setDoc(
                doc(
                    db,
                    "prescriptionManagerCustomers",
                    String(customer.id)
                ),
                customer
            )
        );

        await Promise.all(savePromises);

        updateHomeStats();

        console.log("Data saved to Firebase");

    } catch (error) {

        console.error(
            "Firebase save error:",
            error
        );

        showToast("Error saving data");

    }
}

async function loadData() {

    try {

        const snapshot =
            await getDocs(customersCollection);

        customers = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.data().id
        }));

        console.log(
            "Customers loaded from Firebase:",
            customers.length
        );

    } catch (error) {

        console.error(
            "Firebase load error:",
            error
        );

        customers = [];

        showToast("Could not load Firebase data");
    }

    updateGreeting();
    updateHomeStats();
    displayCustomers(customers);
}


/* =========================
   HOME STATS
========================= */

function updateHomeStats() {
    const totalCustomers =
        document.getElementById("totalCustomers");

    const totalPrescriptions =
        document.getElementById("totalPrescriptions");

    const monthPrescriptions =
        document.getElementById("monthPrescriptions");

    if (
        !totalCustomers ||
        !totalPrescriptions ||
        !monthPrescriptions
    ) {
        return;
    }

    let prescriptionCount = 0;
    let monthCount = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    customers.forEach(customer => {
        const prescriptions =
            customer.prescriptions || [];

        prescriptionCount += prescriptions.length;

        prescriptions.forEach(prescription => {
            const date = new Date(prescription.date);

            if (
                date.getMonth() === currentMonth &&
                date.getFullYear() === currentYear
            ) {
                monthCount++;
            }
        });
    });

    totalCustomers.textContent = customers.length;
    totalPrescriptions.textContent = prescriptionCount;
    monthPrescriptions.textContent = monthCount;
}


/* =========================
   GREETING
========================= */

function updateGreeting() {
    const greeting =
        document.getElementById("homeGreeting");

    if (!greeting) return;

    const hour = new Date().getHours();

    if (hour < 12) {
        greeting.textContent = "Good Morning! ☀️";
    } else if (hour < 18) {
        greeting.textContent = "Good Afternoon! 🌤️";
    } else {
        greeting.textContent = "Good Evening! 🌙";
    }
}


/* =========================
   SCREEN CONTROL
========================= */

function showScreen(screenId) {
    document.querySelectorAll(".screen")
        .forEach(screen => {
            screen.classList.remove("active");
        });

    const screen = document.getElementById(screenId);

    if (screen) {
        screen.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function goHome() {
    currentCustomer = null;
    editingPrescriptionId = null;

    const search =
        document.getElementById("searchInput");

    if (search) {
        search.value = "";
    }

    displayCustomers(customers);
    updateHomeStats();
    updateGreeting();

    showScreen("homeScreen");
}


/* =========================
   NEW CUSTOMER
========================= */

function openNewCustomer() {
    clearCustomerForm();
    showScreen("customerScreen");
}


function clearCustomerForm() {
    const fields = [
        "customerName",
        "customerMobile",
        "customerAge",
        "customerGender"
    ];

    fields.forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            element.value = "";
        }
    });
}
/* =========================
   EDIT CUSTOMER
========================= */

function editCustomer() {

    if (!currentCustomer) {
        showToast("Customer not found");
        return;
    }

    editingCustomerId = currentCustomer.id;

    document.getElementById("customerName").value =
        currentCustomer.name || "";

    document.getElementById("customerMobile").value =
        currentCustomer.mobile || "";

    document.getElementById("customerAge").value =
        currentCustomer.age || "";

    document.getElementById("customerGender").value =
        currentCustomer.gender || "";

    showScreen("customerScreen");
}


/* =========================

   DELETE CUSTOMER

========================= */

function deleteCustomer() {

    if (!currentCustomer) {

        showToast("Customer not found");

        return;

    }

    const confirmed = confirm(

        `Delete ${currentCustomer.name}?\n\n` +

        "This will permanently delete the customer " +

        "and all their prescription history."

    );

    if (!confirmed) {

        return;

    }

    customers = customers.filter(

        customer =>

            String(customer.id) !==

            String(currentCustomer.id)

    );

    saveData();

    currentCustomer = null;

    editingCustomerId = null;

    editingPrescriptionId = null;

    showToast("Customer deleted successfully");

    setTimeout(() => {

        goHome();

    }, 400);

}

/* =========================
   SAVE CUSTOMER
========================= */

function saveCustomer() {

    const nameInput =
        document.getElementById("customerName");

    const name = nameInput.value.trim();

    if (!name) {
        showToast("Please enter customer name");
        nameInput.focus();
        return;
    }


    /* =========================
       EDIT EXISTING CUSTOMER
    ========================= */

    if (editingCustomerId) {

        const customerIndex =
            customers.findIndex(
                customer =>
                    String(customer.id) ===
                    String(editingCustomerId)
            );

        if (customerIndex !== -1) {

            customers[customerIndex].name = name;

            customers[customerIndex].mobile =
                document.getElementById(
                    "customerMobile"
                ).value.trim();

            customers[customerIndex].age =
                document.getElementById(
                    "customerAge"
                ).value;

            customers[customerIndex].gender =
                document.getElementById(
                    "customerGender"
                ).value;


            currentCustomer =
                customers[customerIndex];

            saveData();

            editingCustomerId = null;

            showToast(
                "Customer updated successfully"
            );

            showCustomer();
            return;
        }
    }


    /* =========================
       CREATE NEW CUSTOMER
    ========================= */

    const customer = {
        id: Date.now(),

        name: name,

        mobile:
            document.getElementById(
                "customerMobile"
            ).value.trim(),

        age:
            document.getElementById(
                "customerAge"
            ).value,

        gender:
            document.getElementById(
                "customerGender"
            ).value,

        prescriptions: []
    };

    customers.unshift(customer);

    currentCustomer = customer;

    saveData();

    updatePrescriptionCustomer();
    clearPrescription();

    showScreen("prescriptionScreen");

    showToast("Customer created successfully");
}

function updatePrescriptionCustomer() {
    if (!currentCustomer) return;

    const name1 =
        document.getElementById(
            "prescriptionCustomerName"
        );

    const name2 =
        document.getElementById(
            "prescriptionCustomerName2"
        );

    const mobile =
        document.getElementById(
            "prescriptionCustomerMobile"
        );

    if (name1) {
        name1.textContent =
            currentCustomer.name;
    }

    if (name2) {
        name2.textContent =
            currentCustomer.name;
    }

    if (mobile) {
        mobile.textContent =
            currentCustomer.mobile ||
            "No mobile number";
    }
}


/* =========================
   NEW PRESCRIPTION
========================= */

function newPrescription() {
    if (!currentCustomer) {
        showToast("Customer not found");
        return;
    }

    editingPrescriptionId = null;

    updatePrescriptionCustomer();
    clearPrescription();

    showScreen("prescriptionScreen");
}


/* =========================
   SAVE PRESCRIPTION
========================= */

function savePrescription() {
    if (!currentCustomer) {
        showToast("Customer not found");
        return;
    }

    const prescription = {
        id:
            editingPrescriptionId ||
            Date.now(),

        date:
            editingPrescriptionId
                ? getEditingDate()
                : new Date().toISOString(),

        rightEye: {
            sph:
                getValue("rightSPH"),

            cyl:
                getValue("rightCYL"),

            axis:
                getValue("rightAXIS"),

            add:
                getValue("rightADD"),

            prism:
                getValue("rightPRISM")
        },

        leftEye: {
            sph:
                getValue("leftSPH"),

            cyl:
                getValue("leftCYL"),

            axis:
                getValue("leftAXIS"),

            add:
                getValue("leftADD"),

            prism:
                getValue("leftPRISM")
        },

        distanceVA:
            getValue("distanceVA"),

        nearVA:
            getValue("nearVA"),

        doctor:
            getValue("doctor"),

        lensType:
            getValue("lensType"),

        remarks:
            getValue("remarks")
    };


    if (!currentCustomer.prescriptions) {
        currentCustomer.prescriptions = [];
    }


    if (editingPrescriptionId) {
        const index =
            currentCustomer.prescriptions.findIndex(
                item =>
                    String(item.id) ===
                    String(editingPrescriptionId)
            );

        if (index !== -1) {
            currentCustomer.prescriptions[index] =
                prescription;
        }

    } else {
        currentCustomer.prescriptions.unshift(
            prescription
        );
    }


    const customerIndex =
        customers.findIndex(
            customer =>
                String(customer.id) ===
                String(currentCustomer.id)
        );

    if (customerIndex !== -1) {
        customers[customerIndex] =
            currentCustomer;
    }

    saveData();

    editingPrescriptionId = null;

    displayCustomers(customers);

    showToast(
        "Prescription saved successfully"
    );

    setTimeout(() => {
        showCustomer();
    }, 500);
}


function getValue(id) {
    const element = document.getElementById(id);

    return element
        ? element.value.trim()
        : "";
}


/* =========================
   GET ORIGINAL DATE
========================= */

function getEditingDate() {
    if (
        !currentCustomer ||
        !currentCustomer.prescriptions
    ) {
        return new Date().toISOString();
    }

    const prescription =
        currentCustomer.prescriptions.find(
            item =>
                String(item.id) ===
                String(editingPrescriptionId)
        );

    return prescription
        ? prescription.date
        : new Date().toISOString();
}


/* =========================
   CLEAR PRESCRIPTION
========================= */

function clearPrescription() {
    const fields = [
        "rightSPH",
        "rightCYL",
        "rightAXIS",
        "rightADD",
        "rightPRISM",

        "leftSPH",
        "leftCYL",
        "leftAXIS",
        "leftADD",
        "leftPRISM",

        "distanceVA",
        "nearVA",
        "doctor",
        "lensType",
        "remarks"
    ];

    fields.forEach(id => {
        const element =
            document.getElementById(id);

        if (element) {
            element.value = "";
        }
    });

    editingPrescriptionId = null;
}


/* =========================
   SEARCH CUSTOMERS
========================= */

function searchCustomers() {
    const searchInput =
        document.getElementById("searchInput");

    const value =
        searchInput.value
            .toLowerCase()
            .trim();

    if (!value) {
        displayCustomers(customers);
        return;
    }

    const results =
        customers.filter(customer => {

            const name =
                String(
                    customer.name || ""
                ).toLowerCase();

            const mobile =
                String(
                    customer.mobile || ""
                ).toLowerCase();

            return (
                name.includes(value) ||
                mobile.includes(value)
            );
        });

    displayCustomers(results);
}


/* =========================
   DISPLAY CUSTOMERS
========================= */

function displayCustomers(list) {
    const containers =
        document.querySelectorAll("#customerList");

    containers.forEach(container => {

        if (!container) return;

        if (!list || list.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div>👤</div>
                    <h3>No customers found</h3>
                    <p>
                        Create a new customer
                        to get started.
                    </p>
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        list.forEach(customer => {
            const item =
                document.createElement("div");

            item.className =
                "customer-item";

            let lastPrescription =
                "No prescription yet";

            if (
                customer.prescriptions &&
                customer.prescriptions.length > 0
            ) {
                const sorted =
                    [...customer.prescriptions].sort(
                        (a, b) =>
                            new Date(b.date) -
                            new Date(a.date)
                    );

                lastPrescription =
                    formatDate(sorted[0].date);
            }

            item.innerHTML = `
                <div class="customer-info">

                    <div class="customer-avatar">
                        👤
                    </div>

                    <div>
                        <h4>
                            ${escapeHTML(
                                customer.name
                            )}
                        </h4>

                        <p>
                            📱 ${escapeHTML(
                                customer.mobile ||
                                "No mobile number"
                            )}

                            <br>

                            Last prescription:
                            ${lastPrescription}
                        </p>
                    </div>

                </div>

                <button class="view-btn">
                    Open →
                </button>
            `;

            item
                .querySelector(".view-btn")
                .addEventListener(
                    "click",
                    () => openCustomer(customer)
                );

            container.appendChild(item);
        });
    });
}


/* =========================
   OPEN CUSTOMER
========================= */

function openCustomer(customer) {
    currentCustomer = customer;
    editingPrescriptionId = null;

    showCustomer();
}


/* =========================
   SHOW CUSTOMER HISTORY
========================= */

function showCustomer() {
    if (!currentCustomer) {
        goHome();
        return;
    }

    const name =
        document.getElementById(
            "historyCustomerName"
        );

    const info =
        document.getElementById(
            "historyCustomerInfo"
        );

    if (name) {
        name.textContent =
            currentCustomer.name;
    }

    if (info) {
        let customerInfo =
            currentCustomer.mobile ||
            "No mobile number";

        if (currentCustomer.age) {
            customerInfo +=
                " • Age: " +
                currentCustomer.age;
        }

        if (currentCustomer.gender) {
            customerInfo +=
                " • " +
                currentCustomer.gender;
        }

        info.textContent = customerInfo;
        const profileInfo =
    document.getElementById("profileCustomerInfo");

if (profileInfo) {
    profileInfo.textContent = customerInfo;
}
    }

    loadHistory();

    showScreen("historyScreen");
}


/* =========================
   PRESCRIPTION HISTORY
========================= */

function loadHistory() {
    const container =
        document.getElementById("historyList");

    if (!container) return;

    if (
        !currentCustomer ||
        !currentCustomer.prescriptions ||
        currentCustomer.prescriptions.length === 0
    ) {
        container.innerHTML = `
            <div class="empty-state">
                <div>📋</div>
                <h3>No prescriptions yet</h3>
                <p>
                    Create the first prescription
                    for this customer.
                </p>
            </div>
        `;

        return;
    }

    const prescriptions =
        [...currentCustomer.prescriptions]
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            );

    container.innerHTML = "";

    prescriptions.forEach(prescription => {
        const item =
            document.createElement("div");

        item.className =
            "history-item";

        item.innerHTML = `
            <div class="history-date">
                ${formatDate(prescription.date)}

                <span>
                    Prescription
                </span>
            </div>

            <div class="history-actions">
                <button class="view-history-btn">
                    View
                </button>

                <button class="edit-history-btn">
                    Edit
                </button>

                <button class="print-history-btn">
                    Print
                </button>
            </div>
        `;

        item
            .querySelector(".view-history-btn")
            .addEventListener(
                "click",
                () =>
                    viewPrescription(
                        prescription.id
                    )
            );

        item
            .querySelector(".edit-history-btn")
            .addEventListener(
                "click",
                () =>
                    editPrescription(
                        prescription.id
                    )
            );

        item
            .querySelector(".print-history-btn")
            .addEventListener(
                "click",
                () =>
                    printPrescription(
                        prescription.id
                    )
            );

        container.appendChild(item);
    });
}


/* =========================
   FIND PRESCRIPTION
========================= */

function findPrescription(id) {
    if (
        !currentCustomer ||
        !currentCustomer.prescriptions
    ) {
        return null;
    }

    return currentCustomer.prescriptions.find(
        prescription =>
            String(prescription.id) ===
            String(id)
    );
}


/* =========================
   VIEW PRESCRIPTION
========================= */

/* =========================
   VIEW PRESCRIPTION
========================= */

/* =========================
   VIEW PRESCRIPTION
========================= */

function viewPrescription(id) {

    const prescription =
        findPrescription(id);

    if (!prescription) {
        showToast("Prescription not found");
        return;
    }

    const rightEye =
        prescription.rightEye || {};

    const leftEye =
        prescription.leftEye || {};


    /* CUSTOMER DETAILS */

    document.getElementById(
        "previewCustomerName"
    ).textContent =
        currentCustomer.name || "Customer";


    document.getElementById(
        "previewCustomerMobile"
    ).textContent =
        currentCustomer.mobile ||
        "Not provided";


    /* DATE */

    document.getElementById(
        "previewDate"
    ).textContent =
        formatDate(prescription.date);


    /* RIGHT EYE */

    document.getElementById(
        "previewRightSPH"
    ).textContent =
        rightEye.sph || "—";

    document.getElementById(
        "previewRightCYL"
    ).textContent =
        rightEye.cyl || "—";

    document.getElementById(
        "previewRightAXIS"
    ).textContent =
        rightEye.axis || "—";

    document.getElementById(
        "previewRightADD"
    ).textContent =
        rightEye.add || "—";

    document.getElementById(
        "previewRightPRISM"
    ).textContent =
        rightEye.prism || "—";


    /* LEFT EYE */

    document.getElementById(
        "previewLeftSPH"
    ).textContent =
        leftEye.sph || "—";

    document.getElementById(
        "previewLeftCYL"
    ).textContent =
        leftEye.cyl || "—";

    document.getElementById(
        "previewLeftAXIS"
    ).textContent =
        leftEye.axis || "—";

    document.getElementById(
        "previewLeftADD"
    ).textContent =
        leftEye.add || "—";

    document.getElementById(
        "previewLeftPRISM"
    ).textContent =
        leftEye.prism || "—";


    /* ADDITIONAL DETAILS */

    document.getElementById(
        "previewDistanceVA"
    ).textContent =
        prescription.distanceVA || "—";

    document.getElementById(
        "previewNearVA"
    ).textContent =
        prescription.nearVA || "—";

    document.getElementById(
        "previewDoctor"
    ).textContent =
        prescription.doctor || "—";

    document.getElementById(
        "previewLensType"
    ).textContent =
        prescription.lensType || "—";

    document.getElementById(
        "previewRemarks"
    ).textContent =
        prescription.remarks ||
        "No remarks added.";


    /* OPEN PREVIEW */
    currentPreviewPrescription = prescription;
    showScreen("previewScreen");
}

function editPrescription(id) {
    const prescription =
        findPrescription(id);

    if (!prescription) {
        showToast("Prescription not found");
        return;
    }

    editingPrescriptionId = prescription.id;

    const right =
        prescription.rightEye || {};

    const left =
        prescription.leftEye || {};

    setValue("rightSPH", right.sph);
    setValue("rightCYL", right.cyl);
    setValue("rightAXIS", right.axis);
    setValue("rightADD", right.add);
    setValue("rightPRISM", right.prism);

    setValue("leftSPH", left.sph);
    setValue("leftCYL", left.cyl);
    setValue("leftAXIS", left.axis);
    setValue("leftADD", left.add);
    setValue("leftPRISM", left.prism);

    setValue(
        "distanceVA",
        prescription.distanceVA
    );

    setValue(
        "nearVA",
        prescription.nearVA
    );

    setValue(
        "doctor",
        prescription.doctor
    );

    setValue(
        "lensType",
        prescription.lensType
    );

    setValue(
        "remarks",
        prescription.remarks
    );

    updatePrescriptionCustomer();

    showScreen("prescriptionScreen");
}


function setValue(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.value = value || "";
    }
}


/* =========================
   PRINT PRESCRIPTION
========================= */

function printPrescription(id) {
    const prescription =
        findPrescription(id);

    if (!prescription) return;

    const r =
        prescription.rightEye || {};

    const l =
        prescription.leftEye || {};

    const printWindow =
        window.open("", "_blank");

    if (!printWindow) {
        showToast(
            "Please allow popups to print"
        );

        return;
    }

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>

<title>
Prescription - ${escapeHTML(
    currentCustomer.name
)}
</title>

<style>
* {
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    padding: 40px;
    color: #172033;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #172033;
    padding-bottom: 18px;
    margin-bottom: 25px;
}

h1 {
    margin: 0;
    font-size: 27px;
}

.subtitle {
    color: #64748b;
    margin-top: 5px;
}

.customer {
    background: #f7f8fa;
    padding: 16px;
    border-radius: 8px;
    line-height: 1.8;
    margin-bottom: 25px;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th,
td {
    border: 1px solid #cbd5e1;
    padding: 12px;
    text-align: center;
}

th {
    background: #172033;
    color: white;
}

.section {
    margin-top: 25px;
}

.details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.detail-box {
    background: #f7f8fa;
    padding: 12px;
    border-radius: 7px;
}

.remarks {
    margin-top: 20px;
    padding: 15px;
    background: #f7f8fa;
    border-radius: 7px;
}

@media print {
    body {
        padding: 20px;
    }
}
</style>

</head>

<body>

<div class="header">
    <div>
        <h1>S Kumar Opticals</h1>
        <div class="subtitle">
            Optical Prescription
        </div>
    </div>

    <strong>
        ${formatDate(prescription.date)}
    </strong>
</div>

<div class="customer">
    <strong>Customer:</strong>
    ${escapeHTML(currentCustomer.name)}
    <br>

    <strong>Mobile:</strong>
    ${escapeHTML(
        currentCustomer.mobile || "-"
    )}
</div>

<table>
<tr>
    <th>Eye</th>
    <th>SPH</th>
    <th>CYL</th>
    <th>AXIS</th>
    <th>ADD</th>
    <th>PRISM</th>
</tr>

<tr>
    <td><strong>Right (OD)</strong></td>
    <td>${escapeHTML(r.sph || "-")}</td>
    <td>${escapeHTML(r.cyl || "-")}</td>
    <td>${escapeHTML(r.axis || "-")}</td>
    <td>${escapeHTML(r.add || "-")}</td>
    <td>${escapeHTML(r.prism || "-")}</td>
</tr>

<tr>
    <td><strong>Left (OS)</strong></td>
    <td>${escapeHTML(l.sph || "-")}</td>
    <td>${escapeHTML(l.cyl || "-")}</td>
    <td>${escapeHTML(l.axis || "-")}</td>
    <td>${escapeHTML(l.add || "-")}</td>
    <td>${escapeHTML(l.prism || "-")}</td>
</tr>
</table>

<div class="section">
    <div class="details">

        <div class="detail-box">
            <strong>Distance VA</strong>
            <br>
            ${escapeHTML(
                prescription.distanceVA || "-"
            )}
        </div>

        <div class="detail-box">
            <strong>Near VA</strong>
            <br>
            ${escapeHTML(
                prescription.nearVA || "-"
            )}
        </div>

        <div class="detail-box">
            <strong>Doctor / Clinic</strong>
            <br>
            ${escapeHTML(
                prescription.doctor || "-"
            )}
        </div>

        <div class="detail-box">
            <strong>Lens Type</strong>
            <br>
            ${escapeHTML(
                prescription.lensType || "-"
            )}
        </div>

    </div>
</div>

<div class="remarks">
    <strong>Remarks</strong>
    <br><br>
    ${escapeHTML(
        prescription.remarks || "-"
    )}
</div>

</body>
</html>
    `);

    printWindow.document.close();

    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
    }, 300);
}
function printCurrentPrescription() {

    if (!currentPreviewPrescription) {
        showToast("No prescription selected");
        return;
    }

    printPrescription(
        currentPreviewPrescription.id
    );
}


/* =========================
   DATE FORMAT
========================= */

function formatDate(dateValue) {
    if (!dateValue) return "-";

    const date =
        new Date(dateValue);

    if (isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================
   SETTINGS
========================= */

function showSettings() {
    showToast(
        "Settings will be added later"
    );
}


/* =========================
   TOAST
========================= */

function showToast(message) {
    const toast =
        document.getElementById("toast");

    if (!toast) {
        alert(message);
        return;
    }

    toast.textContent = message;
    toast.style.display = "block";

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {
        toast.style.display = "none";
    }, 2200);
}


/* =========================
   HTML SAFETY
========================= */

function escapeHTML(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================
   KEYBOARD SHORTCUT
========================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            (event.metaKey || event.ctrlKey) &&
            event.key.toLowerCase() === "k"
        ) {
            event.preventDefault();

            const search =
                document.getElementById(
                    "searchInput"
                );

            if (search) {
                showScreen("homeScreen");
                search.focus();
            }
        }
    }
);


/* =========================
   START SOFTWARE
========================= */
/* =========================
   PRESCRIPTION SIGN BUTTONS
========================= */

function setPrescriptionSign(fieldId, sign) {
    const input = document.getElementById(fieldId);

    if (!input) return;

    let value = input.value.trim();

    // Remove existing + or -
    value = value.replace(/^[+-]/, "");

    // Add the selected sign
    input.value = sign + value;

    input.focus();
}

window.toggleSign = function(inputId) {

    const input = document.getElementById(inputId);

    if (!input) return;

    let value = input.value.trim();

    // Remove current sign

    const number = value.replace(/^[+-]/, "");

    if (value.startsWith("+")) {

        // + becomes -

        input.value = "-" + number;

    } else if (value.startsWith("-")) {

        // - becomes +

        input.value = "+" + number;

    } else {

        // No sign becomes +

        input.value = "+" + number;

    }

    input.focus();

    input.dispatchEvent(new Event("input", { bubbles: true }));

};
loadData();
window.openNewCustomer = openNewCustomer;
window.goHome = goHome;
window.showCustomer = showCustomer;
window.saveCustomer = saveCustomer;
window.newPrescription = newPrescription;
window.savePrescription = savePrescription;
window.showSettings = showSettings;
window.printCurrentPrescription = printCurrentPrescription;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;

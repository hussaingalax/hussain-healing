// =========================================
// MAHASHAKTHI HEALING - ADMIN DASHBOARD
// =========================================

// Supabase client is loaded from supabase.js
// and available as: db


// =========================================
// DOM ELEMENTS
// =========================================

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const emptyState = document.getElementById("emptyState");
const tableContainer = document.getElementById("tableContainer");
const bookingsTableBody = document.getElementById("bookingsTableBody");

const totalBookings = document.getElementById("totalBookings");
const newBookings = document.getElementById("newBookings");
const pendingPayments = document.getElementById("pendingPayments");
const confirmedBookings = document.getElementById("confirmedBookings");

const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const welcomeText = document.getElementById("welcomeText");

const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");

const bookingModal = document.getElementById("bookingModal");
const modalOverlay = document.getElementById("modalOverlay");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalCloseBtn = document.getElementById("modalCloseBtn");

const modalBookingRef = document.getElementById("modalBookingRef");
const bookingDetails = document.getElementById("bookingDetails");


// =========================================
// GLOBAL DATA
// =========================================

let currentAdmin = null;
let bookings = [];


// =========================================
// INITIALIZE
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

    await initializeDashboard();

});


// =========================================
// INITIALIZE DASHBOARD
// =========================================

async function initializeDashboard() {

    try {

        const {
            data: { session },
            error: sessionError
        } = await db.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        // No login session
        if (!session || !session.user) {

            window.location.href = "admin.html";
            return;
        }


        // Check admin authorization
        const {
            data: adminUser,
            error: adminError
        } = await db
            .from("admin_users")
            .select(
                "id, name, email, role, status, auth_user_id"
            )
            .eq("auth_user_id", session.user.id)
            .eq("status", true)
            .maybeSingle();

        if (adminError) {
            throw adminError;
        }


        // User is not an admin
        if (!adminUser) {

            await db.auth.signOut();

            window.location.href = "admin.html";
            return;
        }


        // Check role
        if (
            adminUser.role !== "admin" &&
            adminUser.role !== "super_admin"
        ) {

            await db.auth.signOut();

            window.location.href = "admin.html";
            return;
        }


        // Save admin information
        currentAdmin = adminUser;


        // Display admin information
        displayAdminInfo();


        // Load bookings
        await loadBookings();

    } catch (error) {

        console.error(
            "Dashboard initialization error:",
            error
        );

        showError(
            error.message ||
            "Unable to load admin dashboard."
        );
    }
}


// =========================================
// DISPLAY ADMIN INFO
// =========================================

function displayAdminInfo() {

    if (!currentAdmin) {
        return;
    }

    const name =
        currentAdmin.name ||
        currentAdmin.email ||
        "Admin";

    adminName.textContent = name;

    adminRole.textContent =
        currentAdmin.role === "super_admin"
            ? "Super Admin"
            : "Admin";

    welcomeText.textContent =
        `Welcome back, ${name}`;
}


// =========================================
// LOAD BOOKINGS
// =========================================

async function loadBookings() {

    showLoading();

    try {

        const {
            data,
            error
        } = await db
            .from("bookings")
            .select(`
                id,
                healer_id,
                customer_name,
                mobile,
                email,
                booking_date,
                booking_time,
                status,
                payment_status,
                city,
                problem,
                session_type,
                amount,
                transaction_id,
                booking_ref,
                created_at
            `)
            .order("created_at", {
                ascending: false
            });

        if (error) {
            throw error;
        }


        bookings = data || [];


        updateSummaryCards();

        renderBookings();

    } catch (error) {

        console.error(
            "Bookings loading error:",
            error
        );

        showError(
            error.message ||
            "Unable to load bookings."
        );
    }
}


// =========================================
// UPDATE SUMMARY CARDS
// =========================================

function updateSummaryCards() {

    const total = bookings.length;

    const newCount = bookings.filter(
        booking =>
            normalizeStatus(booking.status) === "new"
    ).length;

    const pendingCount = bookings.filter(
        booking =>
            normalizeStatus(booking.payment_status) === "pending"
    ).length;

    const confirmedCount = bookings.filter(
        booking =>
            normalizeStatus(booking.status) === "confirmed"
    ).length;


    totalBookings.textContent = total;

    newBookings.textContent = newCount;

    pendingPayments.textContent = pendingCount;

    confirmedBookings.textContent = confirmedCount;
}


// =========================================
// RENDER BOOKINGS
// =========================================

function renderBookings() {

    loadingState.style.display = "none";
    errorState.style.display = "none";

    bookingsTableBody.innerHTML = "";


    if (bookings.length === 0) {

        tableContainer.style.display = "none";
        emptyState.style.display = "block";

        return;
    }


    emptyState.style.display = "none";
    tableContainer.style.display = "block";


    bookings.forEach((booking, index) => {

        const row = document.createElement("tr");


        // Booking reference
        const bookingRef =
            booking.booking_ref ||
            shortId(booking.id);


        // Customer
        const customerName =
            booking.customer_name ||
            "—";

        const mobile =
            booking.mobile ||
            "—";


        // Date / time
        const date =
            booking.booking_date ||
            "—";

        const time =
            booking.booking_time ||
            "—";


        // Session
        const session =
            booking.session_type ||
            "—";


        // Amount
        const amount =
            booking.amount !== null &&
            booking.amount !== undefined
                ? `₹${booking.amount}`
                : "—";


        // Payment
        const paymentStatus =
            booking.payment_status ||
            "Pending";


        // Booking status
        const bookingStatus =
            booking.status ||
            "New";


        row.innerHTML = `
            <td>
                <span class="booking-ref">
                    ${escapeHtml(bookingRef)}
                </span>
            </td>

            <td>
                <span class="customer-name">
                    ${escapeHtml(customerName)}
                </span>

                <span class="customer-mobile">
                    ${escapeHtml(mobile)}
                </span>
            </td>

            <td>
                <span class="date-value">
                    ${escapeHtml(formatDate(date))}
                </span>

                <span class="time-value">
                    ${escapeHtml(time)}
                </span>
            </td>

            <td>
                ${escapeHtml(session)}
            </td>

            <td>
                <strong>
                    ${escapeHtml(amount)}
                </strong>
            </td>

            <td>
                ${createPaymentBadge(paymentStatus)}
            </td>

            <td>
                ${createStatusBadge(bookingStatus)}
            </td>

            <td>
                <button
                    type="button"
                    class="view-btn"
                    data-index="${index}"
                >
                    View
                </button>
            </td>
        `;


        bookingsTableBody.appendChild(row);
    });


    // Attach View button events
    document
        .querySelectorAll(".view-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(button.dataset.index);

                    openBookingModal(
                        bookings[index]
                    );
                }
            );
        });
}


// =========================================
// PAYMENT BADGE
// =========================================

function createPaymentBadge(status) {

    const normalized =
        normalizeStatus(status);


    let className =
        "payment-pending";


    if (
        normalized === "submitted" ||
        normalized === "payment submitted"
    ) {

        className =
            "payment-submitted";

    } else if (
        normalized === "completed" ||
        normalized === "paid" ||
        normalized === "verified"
    ) {

        className =
            "payment-completed";
    }


    return `
        <span class="status-badge ${className}">
            ${escapeHtml(status || "Pending")}
        </span>
    `;
}


// =========================================
// BOOKING STATUS BADGE
// =========================================

function createStatusBadge(status) {

    const normalized =
        normalizeStatus(status);


    let className =
        "status-new";


    if (normalized === "confirmed") {

        className =
            "status-confirmed";

    } else if (normalized === "completed") {

        className =
            "status-completed";

    } else if (
        normalized === "cancelled" ||
        normalized === "canceled"
    ) {

        className =
            "status-cancelled";
    }


    return `
        <span class="status-badge ${className}">
            ${escapeHtml(status || "New")}
        </span>
    `;
}


// =========================================
// OPEN BOOKING MODAL
// =========================================

function openBookingModal(booking) {

    if (!booking) {
        return;
    }

    modalBookingRef.textContent =
        booking.booking_ref ||
        shortId(booking.id);

    bookingDetails.innerHTML = `

        ${detailRow(
            "Booking ID",
            booking.booking_ref ||
            shortId(booking.id)
        )}

        ${detailRow(
            "Customer Name",
            booking.customer_name
        )}

        ${detailRow(
            "Mobile",
            booking.mobile
        )}

        ${detailRow(
            "Email",
            booking.email
        )}

        ${detailRow(
            "City",
            booking.city
        )}

        ${detailRow(
            "Problem",
            booking.problem
        )}

        ${detailRow(
            "Booking Date",
            formatDate(booking.booking_date)
        )}

        ${detailRow(
            "Booking Time",
            booking.booking_time
        )}

        ${detailRow(
            "Session Type",
            booking.session_type
        )}

        ${detailRow(
            "Amount",
            booking.amount !== null &&
            booking.amount !== undefined
                ? `₹${booking.amount}`
                : "—"
        )}

        ${detailRow(
            "Transaction ID",
            booking.transaction_id
        )}

        ${detailRow(
            "Payment Status",
            booking.payment_status
        )}

        ${detailRow(
            "Booking Status",
            booking.status
        )}

        ${detailRow(
            "Created At",
            formatDateTime(booking.created_at)
        )}

        <div style="
            margin-top: 20px;
            padding-top: 18px;
            border-top: 1px solid #e5e7eb;
        ">

            <div style="
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 12px;
                color: #374151;
            ">
                Admin Actions
            </div>

            <div style="
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            ">

                ${
                    booking.payment_status === "Pending"
                        ? `
                            <button
                                type="button"
                                onclick="confirmPayment('${booking.id}')"
                                style="
                                    padding: 10px 16px;
                                    border: none;
                                    border-radius: 8px;
                                    background: #16a34a;
                                    color: white;
                                    font-size: 14px;
                                    font-weight: 600;
                                    cursor: pointer;
                                "
                            >
                                Confirm Payment
                            </button>
                          `
                        : ""
                }

                ${
                    booking.status === "New"
                        ? `
                            <button
                                type="button"
                                onclick="confirmAppointment('${booking.id}')"
                                style="
                                    padding: 10px 16px;
                                    border: none;
                                    border-radius: 8px;
                                    background: #2563eb;
                                    color: white;
                                    font-size: 14px;
                                    font-weight: 600;
                                    cursor: pointer;
                                "
                            >
                                Confirm Appointment
                            </button>
                          `
                        : ""
                }

            </div>

        </div>

    `;

    bookingModal.style.display = "block";

    document.body.style.overflow = "hidden";
}

// =========================================
// CONFIRM PAYMENT
// =========================================

async function confirmPayment(bookingId) {

    if (!bookingId) {
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to confirm this payment?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const { data, error } = await db
            .from("bookings")
            .update({
                payment_status: "Confirmed"
            })
            .eq("id", bookingId)
            .select()
            .single();

        if (error) {
            console.error("Payment update error:", error);
            alert("Failed to confirm payment.");
            return;
        }

        alert("Payment confirmed successfully.");

        openBookingModal(data);

    } catch (error) {

        console.error("Payment confirmation error:", error);
        alert("Something went wrong while confirming payment.");

    }
}


// =========================================
// CONFIRM APPOINTMENT
// =========================================

async function confirmAppointment(bookingId) {

    if (!bookingId) {
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to confirm this appointment?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const { data, error } = await db
            .from("bookings")
            .update({
                status: "Confirmed"
            })
            .eq("id", bookingId)
            .select()
            .single();

        if (error) {
            console.error("Appointment update error:", error);
            alert("Failed to confirm appointment.");
            return;
        }

        alert("Appointment confirmed successfully.");

        openBookingModal(data);

    } catch (error) {

        console.error("Appointment confirmation error:", error);
        alert("Something went wrong while confirming appointment.");

    }
}

// =========================================
// DETAIL ROW
// =========================================

function detailRow(label, value) {

    return `
        <div class="detail-row">

            <span class="detail-label">
                ${escapeHtml(label)}
            </span>

            <span class="detail-value">
                ${escapeHtml(
                    value !== null &&
                    value !== undefined &&
                    value !== ""
                        ? String(value)
                        : "—"
                )}
            </span>

        </div>
    `;
}


// =========================================
// CLOSE MODAL
// =========================================

function closeBookingModal() {

    bookingModal.style.display = "none";

    document.body.style.overflow = "";
}


closeModalBtn.addEventListener(
    "click",
    closeBookingModal
);


modalCloseBtn.addEventListener(
    "click",
    closeBookingModal
);


modalOverlay.addEventListener(
    "click",
    closeBookingModal
);


// =========================================
// REFRESH
// =========================================

refreshBtn.addEventListener(
    "click",
    async () => {

        await loadBookings();

    }
);


// =========================================
// LOGOUT
// =========================================

logoutBtn.addEventListener(
    "click",
    async () => {

        logoutBtn.disabled = true;

        try {

            await db.auth.signOut();

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        } finally {

            window.location.href =
                "admin.html";
        }
    }
);


// =========================================
// UI STATES
// =========================================

function showLoading() {

    loadingState.style.display = "block";

    errorState.style.display = "none";

    emptyState.style.display = "none";

    tableContainer.style.display = "none";
}


function showError(message) {

    loadingState.style.display = "none";

    emptyState.style.display = "none";

    tableContainer.style.display = "none";

    errorState.style.display = "block";

    errorState.textContent = message;
}


// =========================================
// HELPERS
// =========================================

function normalizeStatus(value) {

    return String(value || "")
        .trim()
        .toLowerCase();
}


function formatDate(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
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


function formatDateTime(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function shortId(value) {

    if (!value) {
        return "—";
    }

    return String(value).substring(0, 8);
}


function escapeHtml(value) {

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

// =========================================
// PAYMENTS SECTION
// =========================================

let paymentsData = [];


// -----------------------------------------
// OPEN PAYMENTS SECTION
// -----------------------------------------

async function openPaymentsSection() {

    const sections =
        document.querySelectorAll(".bookings-section");

    const bookingsSection = sections[0];

    const paymentsSection =
        document.getElementById("paymentsSection");

    const bookingsNav =
        document.getElementById("bookingsNav");

    const paymentsNav =
        document.getElementById("paymentsNav");

    if (!paymentsSection) {
        console.error("Payments section not found.");
        return;
    }

    // Hide bookings
    if (bookingsSection) {
        bookingsSection.style.display = "none";
    }

    // Show payments
    paymentsSection.style.display = "block";

    // Navigation active state
    if (bookingsNav) {
        bookingsNav.classList.remove("active");
    }

    if (paymentsNav) {
        paymentsNav.classList.add("active");
    }

// Hide Booking summary cards on Payments page
const mainSummaryGrid =
    document.querySelector(".main-content > .summary-grid");

if (mainSummaryGrid) {
    mainSummaryGrid.style.display = "none";
}
    
    // Change page heading
    const pageTitle =
        document.querySelector(".top-header h1");

    const welcomeText =
        document.getElementById("welcomeText");

    if (pageTitle) {
        pageTitle.textContent = "Payments";
    }

    if (welcomeText) {
        welcomeText.textContent =
            "Manage and verify customer payments";
    }

    // Load payment records
    await loadPayments();
}


// -----------------------------------------
// OPEN BOOKINGS SECTION
// -----------------------------------------

function openBookingsSection() {

// Show Booking summary cards on Bookings page
const mainSummaryGrid =
    document.querySelector(".main-content > .summary-grid");

if (mainSummaryGrid) {
    mainSummaryGrid.style.display = "grid";
}
    
    const sections =
        document.querySelectorAll(".bookings-section");

    const bookingsSection = sections[0];

    const paymentsSection =
        document.getElementById("paymentsSection");

    const bookingsNav =
        document.getElementById("bookingsNav");

    const paymentsNav =
        document.getElementById("paymentsNav");

    if (bookingsSection) {
        bookingsSection.style.display = "block";
    }

    if (paymentsSection) {
        paymentsSection.style.display = "none";
    }

    if (bookingsNav) {
        bookingsNav.classList.add("active");
    }

    if (paymentsNav) {
        paymentsNav.classList.remove("active");
    }

    const pageTitle =
        document.querySelector(".top-header h1");

    const welcomeText =
        document.getElementById("welcomeText");

    if (pageTitle) {
        pageTitle.textContent = "Bookings";
    }

    if (welcomeText) {
        welcomeText.textContent =
            "Welcome to MahaShakthi Healing Admin";
    }
}


// -----------------------------------------
// LOAD PAYMENTS
// -----------------------------------------

async function loadPayments() {

    const loadingState =
        document.getElementById("paymentsLoadingState");

    const errorState =
        document.getElementById("paymentsErrorState");

    const emptyState =
        document.getElementById("paymentsEmptyState");

    const tableContainer =
        document.getElementById("paymentsTableContainer");

    const tableBody =
        document.getElementById("paymentsTableBody");

    if (!tableBody) {
        console.error("Payments table body not found.");
        return;
    }

    // Reset states
    if (loadingState) {
        loadingState.style.display = "block";
    }

    if (errorState) {
        errorState.style.display = "none";
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    if (tableContainer) {
        tableContainer.style.display = "none";
    }

    try {

        const { data, error } = await db
            .from("bookings")
            .select("*")
            .order("created_at", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        paymentsData = data || [];

        renderPaymentSummary(paymentsData);

        renderPaymentsTable(paymentsData);

        if (loadingState) {
            loadingState.style.display = "none";
        }

        if (!paymentsData.length) {

            if (emptyState) {
                emptyState.style.display = "block";
            }

            return;
        }

        if (tableContainer) {
            tableContainer.style.display = "block";
        }

    } catch (error) {

        console.error(
            "Payments loading error:",
            error
        );

        if (loadingState) {
            loadingState.style.display = "none";
        }

        if (errorState) {
            errorState.textContent =
                "Failed to load payments. Please try again.";

            errorState.style.display = "block";
        }
    }
}


// -----------------------------------------
// PAYMENT SUMMARY
// -----------------------------------------

function renderPaymentSummary(data) {

    const totalPayments =
        document.getElementById("totalPayments");

    const paymentsPending =
        document.getElementById("paymentsPending");

    const paymentsConfirmed =
        document.getElementById("paymentsConfirmed");

    const totalPaymentAmount =
        document.getElementById("totalPaymentAmount");


    const total =
        data.length;


    const pending =
        data.filter(
            booking =>
                normalizeStatus(
                    booking.payment_status
                ) === "pending"
        ).length;


    const confirmed =
        data.filter(
            booking =>
                normalizeStatus(
                    booking.payment_status
                ) === "confirmed"
        ).length;


    const totalAmount =
        data.reduce(
            (sum, booking) => {

                const amount =
                    Number(booking.amount) || 0;

                return sum + amount;

            },
            0
        );


    if (totalPayments) {
        totalPayments.textContent = total;
    }

    if (paymentsPending) {
        paymentsPending.textContent = pending;
    }

    if (paymentsConfirmed) {
        paymentsConfirmed.textContent = confirmed;
    }

    if (totalPaymentAmount) {
        totalPaymentAmount.textContent =
            `₹${totalAmount.toLocaleString("en-IN")}`;
    }
}


// -----------------------------------------
// RENDER PAYMENTS TABLE
// -----------------------------------------

function renderPaymentsTable(data) {

    const tableBody =
        document.getElementById("paymentsTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";


    data.forEach(booking => {

        const bookingRef =
            booking.booking_ref ||
            shortId(booking.id);


        const customerName =
            booking.customer_name ||
            "—";


        const mobile =
            booking.mobile ||
            "";


        const transactionId =
            booking.transaction_id ||
            "—";


        const amount =
            booking.amount !== null &&
            booking.amount !== undefined
                ? `₹${booking.amount}`
                : "—";


        const paymentStatus =
            booking.payment_status ||
            "Pending";


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    ${escapeHtml(bookingRef)}
                </strong>
            </td>

            <td>
                <strong>
                    ${escapeHtml(customerName)}
                </strong>

                <small style="
                    display:block;
                    margin-top:3px;
                    color:#777;
                ">
                    ${escapeHtml(mobile)}
                </small>
            </td>

            <td>
                ${escapeHtml(transactionId)}
            </td>

            <td>
                ${formatDate(booking.booking_date)}
            </td>

            <td>
                ${escapeHtml(
                    booking.session_type || "—"
                )}
            </td>

            <td>
                ${amount}
            </td>

            <td>
                ${createPaymentBadge(paymentStatus)}
            </td>

            <td>

    ${
        normalizeStatus(paymentStatus) === "pending"
            ? `
                <button
                    type="button"
                    class="view-btn"
                    onclick="confirmPayment('${booking.id}')"
                >
                    Confirm Payment
                </button>
              `
            : `
                <span style="
                    color: #16a34a;
                    font-weight: 600;
                    font-size: 13px;
                ">
                    ✓ Confirmed
                </span>
              `
    }

</td>
        `;


        tableBody.appendChild(row);

    });
}


// -----------------------------------------
// OPEN PAYMENT BOOKING
// -----------------------------------------

function openPaymentBooking(bookingId) {

    const booking =
        paymentsData.find(
            item => item.id === bookingId
        );

    if (!booking) {

        console.error(
            "Payment booking not found:",
            bookingId
        );

        return;
    }

    openBookingModal(booking);
}


// -----------------------------------------
// NAVIGATION EVENTS
// -----------------------------------------

const paymentsNav =
    document.getElementById("paymentsNav");

const bookingsNav =
    document.getElementById("bookingsNav");

const refreshPaymentsBtn =
    document.getElementById("refreshPaymentsBtn");


if (paymentsNav) {

    paymentsNav.addEventListener(
        "click",
        openPaymentsSection
    );

}


if (bookingsNav) {

    bookingsNav.addEventListener(
        "click",
        openBookingsSection
    );

}


if (refreshPaymentsBtn) {

    refreshPaymentsBtn.addEventListener(
        "click",
        loadPayments
    );

}

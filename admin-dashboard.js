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

    `;


    bookingModal.style.display = "block";

    document.body.style.overflow = "hidden";
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

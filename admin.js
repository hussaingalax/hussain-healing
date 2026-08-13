// =========================================
// MAHASHAKTHI HEALING - ADMIN LOGIN
// =========================================

// Supabase client is already created in supabase.js
// as: db

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");


// =========================================
// LOGIN
// =========================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showMessage("Please enter email and password.", true);
        return;
    }

    setLoading(true);
    showMessage("");

    try {

        // Supabase Authentication
        const { data, error } = await db.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        if (!data.user) {
            throw new Error("Login failed. User not found.");
        }

        // Check admin_users table
        const { data: adminUser, error: adminError } = await db
            .from("admin_users")
            .select("id, name, email, role, status, auth_user_id")
            .eq("auth_user_id", data.user.id)
            .eq("status", true)
            .maybeSingle();

        if (adminError) {
            throw adminError;
        }

        if (!adminUser) {

            await db.auth.signOut();

            throw new Error(
                "You are not authorized to access the admin panel."
            );
        }

        // Check role
        if (
            adminUser.role !== "admin" &&
            adminUser.role !== "super_admin"
        ) {

            await db.auth.signOut();

            throw new Error(
                "You do not have permission to access the admin panel."
            );
        }

        showMessage("Login successful. Opening dashboard...");

        // Dashboard will be created next
        setTimeout(() => {
            window.location.href = "admin-dashboard.html";
        }, 700);

    } catch (error) {

        console.error("Admin login error:", error);

        showMessage(
            error.message || "Unable to login. Please try again.",
            true
        );

    } finally {

        setLoading(false);
    }
});


// =========================================
// CHECK EXISTING SESSION
// =========================================

async function checkExistingSession() {

    try {

        const {
            data: { session }
        } = await db.auth.getSession();

        if (!session || !session.user) {
            return;
        }

        const { data: adminUser, error } = await db
            .from("admin_users")
            .select("id, name, email, role, status")
            .eq("auth_user_id", session.user.id)
            .eq("status", true)
            .maybeSingle();

        if (error || !adminUser) {
            await db.auth.signOut();
            return;
        }

        if (
            adminUser.role === "admin" ||
            adminUser.role === "super_admin"
        ) {

            window.location.href = "admin-dashboard.html";
        }

    } catch (error) {

        console.error(
            "Session check error:",
            error
        );

    }
}


// =========================================
// UI HELPERS
// =========================================

function showMessage(message, isError = false) {

    loginMessage.textContent = message;

    if (isError) {
        loginMessage.style.color = "#d93025";
    } else {
        loginMessage.style.color = "#188038";
    }
}


function setLoading(isLoading) {

    loginBtn.disabled = isLoading;

    if (isLoading) {

        loginBtn.textContent = "Logging in...";

    } else {

        loginBtn.textContent = "Login";

    }
}


// =========================================
// START
// =========================================

checkExistingSession();

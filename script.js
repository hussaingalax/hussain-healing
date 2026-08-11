async function loadHealer() {

    const hostname = window.location.hostname;

    const slug = hostname.split(".")[0];

    console.log("Slug:", slug);

    const { data, error } = await db
        .from("healers")
        .select("*")
        .eq("slug", slug)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    console.log(data);

    // Hero Details
document.getElementById("healer-name").textContent = data.name;

document.getElementById("experience").textContent = data.experience;

document.getElementById("languages").textContent = data.languages;

document.getElementById("hero-title").innerHTML = data.hero_title;

document.getElementById("hero-subtitle").textContent = data.hero_subtitle;

// Photo
if (data.photo_url) {
    document.getElementById("healer-photo").src = data.photo_url;
}

// WhatsApp Link
const message = encodeURIComponent(
    "வணக்கம். Website மூலம் வந்தேன். எனக்கு இலவச ஆரம்ப ஆலோசனை வேண்டும்."
);

const waLink =
`https://wa.me/91${data.whatsapp}?text=${message}`;

document.getElementById("whatsapp-btn").href = waLink;
document.getElementById("floating-whatsapp").href = waLink;
document.getElementById("footer-whatsapp").href = waLink;
    
}

loadHealer();
// ==========================
// Global Booking Variables
// ==========================

let bookingData = {
    healer: null,
    session: "",
    amount: 0,
    customerName: "",
    mobile: "",
    city: "",
    problem: "",
    bookingId: null
};

// ===========================
// Simple Booking Reference
// ===========================

function generateBookingRef(){

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let ref = "MH";

    for(let i = 0; i < 6; i++){

        ref += chars.charAt(
            Math.floor(Math.random() * chars.length)
        );

    }

    return ref;
}

console.log("Booking Popup JS Loaded");

// Booking Popup

const modal = document.getElementById("booking-modal");

// Booking Popup

document.querySelectorAll(".booking-btn").forEach(function(btn){

    btn.addEventListener("click", function(e){

        e.preventDefault();

        modal.style.display = "block";

    });

});

document.getElementById("close-modal").onclick = function(){

    modal.style.display = "none";

};

// Close Booking Modal

window.onclick = function(e){

    if(e.target == modal){

        modal.style.display = "none";

    }

};

// =======================
// Session Modal
// =======================

const sessionModal = document.getElementById("session-modal");

document.getElementById("close-session-modal").onclick = function(){

    sessionModal.style.display = "none";

};

// =======================
// Payment Modal
// =======================

const paymentModal = document.getElementById("payment-modal");

document.getElementById("online-session").onclick = function(){

    bookingData.session = "Online";
    bookingData.amount = 299;

    document.getElementById("selected-session").innerText =
    "🟢 Online Session";

    document.getElementById("payment-amount").innerText =
    "₹299";

    sessionModal.style.display = "none";

    paymentModal.style.display = "block";

    loadAvailableSlots();

};
document.getElementById("direct-session").onclick = function(){

    bookingData.session = "Direct";
    bookingData.amount = 799;

    document.getElementById("selected-session").innerText =
    "⭐ Direct Session";

    document.getElementById("payment-amount").innerText =
    "₹799";

    sessionModal.style.display = "none";

    paymentModal.style.display = "block";

    loadAvailableSlots();

};
document.getElementById("close-payment").onclick = function(){

    paymentModal.style.display = "none";

};
// ==========================
// Booking Form
// ==========================

document.getElementById("booking-form").addEventListener("submit", async function(e){

    e.preventDefault();

    bookingData.customerName =
        document.getElementById("customer-name").value;

    bookingData.mobile =
        document.getElementById("customer-mobile").value;

    bookingData.city =
        document.getElementById("customer-city").value;

    bookingData.problem =
        document.getElementById("customer-problem").value;

    const { data: healer } = await db
        .from("healers")
        .select("*")
        .eq("slug", window.location.hostname.split(".")[0])
        .single();

    bookingData.healer = healer;

    modal.style.display = "none";

    sessionModal.style.display = "block";

});

// ===========================
// Load Available Slots
// ===========================

async function loadAvailableSlots(){

    const dateSelect = document.getElementById("booking-date");
    const timeSelect = document.getElementById("booking-time");

    dateSelect.innerHTML =
        '<option value="">தேதி தேர்வு செய்யுங்கள்</option>';

    timeSelect.innerHTML =
        '<option value="">நேரம் தேர்வு செய்யுங்கள்</option>';

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const todayString = `${year}-${month}-${day}`;

    console.log("Today:", todayString);

    const { data: slots, error } = await db
        .from("slots")
        .select("*")
        .eq("healer_id", bookingData.healer.id)
        .eq("status", "Available")
        .gte("slot_date", todayString)
        .order("slot_date", { ascending: true })
        .order("slot_time", { ascending: true });

    if(error){

        console.error("Slot Error:", error);

        return;
    }

    console.log("Available Future Slots:", slots);

    if(!slots || slots.length === 0){

        dateSelect.innerHTML =
            '<option value="">தற்போது slots இல்லை</option>';

        return;
    }

    // Unique dates
    const dates = [
        ...new Set(
            slots.map(slot => slot.slot_date)
        )
    ];

    dates.forEach(date => {

        const option = document.createElement("option");

        option.value = date;
        option.textContent = date;

        dateSelect.appendChild(option);

    });

    // First available date
    dateSelect.value = dates[0];

    loadTimesForDate(dates[0], slots);

    dateSelect.onchange = function(){

        loadTimesForDate(
            this.value,
            slots
        );

    };

}

function loadTimesForDate(date, slots){

    const timeSelect =
        document.getElementById("booking-time");

    timeSelect.innerHTML =
        '<option value="">நேரம் தேர்வு செய்யுங்கள்</option>';

    const selectedSlots =
        slots.filter(slot =>
            slot.slot_date === date
        );

    selectedSlots.forEach(slot => {

        const option =
            document.createElement("option");

        option.value = slot.slot_time;

        option.textContent = slot.slot_time;

        timeSelect.appendChild(option);

    });

}

// ===========================
// Payment Submit
// ===========================

document.getElementById("payment-submit").onclick = async function () {

    const bookingDate =
        document.getElementById("booking-date").value;

    const bookingTime =
        document.getElementById("booking-time").value;

    if(!bookingDate){

        alert("Appointment Date தேர்வு செய்யுங்கள்");
        return;

    }

    if(!bookingTime){

        alert("Appointment Time தேர்வு செய்யுங்கள்");
        return;

    }

    const transactionId =
        document.getElementById("transaction-id").value;

    const image =
        document.getElementById("payment-image").files[0];

    const bookingRef = generateBookingRef();
    const { data: booking } = await db
        .from("bookings")
        .insert([{

            booking_ref: bookingRef,
            healer_id: bookingData.healer.id,
            customer_name: bookingData.customerName,
            mobile: bookingData.mobile,
            city: bookingData.city,
            problem: bookingData.problem,
            booking_date: bookingDate,
            booking_time: bookingTime,
            status: "New",
            payment_status: "Pending"
            session_type: bookingData.session,
            amount: bookingData.amount,
            transaction_id: transactionId,
        }])
        .select()
        .single();

if(bookingError){

    console.error("Booking Save Error:", bookingError);

    alert("Booking save ஆகவில்லை. தயவுசெய்து மீண்டும் முயற்சி செய்யுங்கள்.");

    return;
}
        

bookingData.bookingId = booking.id;

    const message =
`Payment Submitted

Booking ID : ${bookingRef}

Name : ${bookingData.customerName}

Mobile : ${bookingData.mobile}

Session : ${bookingData.session}

Amount : ₹${bookingData.amount}

Date : ${bookingDate}

Time : ${bookingTime}

Transaction ID : ${transactionId || "Not Entered"}

Payment details submitted successfully.
Please verify and confirm the appointment.`;

    window.open(
`https://wa.me/91${bookingData.healer.whatsapp}?text=${encodeURIComponent(message)}`,
"_blank"
    );

    alert("Details submitted successfully!");

    paymentModal.style.display = "none";

};

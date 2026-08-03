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

    const { data, error } = await db
        .from("slots")
        .select("*")
        .eq("healer_id", bookingData.healer.id)
        .eq("status","Available")
        .order("slot_date")
        .order("slot_time");

    if(error){
        console.error(error);
        return;
    }

    const dateSelect =
        document.getElementById("booking-date");

    const timeSelect =
        document.getElementById("booking-time");

    dateSelect.innerHTML =
        '<option value="">தேதி தேர்வு செய்யுங்கள்</option>';

    timeSelect.innerHTML =
        '<option value="">நேரம் தேர்வு செய்யுங்கள்</option>';

    const dates = [...new Set(data.map(x=>x.slot_date))];

    dates.forEach(date=>{

        dateSelect.innerHTML +=
        `<option value="${date}">${date}</option>`;

    });

    dateSelect.onchange=function(){

        timeSelect.innerHTML =
        '<option value="">நேரம் தேர்வு செய்யுங்கள்</option>';

        data
        .filter(x=>x.slot_date==this.value)
        .forEach(slot=>{

            timeSelect.innerHTML +=
            `<option value="${slot.slot_time}">
                ${slot.slot_time}
            </option>`;

        });

    };

}

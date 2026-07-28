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

window.onclick = function(e){
const sessionModal = document.getElementById("session-modal");

document.getElementById("close-session-modal").onclick=function(){

sessionModal.style.display="none";

};

document.getElementById("online-session").onclick=function(){

alert("Online Session Selected");

};

document.getElementById("direct-session").onclick=function(){

alert("Direct Session Selected");

};
    if(e.target == modal){

        modal.style.display = "none";

    }

};

// Booking Form Submit

document.getElementById("booking-form").addEventListener("submit", async function(e){
console.log("Booking Started");
    e.preventDefault();
console.log("Finding healer...");
    const { data: healer } = await db
        .from("healers")
        .select("id")
        .eq("slug", window.location.hostname.split(".")[0])
        .single();
console.log("Saving booking...");
    const { error } = await db
        .from("bookings")
        .insert([
            {
                healer_id: healer.id,
                customer_name: document.getElementById("customer-name").value,
                mobile: document.getElementById("customer-mobile").value,
                city: document.getElementById("customer-city").value,
                problem: document.getElementById("customer-problem").value,
                status: "New"
            }
        ]);

    if(error){

        console.error(error);
        alert("Booking failed!");

        return;
    }

 alert("Booking submitted successfully!");

// Form values
const customerName = document.getElementById("customer-name").value;
const mobile = document.getElementById("customer-mobile").value;
const city = document.getElementById("customer-city").value;

// Healer WhatsApp
const { data: healerData } = await db
    .from("healers")
    .select("whatsapp")
    .eq("id", healer.id)
    .single();

const message =
`வணக்கம்.

பெயர் : ${customerName}
மொபைல் : ${mobile}
ஊர் : ${city}

எனக்கு இலவச ஆரம்ப ஆலோசனை வேண்டும்.`;

window.open(
`https://wa.me/91${healerData.whatsapp}?text=${encodeURIComponent(message)}`,
"_blank"
);

modal.style.display = "none";

document.getElementById("booking-form").reset();

document.getElementById("session-modal").style.display = "block";

});

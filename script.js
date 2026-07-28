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

document.getElementById("whatsapp-btn").addEventListener("click", function(e){

    console.log("Hero button clicked");

    e.preventDefault();
    e.stopPropagation();

    modal.style.display = "block";

});
document.getElementById("close-modal").onclick=function(){

modal.style.display="none";

};

window.onclick=function(e){

if(e.target==modal){

modal.style.display="none";

}

};

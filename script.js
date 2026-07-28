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
    
}

loadHealer();

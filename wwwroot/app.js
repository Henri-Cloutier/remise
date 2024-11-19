const API_URL = "/api/posts";

// Fonction pour convertir une date en format français
function convertToFrenchDate(numeric_date) {
    const date = new Date(numeric_date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const opt_weekday = { weekday: 'long' };
    const weekday = toTitleCase(date.toLocaleDateString("fr-FR", opt_weekday));

    function toTitleCase(str) {
        return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
    return `${weekday} le ${date.toLocaleDateString("fr-FR", options)} @ ${date.toLocaleTimeString("fr-FR")}`;
}

// Fonction pour afficher les posts
async function loadPosts() {
    const response = await fetch(API_URL);
    if (!response.ok) return console.error("Failed to fetch posts");

    const posts = await response.json();
    const container = document.getElementById("posts-container");
    container.innerHTML = ""; // Effacer les posts existants

    posts.forEach(post => {
        const postElement = document.createElement("div");
        postElement.classList.add("post");

        postElement.innerHTML = `
            <img src="/images/posts/${post.Image}" alt="${post.Title}" class="post-image">
            <div class="post-details">
                <span class="post-category">${post.Category}</span>
                <h2 class="post-title">${post.Title}</h2>
                <p class="post-date">${convertToFrenchDate(post.Creation)}</p>
                <p class="post-text">${post.Text}</p>
            </div>
            <div class="post-actions">
                <i class="fas fa-edit edit-icon" title="Modifier"></i>
                <i class="fas fa-trash delete-icon" title="Supprimer"></i>
            </div>
        `;

        // Ajouter des événements sur les icônes
        postElement.querySelector(".edit-icon").addEventListener("click", () => editPost(post.Id));
        postElement.querySelector(".delete-icon").addEventListener("click", () => deletePost(post.Id));

        container.appendChild(postElement);
    });
}

// Fonction pour modifier un post
function editPost(postId) {
    console.log(`Editing post with ID: ${postId}`);
    // Ajoute ici la logique pour modifier un post
}

// Fonction pour supprimer un post
async function deletePost(postId) {
    if (confirm("Voulez-vous vraiment supprimer ce post ?")) {
        const response = await fetch(`${API_URL}/${postId}`, { method: "DELETE" });
        if (response.ok) loadPosts(); // Recharger les posts après suppression
    }
}

// Charger les posts à l'initialisation
document.addEventListener("DOMContentLoaded", loadPosts);

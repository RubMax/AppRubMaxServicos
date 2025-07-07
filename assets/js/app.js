// URL de votre Google Apps Script déployé
const API_URL = "https://script.google.com/macros/s/ID_DE_VOTRE_SCRIPT/exec";

// Charger les produits depuis Google Sheets
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}?page=data`);
        const products = await response.json();
        
        const container = document.getElementById("products-container");
        
        products.forEach(product => {
            container.innerHTML += `
                <div class="product-card">
                    <img src="${product.image}" alt="${product.nom}">
                    <h3>${product.nom}</h3>
                    <p>${product.description}</p>
                    <span class="price">${product.prix} €</span>
                </div>
            `;
        });
    } catch (error) {
        console.error("Erreur:", error);
    }
}

// Démarrer le chargement
document.addEventListener("DOMContentLoaded", loadProducts);
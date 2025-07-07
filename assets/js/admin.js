const API_URL = "https://script.google.com/macros/s/ID_DE_VOTRE_SCRIPT/exec";
let currentData = [];

// Charger les données
async function loadAdminData() {
    try {
        const response = await fetch(`${API_URL}?page=data`);
        currentData = await response.json();
        renderDataEditor(currentData);
    } catch (error) {
        alert("Erreur de chargement: " + error.message);
    }
}

// Afficher l'éditeur de données
function renderDataEditor(data) {
    const editor = document.getElementById("data-editor");
    editor.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Section</th>
                    <th>Nom</th>
                    <th>Image</th>
                    <th>Description</th>
                    <th>Prix</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(item => `
                    <tr>
                        <td><input value="${item.section}"></td>
                        <td><input value="${item.nom}"></td>
                        <td><input value="${item.image}"></td>
                        <td><textarea>${item.description}</textarea></td>
                        <td><input type="number" value="${item.prix.replace(',', '.')}"></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Enregistrer les modifications
async function saveData() {
    try {
        const rows = Array.from(document.querySelectorAll("#data-editor tbody tr"));
        const newData = rows.map(row => {
            const cells = row.querySelectorAll("input, textarea");
            return {
                section: cells[0].value,
                nom: cells[1].value,
                image: cells[2].value,
                description: cells[3].value,
                prix: cells[4].value
            };
        });

        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(newData)
        });

        if (response.ok) {
            alert("Données enregistrées avec succès !");
            loadAdminData();
        }
    } catch (error) {
        alert("Erreur d'enregistrement: " + error.message);
    }
}

// Événements
document.getElementById("load-data").addEventListener("click", loadAdminData);
document.getElementById("save-data").addEventListener("click", saveData);

// Vérifier l'accès admin
async function checkAdminAccess() {
    const userEmail = prompt("Veuillez entrer votre email administrateur:");
    if (userEmail !== "rubmaxben@gmail.com") {
        window.location.href = "/";
    }
}

checkAdminAccess();
// Variables globales
let currentProduct = {};
let pubItems = [];
let currentPubIndex = 0;
let pubTimeout;
let currentImageIndex = 0;
let imageUrls = [];

// Configuration Google Sheets
const SHEET_ID = '1YstBq1MQR76nW6GT0c9aYlpWuuc8JY4ZmrBee_KQEjg'; // À remplacer par votre ID Google Sheets
const SHEET_NAME = 'Produits'; // Nom de l'onglet

document.addEventListener('DOMContentLoaded', function() {
  // Charger les données depuis Google Sheets
  loadDataFromGoogleSheets();
  
  // Initialiser le défilement horizontal
  setupHorizontalDragScroll();
  
  // Initialiser l'écouteur de défilement pour la navigation
  window.addEventListener('scroll', handleScroll);
});

// URL de votre application Apps Script déployée
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyq6DeY_5IrYSCKpgt7wnMDA9UdeTok-0v5L67aJhCksyseOSMdYLde9OR3FZ2T2yAF/exec";

async function loadDataFromGoogleSheets() {
  try {
    const response = await fetch(`${WEB_APP_URL}?action=getData`);
    if (!response.ok) throw new Error("Erreur réseau");
    const data = await response.json();
    displayProduits(data);
  } catch (error) {
    console.error("Erreur de chargement des données:", error);
    document.getElementById("produits").innerHTML = 
      "<div class='alert alert-danger'>Erreur de chargement des données</div>";
  }
}

// Appeler cette fonction au chargement
document.addEventListener('DOMContentLoaded', function() {
  loadDataFromGoogleSheets();
  setupHorizontalDragScroll();
  window.addEventListener('scroll', handleScroll);
});

// Fonction pour parser le CSV
function parseCSV(csv) {
  const rows = csv.split('\n').filter(row => row.trim() !== '');
  const headers = rows[0].split(',').map(h => h.trim());
  
  const data = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < row.length; j++) {
      const char = row[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    
    const item = {};
    headers.forEach((header, index) => {
      item[header] = values[index] || '';
    });
    
    data.push(item);
  }
  
  return data;
}

function setupHorizontalDragScroll() {
  const container = document.getElementById('nav-container');
  const content = document.getElementById('section-nav');
  
  let pos = { left: 0, x: 0 };
  let isDragging = false;
  
  // Souris
  content.addEventListener('mousedown', function(e) {
    isDragging = true;
    pos = {
      left: container.scrollLeft,
      x: e.clientX
    };
    content.classList.add('grabbing');
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    const dx = e.clientX - pos.x;
    container.scrollLeft = pos.left - dx;
  });
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
    content.classList.remove('grabbing');
  });
  
  // Tactile
  content.addEventListener('touchstart', function(e) {
    isDragging = true;
    pos = {
      left: container.scrollLeft,
      x: e.touches[0].clientX
    };
    content.classList.add('grabbing');
  }, { passive: false });
  
  document.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - pos.x;
    container.scrollLeft = pos.left - dx;
    e.preventDefault();
  }, { passive: false });
  
  document.addEventListener('touchend', function() {
    isDragging = false;
    content.classList.remove('grabbing');
  });
}

function createSectionButtons(sections) {
  const navContainer = document.getElementById('section-nav');
  navContainer.innerHTML = '';
  
  sections.forEach(section => {
    const sectionId = generateSectionId(section);
    const button = document.createElement('a');
    button.href = `#${sectionId}`;
    button.textContent = section.toUpperCase();
    button.className = 'section-btn';
    
    button.addEventListener('click', function(e) {
      e.preventDefault();
      scrollToSection(sectionId);
    });
    
    navContainer.appendChild(button);
  });
}

function generateSectionId(sectionName) {
  return sectionName
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
} 

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    const headerHeight = document.querySelector('.fixed-header').offsetHeight;
    const sectionPosition = section.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = sectionPosition - headerHeight - 10;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
    
    // Mettre à jour le bouton actif
    document.querySelectorAll('.section-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`.section-btn[href="#${sectionId}"]`).classList.add('active');
    
    history.pushState(null, null, `#${sectionId}`);
  }
}

function handleScroll() {
  const sections = document.querySelectorAll('h2');
  const scrollPosition = window.scrollY + document.querySelector('.fixed-header').offsetHeight + 20;
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.id;
    
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      document.querySelectorAll('.section-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(`.section-btn[href="#${sectionId}"]`).classList.add('active');
    }
  });
}

function displayProduits(data) {
  const container = document.getElementById('produits');
  container.innerHTML = "";
  const sections = [...new Set(data.map(item => item.section))];

  // Filtrer les pubs valides
  pubItems = data.filter(item => item.pub && item.pub.trim() !== '');

  createSectionButtons(sections);

  sections.forEach(section => {
    const sectionId = generateSectionId(section);
    const h2 = document.createElement('h2');
    h2.textContent = section.toUpperCase();
    h2.id = sectionId;
    container.appendChild(h2);

    const sectionContainer = document.createElement('div');
    sectionContainer.className = "section-container";
    container.appendChild(sectionContainer);

    data
      .filter(p => p.section === section)
      .forEach(produit => {
        const div = document.createElement('div');
        div.className = "article produit-ligne";

        const descriptionHtml = produit.description.replace(/\n/g, '<br>');
        const descriptionParam = encodeURIComponent(produit.description);

        div.innerHTML = `
          <div class="article-image">
            <img src="${produit.image ? escapeHtml(produit.image) : 'https://iili.io/F3yIWCb.png'}" 
                 alt="${escapeHtml(produit.nom)}" 
                 onclick="showPopup('${escapeHtml(produit.image)}', '${escapeHtml(produit.nom)}', '${descriptionParam}', '${escapeHtml(produit.prix)}', '${escapeHtml(produit.tailles)}', '${escapeHtml(produit.code)}')">
          </div>
          <div class="article-details">
            <h3 style="text-transform: uppercase" onclick="showPopup('${escapeHtml(produit.image)}', '${escapeHtml(produit.nom)}', '${descriptionParam}', '${escapeHtml(produit.prix)}', '${escapeHtml(produit.tailles)}', '${escapeHtml(produit.code)}')">${escapeHtml(produit.nom)}</h3>

            <div class="details">
              ${produit.prix ? (() => {
                if (produit.prix.includes('-')) {
                  const [oldPrice, newPrice] = produit.prix.split('-').map(p => escapeHtml(p.trim()));
                  return `
                    <div class="price-container">
                      <span class="old-price">R$ ${oldPrice}</span>
                      <span class="new-price">R$ ${newPrice}</span>
                    </div>
                  `;
                }
                return `<p>R$ <strong>${escapeHtml(produit.prix)}</strong></p>`;
              })() : ''}

              ${(() => {
                let note = '';
                let taillesNettoyees = produit.tailles;

                // Extraire le texte entre parenthèses
                const match = produit.tailles.match(/\(([^)]+)\)/);
                if (match) {
                  note = match[1];
                  taillesNettoyees = produit.tailles.replace(/\([^)]*\)/g, '').trim();
                }

                // Séparer et formater les tailles avec encadrement
                const taillesArray = taillesNettoyees.split(',')
                  .map(t => t.trim())
                  .filter(t => t !== '');

                const taillesEncadrees = taillesArray.map(taille => 
                  `<span class="taille-encadree">${escapeHtml(taille)}</span>`
                ).join(' ');

                return `
                  ${note ? `<p class="note-text"><strong>${escapeHtml(note)}</strong></p>` : ''}
                  ${taillesArray.length > 0 ? `
                    <div class="tailles-container">
                      ${taillesEncadrees}
                    </div>
                  ` : ''}
                `;
              })()}
              <br>
              <button class="open-button" onclick="showPopup('${escapeHtml(produit.image)}', '${escapeHtml(produit.nom)}', '${descriptionParam}', '${escapeHtml(produit.prix)}', '${escapeHtml(produit.tailles)}', '${escapeHtml(produit.code)}')">Solicite/Realise</button>
              
              ${produit.description && produit.description.trim() !== '' ? `<h3><span class="description-link" onclick="event.stopPropagation(); showDescriptionPopup('${descriptionParam}')"><br>Saiba Mais</span></h3>` : ''}
            </div>
          </div>
        `;
        sectionContainer.appendChild(div);
      });
  });
}

function startPubCarousel() {
  if (pubItems.length === 0) return;
  
  currentPubIndex = 0;
  scheduleNextPub();
}

function scheduleNextPub() {
  clearTimeout(pubTimeout);
  
  const currentPub = pubItems[currentPubIndex];
  const delay = currentPub.pubInterval || 25000;
  
  pubTimeout = setTimeout(() => {
    showCurrentPub();
    currentPubIndex = (currentPubIndex + 1) % pubItems.length;
    scheduleNextPub();
  }, delay);
}

function showCurrentPub() {
  const currentPub = pubItems[currentPubIndex];
  const parts = currentPub.pub.split('|');
  
  const boldText = parts[0] ? parts[0].trim() : null;
  const imageUrl = parts[1] ? parts[1].trim() : null;
  const text = parts[2] ? parts[2].trim() : null;
  
  let htmlContent = '<div class="pub-header" style="color: #ff0000; font-weight: bold; font-size: 2rem; margin-bottom: 0.5rem; text-align: center;">ANÚNCIO</div>';
  
  if (boldText) {
    htmlContent += `<div class="pub-bold-text" style="font-weight: bold; font-size: 2rem; margin-bottom: 1rem;">
                    ${escapeHtml(boldText).replace(/\n/g, '<br>')}
                   </div>`;
  }
  
  if (imageUrl) {
    htmlContent += `<img src="${escapeHtml(imageUrl)}" class="pub-image" alt="Publicité">`;
  }
  
  if (text) {
    htmlContent += `<div class="pub-text">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
  }
  
  document.getElementById('pub-container').innerHTML = htmlContent;
  updatePubDots();
  document.getElementById('pub-popup').style.display = 'flex';
}

function updatePubDots() {
  const dotsContainer = document.getElementById('pub-dots');
  dotsContainer.innerHTML = '';
  
  pubItems.forEach((_, index) => {
    const dot = document.createElement('span');
    dot.className = `pub-dot ${index === currentPubIndex ? 'active' : ''}`;
    dot.onclick = () => {
      currentPubIndex = index;
      showCurrentPub();
      scheduleNextPub();
    };
    dotsContainer.appendChild(dot);
  });
}

function closePubPopup() {
  document.getElementById('pub-popup').style.display = 'none';
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showDescriptionPopup(encodedDescription) {
  const description = decodeURIComponent(encodedDescription).replace(/\n/g, '<br>');
  const descriptionContent = document.getElementById("description-content");
  descriptionContent.innerHTML = description;
  descriptionContent.style.fontSize = "50px";
  document.getElementById("description-popup").style.display = "flex";
  document.querySelector('.description-popup-close').style.fontSize = '40px';
}

function closeDescriptionPopup() {
  document.getElementById("description-popup").style.display = "none";
}

function showPopup(imageUrl, nom, description, prix, tailles, code, hideWhatsappButton = false) {
  imageUrls = imageUrl.split(',').map(url => url.trim());
  currentImageIndex = 0;
  document.getElementById("popup").style.display = "flex";

  const cleanedTailles = tailles.replace(/\([^)]*\)/g, '').trim();
  const sizesArray = cleanedTailles.split(',').map(size => size.trim()).filter(size => size !== '');
  const hasMultipleSizes = sizesArray.length > 1;

  currentProduct = {
    imageUrl,
    nom,
    description,
    prix,
    tailles,
    code,
    selectedSize: hasMultipleSizes ? null : sizesArray[0]
  };

  updateGallery();

  let sizesHTML = '';
  if (hasMultipleSizes) {
    sizesHTML = `
      <p></p>
      <div class="sizes-list" id="sizes-container">
        ${sizesArray.map(size => `
          <span class="size-item" onclick="selectSize(this, '${escapeHtml(size)}')">${escapeHtml(size)}</span>
        `).join('')}
      </div>
    `;
  } else if (sizesArray.length === 1) {
    sizesHTML = `<p><strong>${escapeHtml(sizesArray[0])}</strong></p>`;
  }

  document.getElementById("popup-details").innerHTML = `
    <h4>${escapeHtml(nom)}</h4>
    
    ${prix?.trim() ? (() => {
      if (prix.includes('-')) {
        const [oldPrice, newPrice] = prix.split('-').map(p => p.trim());
        return `
          <div class="price-highlight">
            <div class="dual-price-container">
              <div class="old-price">
                <span class="currency-symbol">R$</span>
                <span class="price-amount">${escapeHtml(oldPrice)}</span>
              </div>
              <div class="new-price">
                <span class="currency-symbol">R$</span>
                <span class="price-amount">${escapeHtml(newPrice)}</span>
              </div>
            </div>
          </div>
        `;
      }
      return `
        <div class="price-highlight">
          <span class="currency-symbol">R$</span>
          <span class="price-amount">${escapeHtml(prix)}</span>
        </div>
      `;
    })() : ''}
    
    <div>
      ${sizesHTML}
    </div>
    
    <div style="margin-top: 1.5rem;">
      <strong>Código:</strong> ${escapeHtml(code)}
    </div>

    <div style="margin-top: 1.4rem;">
      <strong>Solicite ou realize este serviço no Whatsapp:</strong>
    </div>

    <a href="#" id="whatsappButton" class="whatsapp-btn" onclick="event.preventDefault(); sendWhatsAppMessage();">
      <i class="fab fa-whatsapp"></i> WhatsApp
    </a>

    <div style="margin-top: 1.5rem;">
      <strong>Observe :</strong>
      <div class="description-text" style="font-size: 50px; line-height: 1.5; color: #0081fe;">
        ${decodeURIComponent(description).replace(/\n/g, '<br>')}
      </div>
    </div>
  `;

  const whatsappButton = document.getElementById("whatsappButton");
  if (hideWhatsappButton) {
    whatsappButton.style.display = "none";
  } else {
    whatsappButton.style.display = "inline-block";
  }

  if (!hasMultipleSizes && sizesArray.length === 1) {
    const sizeElements = document.querySelectorAll('.size-item');
    if (sizeElements.length > 0) {
      sizeElements[0].classList.add('selected');
    }
  }
}

function updateGallery() {
  const galleryImages = document.getElementById('gallery-images');
  const galleryDots = document.getElementById('gallery-dots');
  
  galleryImages.innerHTML = '';
  galleryDots.innerHTML = '';
  
  imageUrls.forEach((url, index) => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = currentProduct.nom;
    img.className = 'gallery-image';
    galleryImages.appendChild(img);
    
    const dot = document.createElement('span');
    dot.className = `gallery-dot ${index === currentImageIndex ? 'active' : ''}`;
    dot.onclick = () => goToImage(index);
    galleryDots.appendChild(dot);
  });
  
  galleryImages.style.transform = `translateX(-${currentImageIndex * 100}%)`;
}

function prevImage() {
  if (currentImageIndex > 0) {
    currentImageIndex--;
  } else {
    currentImageIndex = imageUrls.length - 1;
  }
  updateGallery();
}

function nextImage() {
  if (currentImageIndex < imageUrls.length - 1) {
    currentImageIndex++;
  } else {
    currentImageIndex = 0;
  }
  updateGallery();
}

function goToImage(index) {
  currentImageIndex = index;
  updateGallery();
}

document.getElementById('gallery-images').addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, {passive: true});

document.getElementById('gallery-images').addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}, {passive: true});

function handleSwipe() {
  const threshold = 50;
  if (touchStartX - touchEndX > threshold) {
    nextImage();
  } else if (touchEndX - touchStartX > threshold) {
    prevImage();
  }
}

function selectSize(element, size) {
  const sizeItems = document.querySelectorAll('.size-item');
  sizeItems.forEach(item => item.classList.remove('selected'));
  
  element.classList.add('selected');
  currentProduct.selectedSize = size;
  
  const sizesContainer = document.getElementById('sizes-container');
  if (sizesContainer) {
    sizesContainer.classList.remove('shake');
  }
}

function sendWhatsAppMessage() {
  const sizesArray = currentProduct.tailles.split(',').map(size => size.trim()).filter(size => size !== '');
  const hasMultipleSizes = sizesArray.length > 1;
  const sizesContainer = document.getElementById('sizes-container');

  if (hasMultipleSizes && !currentProduct.selectedSize) {
    sizesContainer.classList.add('shake');
    setTimeout(() => {
      sizesContainer.classList.remove('shake');
    }, 500);
    return;
  }

  let message = `Olá, Gostaria de solicitar, fazer ou saber mais sobre este produto: ${currentProduct.nom}\n` +
                `Codigo : ${currentProduct.code}\n` +
                `Preco : R$ ${currentProduct.prix}`;

  if (currentProduct.selectedSize) {
    message += `\nT/Desc : ${currentProduct.selectedSize}`;
  } else if (sizesArray.length === 1) {
    message += `\nT/Desc : ${sizesArray[0]}`;
  }

  window.open(`https://wa.me/916204805?text=${encodeURIComponent(message)}`, '_blank');
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
}
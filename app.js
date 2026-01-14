document.addEventListener('DOMContentLoaded', () => {
  const productGrid = document.getElementById('productGrid');
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // State
  let products = [];

  // --- 1. INITIALIZATION & DATA FETCHING ---
  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
      const data = await res.json();

      products = Array.isArray(data) && data.length > 0 ? data : [
        { name: "BPC-157", purity: 99.5, price: 55, category: "recovery", description: "Standard stable gastric pentadecapeptide." },
        { name: "TB-500", purity: 99.2, price: 65, category: "recovery", description: "Synthetic fraction of protein thymosin beta-4." },
        { name: "Semaglutide", purity: 99.0, price: 120, category: "muscle", description: "GLP-1 agonist for metabolic regulation." },
        { name: "Cerebrolysin", purity: 98.5, price: 85, category: "cognitive", description: "Neurotrophic peptide for brain health." },
        { name: "GHK-Cu", purity: 99.8, price: 45, category: "skin", description: "Copper peptide for skin remodeling." },
        { name: "Epitalon", purity: 99.9, price: 210, category: "cognitive", description: "Telomerase activator for longevity." }
      ];

      renderProducts(products);
    } catch (err) {
      console.error("API Error, loading fallback mode:", err);
      renderProducts(products); // fallback render
    }
  }

  // --- 2. RENDERING ---
  function renderProducts(list) {
    productGrid.innerHTML = list.map(p => `
      <div class="product-card">
        <span class="tag">${p.category.toUpperCase()}</span>
        <h3>${p.name}</h3>
        <p style="color:#aaa; font-size:0.9rem; margin: 10px 0;">${p.description}</p>
        <div style="display:flex; align-items:center;">
          <span class="price">$${p.price}</span>
          <span class="purity"><i class="fas fa-check-circle"></i> ${p.purity}% Purity</span>
        </div>
        <button class="btn-primary">View Analysis</button>
      </div>
    `).join('');
  }

  // --- 3. SEARCH & FILTER ---
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
    renderProducts(filtered);
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('.filter-btn.active')?.classList.remove('active');
      btn.classList.add('active');
      const cat = btn.getAttribute('data-cat');
      renderProducts(cat === 'all' ? products : products.filter(p => p.category === cat));
    });
  });

  // --- 4. CHATBOT LOGIC ---
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');

  document.getElementById('chatToggle').onclick = () => document.getElementById('chatWindow').classList.toggle('hidden');
  document.getElementById('closeChat').onclick = () => document.getElementById('chatWindow').classList.add('hidden');
  document.getElementById('sendMessage').onclick = handleChat;
  chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleChat(); });

  function handleChat() {
    const txt = chatInput.value.trim().toLowerCase();
    if (!txt) return;

    addMessage(chatInput.value, 'user');
    chatInput.value = '';

    setTimeout(() => {
      let response = "I'm not sure, please contact support.";

      if (txt.includes('recovery')) {
        const items = products.filter(p => p.category === 'recovery').map(p => p.name).join(', ');
        response = `For recovery, we recommend: ${items}.`;
      } else if (txt.includes('under') && txt.match(/\d+/)) {
        const limit = parseInt(txt.match(/\d+/)[0]);
        const cheap = products.filter(p => p.price < limit);
        response = cheap.length ? `Found ${cheap.length} items under $${limit}: ${cheap.map(p => p.name).join(', ')}` : "No products found in that range.";
      } else if (txt.includes('purity')) {
        const purest = products.filter(p => p.purity > 99).map(p => p.name).join(', ');
        response = `Our purest items (>99%): ${purest}`;
      } else if (txt.includes('hello') || txt.includes('hi')) {
        response = "Greetings. I can help you find peptides based on category or price.";
      }

      addMessage(response, 'bot');
    }, 500);
  }

  function addMessage(text, sender) {
    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.innerText = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // --- 5. ADMIN & CONTACT ---
  const adminModal = document.getElementById('adminModal');
  document.getElementById('adminBtn').onclick = () => adminModal.classList.remove('hidden');
  document.querySelector('.close-modal').onclick = () => adminModal.classList.add('hidden');

  document.getElementById('loginForm').onsubmit = (e) => {
    e.preventDefault();
    const pass = document.getElementById('adminPass').value;
    if (pass === 'admin123') {
      document.getElementById('loginForm').classList.add('hidden');
      document.getElementById('adminPanel').classList.remove('hidden');
    } else {
      alert('Access Denied');
    }
  };

  document.getElementById('addProductForm').onsubmit = async (e) => {
    e.preventDefault();
    const newProd = {
      name: document.getElementById('pName').value,
      price: parseFloat(document.getElementById('pPrice').value),
      purity: parseFloat(document.getElementById('pPurity').value),
      category: document.getElementById('pCategory').value,
      description: document.getElementById('pDesc').value
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });
      if (!res.ok) throw new Error(`Failed to add product: ${res.status}`);
      alert('Product Added to DB!');
      fetchProducts();
    } catch (err) {
      console.error("Error adding product:", err);
      alert('Failed to add product. Please try again.');
    }
  };

  document.getElementById('contactForm').onsubmit = async (e) => {
    e.preventDefault();
    const msgData = {
      name: document.getElementById('contactName').value,
      email: document.getElementById('contactEmail').value,
      message: document.getElementById('contactMessage').value
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgData)
      });
      if (!res.ok) throw new Error(`Failed to send contact message: ${res.status}`);
      alert('Transmission Sent.');
      e.target.reset();
    } catch (err) {
      console.error("Error sending contact message:", err);
      alert('Failed to send message. Please try again.');
    }
  };

  // Initial Load
  fetchProducts();
});

const BUSINESS = {
  name: "RB Makeup Studio & Unisex Salon",
  phone: "8882713130",
  location: "Gurgaon",
  instagramHandle: "@rb__makeupstudio",
  instagramUrl: "https://www.instagram.com/rb__makeupstudio"
};

let latestShareLink = "";

function formatMoney(value) {
  const num = Number(value) || 0;
  return num.toFixed(2).replace(/\.00$/, "");
}

function addRow(service = "", price = "") {
  const tbody = document.querySelector("#serviceTable tbody");
  const row = tbody.insertRow();

  row.innerHTML = `
    <td><input placeholder="Service" value="${escapeHtml(service)}"></td>
    <td><input type="number" min="0" step="0.01" placeholder="Price" value="${escapeHtml(price)}"></td>
    <td><button type="button" class="secondary" onclick="removeRow(this)">×</button></td>
  `;
}

function removeRow(btn) {
  const tbody = document.querySelector("#serviceTable tbody");

  if (tbody.rows.length === 1) {
    tbody.rows[0].querySelectorAll("input").forEach(input => input.value = "");
    return;
  }

  btn.closest("tr").remove();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function collectInvoiceData() {
  const customer = document.getElementById("customer").value.trim();
  const phoneInput = document.getElementById("phone").value.trim();
  const notes = document.getElementById("notes").value.trim();
  const discountValue = parseFloat(document.getElementById("discount").value) || 0;
  const rows = Array.from(document.querySelectorAll("#serviceTable tbody tr"));

  if (!customer) {
    alert("Please enter customer name");
    document.getElementById("customer").focus();
    return null;
  }

  if (!phoneInput) {
    alert("Please enter customer number");
    document.getElementById("phone").focus();
    return null;
  }

  const cleanedPhone = phoneInput.replace(/\D/g, "");
  if (cleanedPhone.length < 10) {
    alert("Please enter a valid phone number");
    document.getElementById("phone").focus();
    return null;
  }

  const items = [];
  let subtotal = 0;

  for (const row of rows) {
    const service = row.cells[0].querySelector("input").value.trim();
    const priceText = row.cells[1].querySelector("input").value.trim();

    if (!service && !priceText) continue;

    if (!service || !priceText) {
      alert("Please fill both service and price for every row");
      return null;
    }

    const price = parseFloat(priceText);
    if (Number.isNaN(price) || price < 0) {
      alert("Please enter a valid price");
      return null;
    }

    items.push({ service, price });
    subtotal += price;
  }

  if (!items.length) {
    alert("Please add at least one service");
    return null;
  }

  const total = Math.max(subtotal - discountValue, 0);

  return {
    date: new Date().toLocaleDateString("en-GB"),
    customer,
    phone: cleanedPhone,
    notes,
    discount: discountValue,
    subtotal,
    total,
    items
  };
}

function renderInvoice(data, options = {}) {
  const invoice = document.getElementById("invoice");
  const invoiceTable = document.querySelector("#invoiceTable tbody");
  const notesWrap = document.getElementById("i_notes_wrap");

  invoiceTable.innerHTML = "";

  document.getElementById("i_date").innerText = data.date;
  document.getElementById("i_customer").innerText = data.customer;
  document.getElementById("i_phone").innerText = data.phone;
  document.getElementById("i_subtotal").innerText = formatMoney(data.subtotal);
  document.getElementById("i_discount").innerText = formatMoney(data.discount);
  document.getElementById("i_total").innerText = formatMoney(data.total);
  document.getElementById("i_notes").innerText = data.notes || "";
  notesWrap.classList.toggle("hidden", !data.notes);

  data.items.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(item.service)}</td>
      <td>₹ ${formatMoney(item.price)}</td>
    `;
    invoiceTable.appendChild(row);
  });

  invoice.classList.remove("hidden");

  if (options.viewerMode) {
    document.body.classList.add("viewer-mode");
    document.title = `${data.customer} Invoice - ${BUSINESS.name}`;
  } else {
    document.body.classList.remove("viewer-mode");
  }
}

function generateInvoice() {
  document.getElementById("i_date").textContent = new Date().toLocaleDateString("en-GB");

  const data = collectInvoiceData();
  if (!data) return;

  renderInvoice(data);
  buildShareLink(data);
}

function encodeData(data) {
  const json = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(json)));
}

function decodeData(encoded) {
  const json = decodeURIComponent(escape(atob(encoded)));
  return JSON.parse(json);
}

function getBaseUrl() {
  if (window.location.origin.startsWith("http")) {
    return `${window.location.origin}${window.location.pathname}`;
  }

  return "https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME/";
}

function buildShareLink(data) {
  const encoded = encodeData(data);
  latestShareLink = `${getBaseUrl()}?view=${encodeURIComponent(encoded)}`;

  const shareSection = document.getElementById("shareSection");
  document.getElementById("shareLinkOutput").value = latestShareLink;
  shareSection.classList.remove("hidden");
}

async function copyShareLink() {
  if (!latestShareLink) {
    alert("Generate invoice first");
    return;
  }

  try {
    await navigator.clipboard.writeText(latestShareLink);
    alert("Share link copied");
  } catch (error) {
    const output = document.getElementById("shareLinkOutput");
    output.select();
    document.execCommand("copy");
    alert("Share link copied");
  }
}

function openShareLink() {
  if (!latestShareLink) {
    alert("Generate invoice first");
    return;
  }

  window.open(latestShareLink, "_blank");
}

function downloadPDF() {
  if (document.getElementById("invoice").classList.contains("hidden")) {
    alert("Generate invoice first");
    return;
  }

  const customer = document.getElementById("i_customer").innerText || "Customer";
  const date = (
    document.getElementById("i_date").innerText ||
    new Date().toLocaleDateString("en-GB")
  ).replace(/\//g, "-");

  document.title = `${customer.replace(/\s+/g, "_")}_${date}_invoice`;
  window.print();
}

function normalizePhone(phone) {
  let clean = phone.replace(/\D/g, "");
  if (clean.length === 10) clean = "91" + clean;
  return clean;
}

function sendWhatsApp() {
  const data = collectInvoiceData();
  if (!data) return;

  if (!latestShareLink) {
    buildShareLink(data);
  }

  const phone = normalizePhone(data.phone);

  const message = `Hi ${data.customer}

Thank you for choosing ${BUSINESS.name}

Your invoice is ready.
View or download it here:
${latestShareLink}

Total: ₹${formatMoney(data.total)}

Follow us on Instagram:
${BUSINESS.instagramUrl}

We look forward to serving you again.
Phone: ${BUSINESS.phone}`;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

function setupViewerMode() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("view");

  if (!encoded) {
    document.getElementById("i_date").textContent = new Date().toLocaleDateString("en-GB");
    return;
  }

  try {
    const data = decodeData(encoded);
    renderInvoice(data, { viewerMode: true });
    document.getElementById("shareSection").classList.add("hidden");
  } catch (error) {
    alert("This invoice link is invalid or corrupted.");
    window.location.href = getBaseUrl();
  }
}

window.onload = function () {
  addRow();
  setupViewerMode();
};
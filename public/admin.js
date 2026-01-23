// Switch pages
const links = document.querySelectorAll(".sidebar nav a");
const pages = document.querySelectorAll(".page");

links.forEach(link => {
  link.addEventListener("click", () => {
    document.querySelector(".sidebar .active").classList.remove("active");
    link.classList.add("active");

    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(link.dataset.page).classList.add("active");
  });
});

// Fetch dashboard stats
fetch('/admin/stats')
  .then(res => res.json())
  .then(data => {
    document.getElementById('totalSales').innerText = `$${data.total_sales}`;
    document.getElementById('totalOrders').innerText = data.total_orders;
    document.getElementById('totalProducts').innerText = data.total_products;
    document.getElementById("noOfUsers").innerText = data.userCount;
  });

// Load sales table
async function loadSalesData() {
    const tableBody = document.getElementById("salesTable");

  try {  
      const response = await fetch("/admin/sales"); // endpoint to get sales JSON
      
      const sales = await response.json();
      
      let html = "";
      sales.forEach(sale => {
        html += `
          <tr>
            <td>${sale.product_name}</td>
            <td>₦${sale.product_price}</td>
            <td>${sale.quantity}</td>
            <td>₦${sale.total_price}</td>
            <td>${sale.arrival_date}</td>
          </tr>
        `;
      });

      tableBody.innerHTML = html;

    } catch (error) {
      console.error("Error fetching sales data:", error);
      tableBody.innerHTML = `<tr><td colspan="5">Failed to load sales records.</td></tr>`;
    }
  }
  loadSalesData();

  
// Add product
document.getElementById("addProductForm").addEventListener("submit", e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());

  fetch("/admin/add-product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(msg => alert(msg.message));
});

// Update product
document.getElementById("updateProductForm").addEventListener("submit", e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());

  fetch("/admin/update-product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(msg => alert(msg.message));
});

//Delete Product
document.getElementById("deleteProductForm").addEventListener("submit", e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());

  fetch("/admin/delete-product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(msg => alert(msg.message));
});


const tabs = document.querySelectorAll(".orders-tab");
  const placeholder = document.getElementById("orders-placeholder");
  const contents = document.querySelectorAll(".orders-tab-content");

  // Map of tab -> stage filter:
  // all = null, placed=1, shipped=2, ready=3, delivered=4
  const tabStage = {
    all: null,
    placed: 1,
    shipped: 2,
    ready: 3,
    delivered: 4
  };

  tabs.forEach(t => t.addEventListener("click", async (e) => {
    tabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");

    // hide placeholder and show chosen content
    placeholder.style.display = "none";
    contents.forEach(c => c.style.display = "none");

    const key = t.dataset.tab;
    const panel = document.getElementById("tab-" + key);
    panel.style.display = "block";

    // fetch and render orders for this tab
    await loadAndRender(key);
  }));

  // load function: fetches orders (either all or stage)
  async function loadAndRender(tabKey){
    let url = "/admin/orders/all";
    const stage = tabStage[tabKey];
    if (tabKey !== "all") {
      url = `/admin/orders/stage/${stage}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      console.error("Failed to load orders", res.status);
      return;
    }
    const orders = await res.json();

    // render into DOM
    renderTable(tabKey, orders);
  }

  function renderTable(tabKey, orders) {
    const tbody = document.querySelector(`#tab-${tabKey} tbody`);
    if (!tbody) return;
    tbody.innerHTML = "";

    orders.forEach(o => {
      if (tabKey === "all") {
        tbody.insertAdjacentHTML("beforeend", rowAll(o));
      } else if (tabKey === "placed") {
        tbody.insertAdjacentHTML("beforeend", rowPlaced(o));
      } else if (tabKey === "shipped") {
        tbody.insertAdjacentHTML("beforeend", rowShipped(o));
      } else if (tabKey === "ready") {
        tbody.insertAdjacentHTML("beforeend", rowReady(o));
      } else if (tabKey === "delivered") {
        tbody.insertAdjacentHTML("beforeend", rowDelivered(o));
      }
    });

    // attach action listeners
    tbody.querySelectorAll(".action-btn").forEach(btn => {
      btn.addEventListener("click", onActionClick);
    });
  }

  // Row templates
  function rowAll(o){
    return `
      <tr>
        <td>${o.product_id}</td>
        <td>${o.buyer_name}</td>
        <td>${o.telephone}</td>
        <td>${escapeHtml(o.product_name)}</td>
        <td>$${o.product_price}</td>
        <td>${o.quantity}</td>
        <td>${o.total_price}</td>
        <td>${o.delivery_location}</td>
        <td>${formatDate(o.order_time)}</td>
        <td>${o.estimated_arrivaltime ? formatDate(o.estimated_arrivaltime) : "-"}</td>
        <td>${o.arrival_time ? formatDate(o.arrival_time) : "-"}</td>
      </tr>
    `;
  }
  function rowPlaced(o){
    return `
      <tr>
        <td>${o.product_id}</td>
        <td>${o.buyer_name}</td>
        <td>${o.telephone}</td>
        <td>${escapeHtml(o.product_name)}</td>
        <td>$${o.product_price}</td>
        <td>${o.quantity}</td>
        <td>${o.total_price}</td>
        <td>${o.delivery_location}</td>
        <td>${formatDate(o.order_time)}</td>
        <td>${o.estimated_arrivaltime ? formatDate(o.estimated_arrivaltime) : "-"}</td>
        <td><button class="action-btn" data-id="${o.product_id}" data-stage="2">Mark as Shipped</button></td>
      </tr>
    `;
  }
  function rowShipped(o){
    return `
      <tr>
        <td>${o.product_id}</td>
        <td>${o.buyer_name}</td>
        <td>${o.telephone}</td>
        <td>${escapeHtml(o.product_name)}</td>
        <td>$${o.product_price}</td>
        <td>${o.quantity}</td>
        <td>${o.total_price}</td>
        <td>${o.delivery_location}</td>
        <td>${o.estimated_arrivaltime ? formatDate(o.estimated_arrivaltime) : "-"}</td>
        <td><button class="action-btn" data-id="${o.product_id}" data-stage="3">Ready for Delivery</button></td>
      </tr>
    `;
  }
  function rowReady(o){
    return `
      <tr>
        <td>${o.product_id}</td>
        <td>${o.buyer_name}</td>
        <td>${o.telephone}</td>
        <td>${escapeHtml(o.product_name)}</td>
        <td>$${o.product_price}</td>
        <td>${o.quantity}</td>
        <td>${o.total_price}</td>
        <td>${o.delivery_location}</td>
        <td>${formatDate(o.order_time)}</td>
        <td>${o.estimated_arrivaltime ? formatDate(o.estimated_arrivaltime) : "-"}</td>
        <td><button class="action-btn" data-id="${o.product_id}" data-stage="4">Delivered</button></td>
      </tr>
    `;
  }
  function rowDelivered(o){
    return `
      <tr>
        <td>${o.product_id}</td>
        <td>${o.buyer_name}</td>
        <td>${o.telephone}</td>
        <td>${escapeHtml(o.product_name)}</td>
        <td>$${o.product_price}</td>
        <td>${o.quantity}</td>
        <td>${o.total_price}</td>
        <td>${o.delivery_location}</td>
        <td>${formatDate(o.order_time)}</td>
        <td>${o.arrival_time ? formatDate(o.arrival_time) : "-"}</td>
      </tr>
    `;
  }

  // click handler for actions
  async function onActionClick(e){
    const btn = e.currentTarget;
    const id = btn.dataset.id;
    const stage = btn.dataset.stage;

    // confirm action
    const confirmText = stage == 4 ? "Mark order as Delivered? This will add to sales_list." :
                         stage == 3 ? "Move order to Ready for Delivery?" :
                         "Mark order as Shipped?";
    if (!confirm(confirmText)) return;

    // call backend to update stage (and insert into sales_list if delivered)
    const res = await fetch(`/admin/orders/update/${id}/${stage}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
      alert("Failed to update order.");
      return;
    }

    // reload the page to reflect changes
    location.reload();
  }

  // util: format date 'YYYY-MM-DD' nice (or return original)
  function formatDate(d){ if(!d) return "-"; return d; }

  // util: basic escaping (trim risk)
  function escapeHtml(s){ return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }

  // When page loads we do nothing except show tabs (placeholder visible).

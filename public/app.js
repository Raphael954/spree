/* -----------------------------------------------------------
   ELEMENT SELECTORS (safe queries — will be null if not logged in)
----------------------------------------------------------- */


// Products
const products = document.querySelectorAll(".product-card");
const cartCount = document.querySelector("#cart-count");
const productNames = document.querySelectorAll(".product-name");

// Add To Cart
const addToCartBtns = document.querySelectorAll(".add-to-cart");
const landingProduct = document.querySelector(".product-wrapper");
const landingAddToCartBtn = document.querySelector(".btn-add-to-cart");

// Cart Page
const cartItems = document.querySelectorAll(".cart-item");
const removeQtyBtns = document.querySelectorAll(".remove-qty");
const addQtyBtns = document.querySelectorAll(".add-qty");
const clearCartBtn = document.querySelector("#clear-cart");
const emptyCartMSG = document.querySelector("#empty-cart");
const toCheckoutBtn = document.querySelector("#to-checkout");

// Arrival dates (landing page)
const arrivalDate1 = document.getElementById("arrival-date-one");
const arrivalDate2 = document.getElementById("arrival-date-two");

//Key Features & What's in the Package (landing page)
const keyFeatures = document.getElementById("key-features")
const boxContents = document.getElementById("box-contents")

// User menu (only exists when logged in)
const userMenuToggle = document.querySelector(".user-menu-toggle");
const userMenu = document.querySelector("#user-menu");
const myAccountBtn = document.querySelector(".my-account");
const ordersBtn = document.querySelector(".orders");
const inboxBtn = document.querySelector(".inbox");
const adminOfficeBtn = document.querySelector(".admin-office");



// Select all elements you want to animate
const scrollElements = document.querySelectorAll('.animate-on-scroll');

// Helper function to check if element is in viewport
function isInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.bottom >= 0
  );
}

// Add scroll event listener
function handleScrollAnimation() {
  scrollElements.forEach(el => {
    if (isInViewport(el)) {
      el.classList.add('visible');
    }
  });
}

// Run on scroll and also on initial load
window.addEventListener('scroll', handleScrollAnimation);
window.addEventListener('load', handleScrollAnimation);


// Utility to grey out elements
function GreyOut(elements) {
    elements.forEach(el => el?.classList.add("order-grey"));
}

// Get all track buttons and corresponding cards
const trackOrderBtn = document.querySelectorAll(".order-track");
const orderTrackGroup = document.querySelectorAll(".order-track-group");
const ordersCard = document.querySelectorAll(".orders-card");

if(trackOrderBtn.length){
    trackOrderBtn.forEach((track, index) => {
        
        track.addEventListener("click", () => {
            const stage = parseInt(track.dataset.orderstage);
            const card = orderTrackGroup[index];
            const parent = ordersCard[index];

            const dates = parent.querySelector(".order-dates");  // FIXED: local to card

            const circles = [
                card.querySelector(".stage-one .order-circle"),
                card.querySelector(".stage-two .order-circle"),
                card.querySelector(".stage-three .order-circle"),
                card.querySelector(".stage-four .order-circle"),
            ];

            const icons = [
                card.querySelector(".stage-one .order-circle i"),
                card.querySelector(".stage-two .order-circle i"),
                card.querySelector(".stage-three .order-circle i"),
                card.querySelector(".stage-four .order-circle i"),
            ];

            const texts = [
                card.querySelector(".stage-one .order-stage"),
                card.querySelector(".stage-two .order-stage"),
                card.querySelector(".stage-three .order-stage"),
                card.querySelector(".stage-four .order-stage"),
            ];

            // ================================
            // COLLAPSE
            // ================================
            if(track.textContent.trim() === "Collapse"){
                track.textContent = "Order Details";
                card.style.display = "none";
                if (dates) dates.style.display = "none";
                return;
            }

            // ================================
            // EXPAND
            // ================================
            track.textContent = "Collapse";
            card.style.display = "grid";
            if (dates) dates.style.display = "block";

            // ==========================================
            // COLOR LOGIC
            // - stages <= current stage → active
            // - stages > current stage → grey
            // ==========================================
            for(let i = 0; i < 4; i++){
                if(i + 1 <= stage){
                    // ACTIVE
                    circles[i]?.classList.remove("order-grey");
                    icons[i]?.classList.remove("order-grey");
                    texts[i]?.classList.remove("order-grey-text");
                } else {
                    // GREY
                    circles[i]?.classList.add("order-grey");
                    icons[i]?.classList.add("order-grey");
                    texts[i]?.classList.add("order-grey-text");
                }
            }
        });
    });
}



//Get Landing Page Key-Features and Box-content
if(keyFeatures && boxContents){
  keyFeatures.innerHTML = keyFeatures.dataset.features;
  boxContents.innerHTML = boxContents.dataset.content;
}
// Close user menu if open
function closeUserMenu() {
    if (!userMenuToggle || !userMenu) return;

    userMenu.style.display = "none";
    const icon = userMenuToggle.querySelector("i");
    if (icon) {
        icon.classList.remove("fa-angle-up");
        icon.classList.add("fa-angle-down");
    }
}

// Popup notification
function showPopup(message) {
    const popUpEl = document.createElement("div");
    popUpEl.innerHTML = `<p><i class="fa-solid fa-check" style="color:green;"></i> ${message}</p>`;
    popUpEl.classList.add("add-cart-notification");
    document.body.prepend(popUpEl);

    setTimeout(() => popUpEl.remove(), 3000);
}


/* -----------------------------------------------------------
   USER MENU LOGIC (only runs if user is logged in)
----------------------------------------------------------- */

if (userMenuToggle && userMenu) {
    const toggleIcon = userMenuToggle.querySelector("i");

    userMenuToggle.addEventListener("click", () => {
        const open = userMenu.style.display === "block";
        userMenu.style.display = open ? "none" : "block";

        if (toggleIcon) {
            toggleIcon.classList.toggle("fa-angle-up", !open);
            toggleIcon.classList.toggle("fa-angle-down", open);
        }
    });
}

if (myAccountBtn) {
    myAccountBtn.addEventListener("click", () => alert("Account settings unavailable"));
}

if (inboxBtn) {
    inboxBtn.addEventListener("click", () => alert("Messages unavailable"));
}

if (ordersBtn) {
    ordersBtn.addEventListener("click", () => {
        closeUserMenu();
        window.location.href = "/orders";
    });
}

if (adminOfficeBtn) {
    adminOfficeBtn.addEventListener("click", () => {
        closeUserMenu();
        window.location.href = "/admin-office";
    });
}


/* -----------------------------------------------------------
   PRODUCTS GRID CLICK — redirect OR add to cart
----------------------------------------------------------- */

products.forEach((product, index) => {
    product.addEventListener("click", async (e) => {
        closeUserMenu();

        // ADD TO CART BUTTON CLICKED
        if (e.target.classList.contains("add-to-cart")) {
            e.stopPropagation(); // prevent redirect
            const productId = product.dataset.id;

            try {
                const response = await axios.post("/add-to-cart", {
                    id: productId,
                    qty: 1
                });

                if (response.data.ok) {
                    cartCount.textContent = response.data.cartCount;
                    showPopup("Product added successfully");
                }
            } catch (err) {
                console.error("Add to cart failed:", err);
            }

            return;
        }

        // NORMAL PRODUCT CLICK — GO TO LANDING PAGE
        const productName = productNames[index].dataset.name;
        window.location.href = `/landing-page?product=${productName}`;
    });
});


/* -----------------------------------------------------------
   LANDING PAGE — Add to Cart
----------------------------------------------------------- */

if (landingAddToCartBtn && landingProduct) {
    landingAddToCartBtn.addEventListener("click", async () => {
        closeUserMenu();

        const productId = landingProduct.dataset.id;

        try {
            const response = await axios.post("/add-to-cart", {
                id: productId,
                qty: 1
            });

            if (response.data.ok) {
                cartCount.textContent = response.data.cartCount;
                showPopup("Product added successfully");
            }
        } catch (err) {
            console.error("Landing add-to-cart failed:", err);
        }
    });
}


/* -----------------------------------------------------------
   CART PAGE — Increase / Decrease / Clear
----------------------------------------------------------- */

addQtyBtns.forEach((button, index) => {
    button.addEventListener("click", async () => {
        closeUserMenu();

        const item = cartItems[index];
        const id = item.dataset.id;
        const price = item.dataset.price;
        const qtyEl = item.querySelector(".qty");
        const subtotalEl = item.querySelector(".subtotal");

        const result = await axios.post("/add-qty", { id, qty: 1, price });

        if (result.data.ok) {
            cartCount.textContent = result.data.cartCount;
            qtyEl.textContent = result.data.productQty;
            subtotalEl.textContent = result.data.newPrice;
            showPopup("Updated quantity");
        }
    });
});

removeQtyBtns.forEach((button, index) => {
    button.addEventListener("click", async () => {
        closeUserMenu();

        const item = cartItems[index];
        const id = item.dataset.id;
        const price = item.dataset.price;
        const qtyEl = item.querySelector(".qty");
        const subtotalEl = item.querySelector(".subtotal");

        const result = await axios.post("/add-remove", { id, qty: 1, price });

        if (result.data.ok) {
            if (result.data.productQty <= 0) {
                item.remove();
            } else {
                qtyEl.textContent = result.data.productQty;
                subtotalEl.textContent = result.data.newPrice;
            }

            cartCount.textContent = result.data.cartCount;
        }
    });
});

if (clearCartBtn) {
    clearCartBtn.addEventListener("click", async () => {
        closeUserMenu();
        await axios.post("/clear-cart");

        cartItems.forEach(item => item.remove());
        cartCount.textContent = 0;

        if (emptyCartMSG) emptyCartMSG.style.display = "block";
    });
}


/* -----------------------------------------------------------
   CHECKOUT BUTTON
----------------------------------------------------------- */

if (toCheckoutBtn) {
    toCheckoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeUserMenu();

        if (parseInt(cartCount.textContent) > 0) {
            window.location.href = "/checkout";
        } else {
            alert("Your cart is empty.");
        }
    });
}


/* -----------------------------------------------------------
   ARRIVAL DATE CALCULATION
----------------------------------------------------------- */

function getWeeklyArrivalDate() {
    if (!arrivalDate1 || !arrivalDate2) return;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const date1 = new Date(startOfWeek);
    const date2 = new Date(startOfWeek);
    date1.setDate(startOfWeek.getDate() + 14);
    date2.setDate(startOfWeek.getDate() + 20);

    arrivalDate1.textContent = date1.toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
    });

    arrivalDate2.textContent = date2.toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
    });
}

getWeeklyArrivalDate();

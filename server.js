import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import path, { parse } from "path";
import axios from "axios";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const db = new pg.Client({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "spree",
  password: process.env.DB_PASSWORD || "chimobi5",
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect();
const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}))

app.use(session({ secret: "spree-secret", resave: false, saveUninitialized: true }));
app.use(express.static(path.join(process.cwd(), "public")));


app.use(passport.initialize());
app.use(passport.session());

// Sample product catalog (id, type tag, price, name, image)
let products = [];
let Authenticated = false;
// Utility: ensure session cart
function ensureCart(req) {
  if (!req.session.cart) req.session.cart = {};
  return req.session.cart;
}



// Pages
app.get("/", async (req, res) => {
  if(req.isAuthenticated()){

  const all_products = await db.query('select * from product_list order by random() limit 15')
  products = all_products.rows;

  Authenticated = true;

  const cart = ensureCart(req)
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalCartCount = cartCount ? cartCount : 0;

  res.render("index.ejs", {products, user: req.user, Authenticated, totalCartCount});
  }
  else{
  const all_products = await db.query('select * from product_list order by random() limit 15')
  products = all_products.rows;

  const cart = ensureCart(req)
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalCartCount = cartCount ? cartCount : 0;

  res.render("index.ejs", {products, Authenticated: Authenticated = false, totalCartCount });
  }
  
});

app.get("/bags", async (req, res) => {
  if(req.isAuthenticated()){
  const all_products = await db.query('select * from product_list where product_group = $1', ['bags']);
  products = all_products.rows;

  Authenticated = true;
  
   const cart = ensureCart(req)
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalCartCount = cartCount ? cartCount : 0;

  res.render("category.ejs", { category: "bags", title: "Bags", products, user: req.user, Authenticated, totalCartCount });
  }else{
  const all_products = await db.query('select * from product_list where product_group = $1', ['bags']);
  products = all_products.rows;

   const cart = ensureCart(req)
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalCartCount = cartCount ? cartCount : 0;

  res.render("category.ejs", { category: "bags", title: "Bags", products, Authenticated: Authenticated = false, totalCartCount });}
});

app.get("/cosmetics", async (req, res) => {
  if(req.isAuthenticated()){
    const all_products = await db.query('select * from product_list where product_group = $1', ['cosmetics']);
    products = all_products.rows;

    Authenticated = true
    
    const cart = ensureCart(req)
    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
    const totalCartCount = cartCount ? cartCount : 0;

    res.render("category.ejs", { category: "cosmetics", title: "Cosmetics", products, user: req.user, Authenticated, totalCartCount });
  }else{
    const all_products = await db.query('select * from product_list where product_group = $1', ['cosmetics']);
    products = all_products.rows;
    
    const cart = ensureCart(req)
    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
    const totalCartCount = cartCount ? cartCount : 0;
    
    res.render("category.ejs", { category: "cosmetics", title: "Cosmetics", products, Authenticated: Authenticated = false, totalCartCount });
  }
});

app.get("/jewelry", async (req, res) => {
  if(req.isAuthenticated()){
    const all_products = await db.query('select * from product_list where product_group = $1', ['jewelry']);
    products = all_products.rows;
    
    Authenticated = true
    
    const cart = ensureCart(req)
    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
    const totalCartCount = cartCount ? cartCount : 0;

    res.render("category.ejs", { category: "jewelry", title: "Jewelry", products, user: req.user, Authenticated, totalCartCount });
  }else{  
    const all_products = await db.query('select * from product_list where product_group = $1', ['jewelry']);
    products = all_products.rows;
    
    const cart = ensureCart(req)
    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
    const totalCartCount = cartCount ? cartCount : 0;

    res.render("category.ejs", { category: "jewelry", title: "Jewelry", products, Authenticated: Authenticated = false, totalCartCount });
  }
});


app.get("/landing-page", async (req, res) => {
  const productDetails = req.query
  const all_products = await db.query("select * from product_list where product_name = $1", [productDetails.product])
  products = all_products.rows[0];

  if(req.isAuthenticated()){
  Authenticated = true;
  const cart = ensureCart(req)
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalCartCount = cartCount ? cartCount : 0;
  res.render("landingpage.ejs", { products, totalCartCount,user: req.user, Authenticated, title: products.product_name })
  }else{
    const cart = ensureCart(req)
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const totalCartCount = cartCount ? cartCount : 0;
   
    res.render("landingpage.ejs", { products, totalCartCount, Authenticated: Authenticated = false, title: products.product_name })
  }
  
})

app.get("/orders", async (req, res) => {
  if(req.isAuthenticated()){
    const all_products = await db.query("select * from delivery_list where buyer_name = $1",[req.user.username])
    const orders = all_products.rows;
    orders.forEach(async (order) => {
      switch (order.delivery_stage) {
        case "1":
          order.delivery_stage = 1
          order.delivery_status = "Order Placed"
          await db.query("UPDATE delivery_list SET delivery_status = $1 where delivery_stage = $2", ['Order Placed', order.delivery_stage])
          break;

        case "2":
          order.delivery_stage = 2
          order.delivery_status = "Shipment Made"
          await db.query("UPDATE delivery_list SET delivery_status = $1 where delivery_stage = $2", ['Shipment In Progress', order.delivery_stage])
          break;

        case "3":
          order.delivery_stage = 3
          order.delivery_status = "Ready for Delivery"
          await db.query("UPDATE delivery_list SET delivery_status = $1 where delivery_stage = $2", ['Ready for Delivery', order.delivery_stage])
          break;
       
        case "4":
          order.delivery_stage = 4
          order.delivery_status = "Delivered"
          await db.query("UPDATE delivery_list SET delivery_status = $1 where delivery_stage = $2", ['Delivered', order.delivery_stage])
          break;
          
      }
    });
    Authenticated = true;
    const cart = ensureCart(req)
    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
    const totalCartCount = cartCount ? cartCount : 0;
  res.render("orders.ejs", {orders, totalCartCount,Authenticated, title: "My Orders", user: req.user})
  }else{
    res.redirect("/login")
  }
})

app.get("/admin-office", async (req, res) => {
  if(req.isAuthenticated){
    res.render("admin.ejs")
  }else{
    res.render("/")
  }
})

app.get("/admin/stats", async (req, res) => {
  const sales = await db.query("select * from sales_list")
  const orders = await db.query("select * from delivery_list")
  const all_products = await db.query("select * from product_list")
  const users = await db.query("select * from users")
  products = all_products.rows;
  let sale = sales.rows;
  let order = orders.rows;
  let userCount =users.rowCount;
  let productCount = products.reduce((a, b) => a + parseInt(b.stock), 0)
  let orderCount =  order.reduce((a, b) => a + parseInt(b.quantity), 0)
  let salesCount = (sale.reduce((a, b) => a + parseInt(b.total_profit), 0)) || 0
  res.json({total_sales: salesCount, total_orders: orderCount, total_products: productCount, userCount})
})

app.get("/admin/sales", async (req, res) => {
  const sales = await db.query("select * from sales_list")
  let salesData = sales.rows;

  res.json({salesData})

})

app.post("/admin/add-product", async (req, res) => {
  const { name, price, group, brand, stock, productDetails, boxContent, keyFeatures} = req.body
  let newBoxContent = boxContent.replaceAll("@","<li>")
  let finalBoxContent = newBoxContent.replaceAll("*","</li>")
  let newFeatures = keyFeatures.replaceAll("@","<li>")
  let finalFeatures = newFeatures.replaceAll("*","</li>")

  await db.query("INSERT INTO product_list (product_name, product_price, product_group, product_brand, stock, sold, product_details, key_features, box_content) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [name, price, group, brand, stock, '0', productDetails, finalFeatures, finalBoxContent])

  res.json({ message: "Product added successfully" });
})

app.post("/admin/update-product", async (req, res) => {
  const { id, name, price, newStock} = req.body;
  const all_products = await db.query("select * from product_list where product_id = $1", [id])
  products = all_products.rows[0];
  if(name){
    products.product_name = name
    await db.query("UPDATE product_list SET product_name = $1 where product_id = $2", [products.product_name, id])
  }
  if(price){
    products.product_price = price
    await db.query("UPDATE product_list SET product_price = $1 where product_id = $2", [products.product_price, id])
  }
  if(newStock){
    products.stock = parseInt(newStock) + parseInt(products.stock)
    await db.query("UPDATE product_list SET stock = $1 where product_id = $2", [products.stock, id])
  }
  
  res.json({message: "Product Updated Successfully"})
})

app.post("/admin/delete-product", async (req, res) => {
  const {id, name} = req.body;
  if(id){
    await db.query("DELETE FROM product_list WHERE product_id = $1;", [parseInt(id)])
  }
  if(name){
    await db.query("DELETE FROM product_list WHERE product_name = $1;", [name])
  }
  await db.query("SELECT setval('product_list_product_id_seq', (SELECT COALESCE(MAX(product_id), 0) FROM product_list) + 1,false);")
  res.json({message: "Product Deleted"})
})



// 1) Get ALL orders ordered by order_date ASC
app.get('/admin/orders/all', async (req, res) => {
  try {
    let allOrdersData = await db.query(`
      SELECT *
      FROM delivery_list
      ORDER BY order_time ASC
    `);
    let allOrders = allOrdersData.rows
    allOrders.forEach(orders => {
      orders.order_time = new Date(orders.order_time - 1).toISOString().split('T')[0].toString()
      orders.estimated_arrivaltime = new Date(orders.estimated_arrivaltime - 1) .toISOString().split('T')[0].toString()
      orders.arrival_time = new Date(orders.arrival_time - 1).toISOString().split('T')[0].toString()
    });
    
    res.json(allOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// 2) Get orders by stage
app.get('/admin/orders/stage/:stage', async (req, res) => {
  const stage = req.params.stage;
  try {
    let q;
    if (stage == 4) {
      // Delivered: order by delivery_date ASC
      q = await db.query(`
        SELECT *
        FROM delivery_list
        WHERE delivery_stage = $1
        ORDER BY arrival_time ASC
      `, [stage]);
    } else {
      // Other stages: order by order_date ASC
      q = await db.query(`
        SELECT *
        FROM delivery_list
        WHERE delivery_stage = $1
        ORDER BY order_time ASC
      `, [stage]);
    }
    let allOrders = q.rows;
    allOrders.forEach(orders => {
      orders.order_time = new Date(orders.order_time - 1).toISOString().split('T')[0].toString()
      orders.estimated_arrivaltime = new Date(orders.estimated_arrivaltime - 1) .toISOString().split('T')[0].toString()
      orders.arrival_time = new Date(orders.arrival_time - 1).toISOString().split('T')[0].toString()
    });
    res.json(allOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// 3) Update stage (and insert into sales_list when moving to delivered)
app.post('/admin/orders/update/:id/:stage', async (req, res) => {
  const id = req.params.id
  const stage = req.params.stage

  try {
    if (stage == 4) {
      // delivered: set delivery_date = today, update stage, then insert into sales_list
      const today = new Date().toISOString().split('T')[0];

      // Get current order row
      const orderRes = await db.query(
        `SELECT * FROM delivery_list WHERE product_id = $1`,
        [id]
      );

      if (orderRes.rowCount == 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const orderData = orderRes.rows[0];

      // Update delivery_list
      await db.query(
        `UPDATE delivery_list
         SET delivery_stage = $1, arrival_time = $2
         WHERE product_id = $3`,
        [4, today, id]
      );

      // Insert into sales_list
      await db.query(
        `INSERT INTO sales_list (arrival_date, quantity, product_name, unit_cost, total_profit)
         VALUES ($1, $2, $3, $4, $5)`,
        [today, orderData.quantity, orderData.product_name, orderData.product_price, orderData.total_price]
      );

      return res.json({ message: 'Order marked delivered and inserted into sales_list' });
    } else {
      // other stage updates: just update the stage
      await db.query(
        `UPDATE delivery_list SET delivery_stage = $1 WHERE product_id = $2`,
        [stage, id]
      );
      return res.json({ message: 'Order stage updated' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});









app.get("/cart", async (req, res) => {
  if(req.isAuthenticated()){
    Authenticated = true
    const all_products = await db.query('select * from product_list')
    products = all_products.rows;
    const cartProducts = [];
    const cart = ensureCart(req);
    for (const productId in cart) {
      const product = products.find(p => p.product_id == productId)
      if(product){
        cartProducts.push({
          product_id: product.product_id,
          product_name: product.product_name,
          product_price: product.product_price,
          product_group: product.product_group,
          quantity: cart[productId],
          subtotal: product.product_price * cart[productId]
        })
      }
    }
    

    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
    const totalCartCount = cartCount ? cartCount : 0;
    
    res.render("cart.ejs", {  cartProducts, title: "My Cart", user: req.user, Authenticated: true, totalCartCount });

  }else{
   res.redirect("/login")

  }
  });

//Cart Management
app.post("/add-to-cart", (req, res) => {
  const cart = ensureCart(req);
  const productId = req.body.id;
  
  const qty = req.body.qty
  if(!cart[productId]) {
    cart[productId] = (cart[productId] || 0) + parseInt(qty)
    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
   
    res.json({ ok: true, cart: req.session.cart, cartCount });
  }else{
    cart[productId] += parseInt(qty);
    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
   
    res.json({ ok: true, cart: req.session.cart, cartCount });
  }
  
})

app.post("/add-qty", (req, res) => {
  const cart = ensureCart(req);
  const productId = req.body.id
  const qty = req.body.qty
  const price = req.body.price

  cart[productId] = cart[productId] + parseInt(qty)
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const productQty = cart[productId]
  const newPrice = cart[productId] * parseFloat(price).toFixed(2)
  res.json({ ok: true, cart: req.session.cart, cartCount, productQty, newPrice: newPrice.toFixed(2) });
})

app.post("/add-remove", (req, res) => {
  const cart = ensureCart(req);
  const productId = req.body.id
  const qty = req.body.qty
  const price = req.body.price

  cart[productId] = cart[productId] - parseInt(qty)
  
    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
    const productQty = cart[productId]
    const newPrice = cart[productId] * parseFloat(price).toFixed(2)
   
    res.json({ ok: true, cart: req.session.cart, cartCount, productQty, newPrice: newPrice.toFixed(2) });
   
})

app.post("/clear-cart", (req, res) => {
  const cart = ensureCart(req);
  delete req.session.cart
  let message = "cart Empty"
  res.json(message)
})


//Checkout Logics
app.get("/checkout", async (req, res) => {
  if(req.isAuthenticated()){
    Authenticated = true

    const all_products = await db.query('select * from product_list')
    products = all_products.rows;

    const checkoutProducts = [];
    const cart = ensureCart(req);

    for (const productId in cart) {
      const product = products.find(p => p.product_id == productId && cart[productId] > 0)
      if(product){
          checkoutProducts.push({
          product_id: product.product_id,
          product_name: product.product_name,
          product_price: product.product_price,
          product_group: product.product_group,
          quantity: cart[productId],
          subtotal: product.product_price * cart[productId]
        })
      }
    }
    const totalPrice = checkoutProducts.reduce((a, b) => a + b.subtotal, 0)

    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)

    res.render("checkout.ejs", { title: "checkout", user: req.user, checkoutProducts, Authenticated: true, totalCartCount: cartCount, totalPrice });
  }else{
    res.redirect("/login")
  }
});
//Make Order
app.post("/send-order", async (req, res) => {
  const checkoutItems = []
  const address = req.body.address;
  const all_users = await db.query("select * from users where username = $1", [req.user.username])
  let userNames = all_users.rows[0]
  const cart = ensureCart(req)
  const all_products = await db.query('select * from product_list')
    products = all_products.rows;
    for (const productId in cart) {
      const product = products.find(p => p.product_id == productId && cart[productId] > 0)
      if(product){
          checkoutItems.push({
          product_id: product.product_id,
          product_name: product.product_name,
          product_price: product.product_price,
          product_group: product.product_group,
          quantity: cart[productId],
          subtotal: product.product_price * cart[productId],
          stock: product.stock,
          sold:product.sold,
          telephone: userNames.telephone
        })
 
    }
  }   
  const orderTime = new Date().toISOString().split('T')[0];
  function getEstimatedDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days); // adds days
    return date.toISOString().split('T')[0]; // returns "YYYY-MM-DD"
}
  const estimatedArrivalTime = getEstimatedDate(14)
    checkoutItems.forEach(async (item) => {
      
        const orderId = Math.floor(Math.random() * 9000 +1000)
        await db.query("insert into delivery_list (product_id, buyer_name, product_name, product_price, delivery_location, delivery_status, quantity, delivery_stage, telephone, order_time, estimated_arrivaltime, total_price) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)", [orderId, req.user.username, item.product_name, item.product_price, address, 'Order Placed', item.quantity, '1', item.telephone, orderTime, estimatedArrivalTime, item.subtotal.toFixed(2)])
        
        item.stock = parseInt(item.stock) - parseInt(item.quantity)
        item.sold = parseInt(item.sold) + parseInt(item.quantity)

        await db.query("UPDATE product_list SET stock = $1, sold = $2 where product_id = $3", [item.stock, item.sold, item.product_id])
    
    })


    const totalPrice = checkoutItems.reduce((a, b) => a + b.subtotal, 0)
    let newUserBalance = parseFloat(userNames.balance) -  parseFloat(totalPrice)
    let finalUserBalance = newUserBalance.toFixed(2)
    await db.query("UPDATE users SET balance = $1 WHERE username = $2", [finalUserBalance, req.user.username])
    
    delete req.session.cart;
    res.redirect("/")
})


//Login/SignUp
app.get("/login", (req, res) => {
  res.sendFile(path.join(process.cwd(), "views", "login.html"))
})


app.post("/login",  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);


app.post("/signup", async (req, res)=> {
  const userName = req.body.username;
  let password = req.body.password;
  const phoneNumber = req.body.number;
  const userData = await db.query("select * from users where username = $1", [userName])
  let users = userData.rows;
  if(users.length > 0){
    res.send("User already exists. Please choose a different username.");
  } else {

  if(password.includes("-admin")){
    password = password.replace("-admin","")
    const addUser = await db.query("INSERT INTO users (username, password, telephone,auth,balance) values ($1, $2, $3, $4, $5) RETURNING *", [userName,password,phoneNumber,'admin','7000'])
    const user = addUser.rows[0];
    req.logIn({user}, (err) => {
      res.redirect("/");
    })
  }else{
    const addUser = await db.query("INSERT INTO users (username, password, telephone,auth,balance) values ($1, $2, $3, $4, $5) RETURNING *", [userName,password,phoneNumber,'user','7000']) 
    const user = addUser.rows[0];
    req.logIn({user}, (err) => {
      res.redirect("/");
    })
  }
 
}})

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }

    // Clear session cookie
    res.clearCookie('connect.sid'); 

    // Send JSON response
    res.redirect("/")
  });
  });


passport.use(new Strategy( 
  async function(username, password, done) {
    const userData = await db.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = userData.rows[0];
    if(user.username.trim() == username.trim() && user.password.trim() == password.trim()){
      return done(null, user);
    }
    else{
      return done(null, false); 
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.username);
});
passport.deserializeUser( async (username, done) => {
  const userData = await db.query("SELECT * FROM users WHERE username = $1", [username]);
  const user = userData.rows[0];
  done(null, user);
});

app.listen(port, () => console.log(`Spree server running: http://localhost:${port}`));

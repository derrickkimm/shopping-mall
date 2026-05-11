const API_URL = "http://localhost:9000";

const defaultProducts = [
  {
    id: 1,
    name: "덤벨 세트",
    category: "equipment",
    price: 49,
    image: "https://via.placeholder.com/200?text=Dumbbell",
    description: "홈트레이닝과 근력 운동에 좋은 기본 덤벨 세트입니다.",
    stock: 5,
  },
  {
    id: 2,
    name: "요가 매트",
    category: "equipment",
    price: 25,
    image: "https://via.placeholder.com/200?text=Yoga+Mat",
    description:
      "스트레칭, 요가, 복근 운동에 사용할 수 있는 미끄럼 방지 매트입니다.",
    stock: 5,
  },
  {
    id: 5,
    name: "머슬데릭 피규어",
    category: "equipment",
    price: 35,
    image: "images/muscle-derek-figure.jpg",
    description: "운동방이나 책상 위에 장식하기 좋은 머슬데릭 피규어입니다.",
    stock: 3,
  },
  {
    id: 6,
    name: "머슬데릭 바",
    category: "equipment",
    price: 79,
    image: "images/muscle-derek-bar.jpg",
    description:
      "근력 운동에 사용할 수 있는 머슬데릭 브랜드 트레이닝 바입니다.",
    stock: 4,
  },
  {
    id: 7,
    name: "머슬데릭 벨트",
    category: "equipment",
    price: 45,
    image: "images/muscle-derek-belt.jpg",
    description:
      "스쿼트, 데드리프트 같은 고중량 운동 시 허리를 지지해주는 리프팅 벨트입니다.",
    stock: 6,
  },
];

let products = JSON.parse(localStorage.getItem("products")) || defaultProducts;
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let orders = JSON.parse(localStorage.getItem("orders")) || [];
let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

function displayProducts(productArray) {
  const productList = document.getElementById("product-list");

  if (!productList) return;

  productList.innerHTML = "";

  if (productArray.length === 0) {
    productList.innerHTML = "<p>상품이 없습니다.</p>";
    return;
  }

  productArray.forEach((product) => {
    productList.innerHTML += `
      <div class="product-card">
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>가격: $${product.price}</p>
        <p>재고: ${product.stock}</p>

        ${
          product.stock > 0
            ? `<button onclick="addToCart(${product.id})">장바구니 추가</button>`
            : `<button disabled>품절</button>`
        }

        <button class="detail-btn" onclick="openModal(${product.id})">상세보기</button>
      </div>
    `;
  });
}

async function loadProductsFromAPI() {
  try {
    console.log("서버 상품 불러오기 실행됨");

    const response = await fetch(`${API_URL}/api/products`);
    const data = await response.json();

    console.log("서버에서 받은 상품:", data);

    products = data;
    displayProducts(products);
  } catch (error) {
    console.log("API 연결 실패:", error.message);
    displayProducts(products);
  }
}

function filterProducts(category) {
  if (category === "all") {
    displayProducts(products);
  } else {
    const filtered = products.filter(
      (product) => product.category === category,
    );
    displayProducts(filtered);
  }
}

function searchProducts() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  const keyword = searchInput.value.toLowerCase();

  const searchedProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(keyword) ||
      product.category.toLowerCase().includes(keyword),
  );

  displayProducts(searchedProducts);
}

function sortProducts(type) {
  let sortedProducts = [...products];

  if (type === "low") {
    sortedProducts.sort((a, b) => a.price - b.price);
  } else if (type === "high") {
    sortedProducts.sort((a, b) => b.price - a.price);
  } else if (type === "name") {
    sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
  }

  displayProducts(sortedProducts);
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  const existingItem = cart.find((item) => item.id === productId);

  if (!product) return;

  if (existingItem) {
    if (existingItem.quantity >= product.stock) {
      alert("재고 수량을 초과할 수 없습니다.");
      return;
    }

    existingItem.quantity += 1;
  } else {
    if (product.stock <= 0) {
      alert("품절된 상품입니다.");
      return;
    }

    cart.push({
      ...product,
      quantity: 1,
    });
  }

  saveCart();
  updateCart();
}

function increaseQuantity(productId) {
  const item = cart.find((product) => product.id === productId);
  const product = products.find((product) => product.id === productId);

  if (!item || !product) return;

  if (item.quantity >= product.stock) {
    alert("재고 수량을 초과할 수 없습니다.");
    return;
  }

  item.quantity += 1;
  saveCart();
  updateCart();
}

function decreaseQuantity(productId) {
  const item = cart.find((product) => product.id === productId);

  if (!item) return;

  item.quantity -= 1;

  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart();
  updateCart();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  updateCart();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCart() {
  const cartList = document.getElementById("cart-list");
  const totalElement = document.getElementById("total");

  if (!cartList || !totalElement) return;

  cartList.innerHTML = "";

  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    cartList.innerHTML += `
      <li>
        <strong>${item.name}</strong><br>
        $${item.price} x ${item.quantity} = $${itemTotal}
        <br>
        <button onclick="decreaseQuantity(${item.id})">-</button>
        <button onclick="increaseQuantity(${item.id})">+</button>
        <button onclick="removeFromCart(${item.id})">삭제</button>
      </li>
    `;
  });

  totalElement.textContent = total;
}

function openModal(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  document.getElementById("modal-image").src = product.image;
  document.getElementById("modal-name").textContent = product.name;
  document.getElementById("modal-category").textContent =
    `카테고리: ${product.category}`;
  document.getElementById("modal-price").textContent =
    `가격: $${product.price}`;
  document.getElementById("modal-description").textContent =
    product.description;

  const modalCartButton = document.getElementById("modal-cart-btn");
  modalCartButton.onclick = function () {
    addToCart(product.id);
    closeModal();
  };

  document.getElementById("product-modal").style.display = "block";
}

function closeModal() {
  const modal = document.getElementById("product-modal");
  if (modal) modal.style.display = "none";
}

function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
}

async function saveOrderToAPI(order) {
  try {
    const response = await fetch(`${API_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      throw new Error("주문 저장 실패");
    }

    const data = await response.json();
    console.log("서버에 주문 저장 완료:", data);
  } catch (error) {
    console.log("현재는 localStorage에만 저장됩니다:", error.message);
  }
}

function placeOrder() {
  const name = document.getElementById("customer-name").value.trim();
  const email = document.getElementById("customer-email").value.trim();
  const address = document.getElementById("customer-address").value.trim();
  const orderMessage = document.getElementById("order-message");

  if (!currentUser) {
    orderMessage.textContent = "주문하려면 먼저 로그인해주세요.";
    return;
  }

  if (cart.length === 0) {
    orderMessage.textContent = "장바구니가 비어 있습니다.";
    return;
  }

  if (!name || !email || !address) {
    orderMessage.textContent = "이름, 이메일, 주소를 모두 입력해주세요.";
    return;
  }

  const total = cart.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  const newOrder = {
    id: Date.now(),
    userId: currentUser.id,
    userEmail: currentUser.email,
    customerName: name,
    email: email,
    address: address,
    items: cart,
    total: total,
    date: new Date().toLocaleString(),
  };

  cart.forEach((cartItem) => {
    const product = products.find((item) => item.id === cartItem.id);

    if (product) {
      product.stock -= cartItem.quantity;
    }
  });

  saveProducts();

  orders.push(newOrder);
  localStorage.setItem("orders", JSON.stringify(orders));
  saveOrderToAPI(newOrder);

  orderMessage.textContent = `${name}님, 주문이 완료되었습니다!`;

  cart = [];
  saveCart();

  updateCart();
  displayProducts(products);
  displayOrders();

  document.getElementById("customer-name").value = "";
  document.getElementById("customer-email").value = "";
  document.getElementById("customer-address").value = "";
}

function displayOrders() {
  const orderList = document.getElementById("order-list");

  if (!orderList) return;

  orderList.innerHTML = "";

  if (orders.length === 0) {
    orderList.innerHTML = "<p>아직 주문 내역이 없습니다.</p>";
    return;
  }

  orders.forEach((order) => {
    const itemNames = order.items
      .map((item) => `${item.name} x ${item.quantity}`)
      .join(", ");

    orderList.innerHTML += `
      <li>
        <strong>주문번호:</strong> ${order.id}<br>
        <strong>이름:</strong> ${order.customerName}<br>
        <strong>이메일:</strong> ${order.email}<br>
        <strong>주소:</strong> ${order.address}<br>
        <strong>상품:</strong> ${itemNames}<br>
        <strong>총액:</strong> $${order.total}<br>
        <strong>주문일:</strong> ${order.date}<br><br>

        <button onclick="deleteOrder(${order.id})">주문 삭제</button>
      </li>
    `;
  });
}

function deleteOrder(orderId) {
  orders = orders.filter((order) => order.id !== orderId);
  localStorage.setItem("orders", JSON.stringify(orders));
  displayOrders();
}

function clearOrders() {
  orders = [];
  localStorage.setItem("orders", JSON.stringify(orders));
  displayOrders();
}

function displayAdminProducts() {
  const adminList = document.getElementById("admin-product-list");

  if (!adminList) return;

  adminList.innerHTML = "";

  if (products.length === 0) {
    adminList.innerHTML = "<p>등록된 상품이 없습니다.</p>";
    return;
  }

  products.forEach((product) => {
    adminList.innerHTML += `
      <li>
        <strong>${product.name}</strong><br>
        카테고리: ${product.category}<br>
        가격: $${product.price}<br>
        재고: ${product.stock}<br>
        이미지: ${product.image}<br><br>

        <button onclick="editProduct(${product.id})">수정</button>
        <button onclick="deleteProduct(${product.id})">삭제</button>
      </li>
    `;
  });
}

function saveAdminProduct() {
  const editId = document.getElementById("edit-product-id").value;
  const name = document.getElementById("admin-name").value.trim();
  const category = document.getElementById("admin-category").value.trim();
  const price = Number(document.getElementById("admin-price").value);
  const image = document.getElementById("admin-image").value.trim();
  const description = document.getElementById("admin-description").value.trim();
  const stock = Number(document.getElementById("admin-stock").value);

  if (!name || !category || !price || !image || !description || stock < 0) {
    alert("상품 정보를 모두 올바르게 입력해주세요.");
    return;
  }

  if (editId) {
    const product = products.find((item) => item.id === Number(editId));

    if (!product) return;

    product.name = name;
    product.category = category;
    product.price = price;
    product.image = image;
    product.description = description;
    product.stock = stock;
  } else {
    const newProduct = {
      id: Date.now(),
      name,
      category,
      price,
      image,
      description,
      stock,
    };

    products.push(newProduct);
  }

  saveProducts();
  displayProducts(products);
  displayAdminProducts();
  clearAdminForm();
}

function editProduct(productId) {
  const product = products.find((item) => item.id === productId);

  if (!product) return;

  document.getElementById("edit-product-id").value = product.id;
  document.getElementById("admin-name").value = product.name;
  document.getElementById("admin-category").value = product.category;
  document.getElementById("admin-price").value = product.price;
  document.getElementById("admin-image").value = product.image;
  document.getElementById("admin-description").value = product.description;
  document.getElementById("admin-stock").value = product.stock;
}

function deleteProduct(productId) {
  const confirmDelete = confirm("정말 이 상품을 삭제하시겠습니까?");

  if (!confirmDelete) return;

  products = products.filter((product) => product.id !== productId);

  saveProducts();
  displayProducts(products);
  displayAdminProducts();
}

function deleteAllProducts() {
  const confirmDelete = confirm("모든 상품을 삭제하시겠습니까?");

  if (!confirmDelete) return;

  products = [];

  saveProducts();
  displayProducts(products);
  displayAdminProducts();
}

function resetProducts() {
  const confirmReset = confirm("상품을 기본 목록으로 초기화하시겠습니까?");

  if (!confirmReset) return;

  products = [...defaultProducts];

  saveProducts();
  displayProducts(products);
  displayAdminProducts();
}

function clearAdminForm() {
  const editId = document.getElementById("edit-product-id");
  const name = document.getElementById("admin-name");
  const category = document.getElementById("admin-category");
  const price = document.getElementById("admin-price");
  const image = document.getElementById("admin-image");
  const description = document.getElementById("admin-description");
  const stock = document.getElementById("admin-stock");

  if (!editId) return;

  editId.value = "";
  name.value = "";
  category.value = "";
  price.value = "";
  image.value = "";
  description.value = "";
  stock.value = "";
}

function adminLogin() {
  const username = document.getElementById("admin-username").value.trim();
  const password = document.getElementById("admin-password").value.trim();
  const message = document.getElementById("login-message");

  if (username === "admin" && password === "1234") {
    localStorage.setItem("isAdminLoggedIn", "true");

    document.getElementById("admin-login").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";

    displayAdminProducts();
  } else {
    message.textContent = "아이디 또는 비밀번호가 틀렸습니다.";
  }
}

function adminLogout() {
  localStorage.removeItem("isAdminLoggedIn");

  document.getElementById("admin-login").style.display = "block";
  document.getElementById("admin-panel").style.display = "none";
}

function checkAdminLogin() {
  const adminPanel = document.getElementById("admin-panel");
  const adminLoginBox = document.getElementById("admin-login");

  if (!adminPanel || !adminLoginBox) return;

  const isLoggedIn = localStorage.getItem("isAdminLoggedIn");

  if (isLoggedIn === "true") {
    adminLoginBox.style.display = "none";
    adminPanel.style.display = "block";
    displayAdminProducts();
  } else {
    adminLoginBox.style.display = "block";
    adminPanel.style.display = "none";
  }
}

async function signup() {
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  const message = document.getElementById("signup-message");

  if (!name || !email || !password) {
    message.textContent = "이름, 이메일, 비밀번호를 모두 입력해주세요.";
    return;
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password,
  };

  try {
    const response = await fetch(`${API_URL}/api/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newUser),
    });

    const data = await response.json();

    if (!response.ok) {
      message.textContent = data.error;
      return;
    }

    message.textContent = "회원가입이 완료되었습니다. 이제 로그인하세요.";

    document.getElementById("signup-name").value = "";
    document.getElementById("signup-email").value = "";
    document.getElementById("signup-password").value = "";
  } catch (error) {
    message.textContent = "서버 연결 실패로 회원가입을 할 수 없습니다.";
  }
}

async function userLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const message = document.getElementById("login-user-message");

  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      message.textContent = data.error;
      return;
    }

    currentUser = data.user;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    localStorage.setItem("token", data.token);

    message.textContent = `${currentUser.name}님, 로그인되었습니다.`;

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  } catch (error) {
    message.textContent = "서버 연결 실패로 로그인할 수 없습니다.";
  }
}

function userLogout() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("token");

  currentUser = null;

  alert("로그아웃되었습니다.");

  displayCurrentUser();
}

function displayCurrentUser() {
  const message = document.getElementById("current-user-message");

  if (!message) return;

  if (currentUser) {
    message.textContent = `${currentUser.name}님 로그인 중`;
  } else {
    message.textContent = "로그인되지 않았습니다.";
  }
}

function displayMyOrders() {
  const myOrderList = document.getElementById("my-order-list");

  if (!myOrderList) return;

  myOrderList.innerHTML = "";

  if (!currentUser) {
    myOrderList.innerHTML = "<p>주문내역을 보려면 먼저 로그인해주세요.</p>";
    return;
  }

  const myOrders = orders.filter((order) => order.userId === currentUser.id);

  if (myOrders.length === 0) {
    myOrderList.innerHTML = "<p>아직 주문내역이 없습니다.</p>";
    return;
  }

  myOrders.forEach((order) => {
    const itemNames = order.items
      .map((item) => `${item.name} x ${item.quantity}`)
      .join(", ");

    myOrderList.innerHTML += `
      <li>
        <strong>주문번호:</strong> ${order.id}<br>
        <strong>이름:</strong> ${order.customerName}<br>
        <strong>이메일:</strong> ${order.email}<br>
        <strong>주소:</strong> ${order.address}<br>
        <strong>상품:</strong> ${itemNames}<br>
        <strong>총액:</strong> $${order.total}<br>
        <strong>주문일:</strong> ${order.date}
      </li>
    `;
  });
}

function loadProfile() {
  const nameInput = document.getElementById("profile-name");
  const emailInput = document.getElementById("profile-email");

  if (!nameInput || !emailInput) return;

  if (!currentUser) {
    document.getElementById("profile-message").textContent =
      "정보를 수정하려면 먼저 로그인해주세요.";
    return;
  }

  nameInput.value = currentUser.name;
  emailInput.value = currentUser.email;
}

function updateProfile() {
  const name = document.getElementById("profile-name").value.trim();
  const password = document.getElementById("profile-password").value.trim();
  const message = document.getElementById("profile-message");

  if (!currentUser) {
    message.textContent = "로그인이 필요합니다.";
    return;
  }

  if (!name) {
    message.textContent = "이름을 입력해주세요.";
    return;
  }

  const user = users.find((user) => user.id === currentUser.id);

  if (!user) {
    message.textContent = "사용자 정보를 찾을 수 없습니다.";
    return;
  }

  user.name = name;

  if (password) {
    user.password = password;
  }

  currentUser.name = name;

  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  message.textContent = "회원 정보가 수정되었습니다.";

  document.getElementById("profile-password").value = "";
}

// 페이지별 실행
if (document.getElementById("product-list")) {
  loadProductsFromAPI();
}

if (document.getElementById("cart-list")) {
  updateCart();
}

if (document.getElementById("order-list")) {
  displayOrders();
}

if (document.getElementById("admin-product-list")) {
  displayAdminProducts();
}

checkAdminLogin();
displayCurrentUser();
displayMyOrders();
loadProfile();

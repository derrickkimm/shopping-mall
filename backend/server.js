const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 9000;
const JWT_SECRET = "fitgear-secret-key";

app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, "shop.db");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("DB 연결 실패:", err.message);
  } else {
    console.log("SQLite DB 연결 성공");
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      image TEXT,
      description TEXT,
      stock INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      userId INTEGER,
      userEmail TEXT,
      customerName TEXT,
      email TEXT,
      address TEXT,
      items TEXT,
      total INTEGER,
      date TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
});

const defaultProducts = [
  {
    id: 1,
    name: "덤벨 세트",
    category: "equipment",
    price: 49,
    image: "images/dumbbell.webp",
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
  {
    id: 20,
    name: "퍼포먼스 머슬핏 티셔츠",
    category: "clothes",
    price: 29,
    image: "https://via.placeholder.com/200?text=Muscle+Fit+Tee",
    description: "운동 시 땀 배출이 뛰어난 머슬핏 기능성 티셔츠입니다.",
    stock: 10,
  },
  {
    id: 21,
    name: "트레이닝 조거 팬츠",
    category: "clothes",
    price: 39,
    image: "https://via.placeholder.com/200?text=Jogger+Pants",
    description: "헬스와 러닝에 적합한 편안한 조거 팬츠입니다.",
    stock: 8,
  },
  {
    id: 22,
    name: "오버핏 후드집업",
    category: "clothes",
    price: 59,
    image: "https://via.placeholder.com/200?text=Hoodie",
    description: "운동 전후 가볍게 걸치기 좋은 오버핏 후드집업입니다.",
    stock: 6,
  },
  {
    id: 23,
    name: "컴프레션 레깅스",
    category: "clothes",
    price: 35,
    image: "https://via.placeholder.com/200?text=Leggings",
    description: "하체 운동 시 안정적인 압박을 제공하는 레깅스입니다.",
    stock: 7,
  },
  {
    id: 24,
    name: "헬스 반바지",
    category: "clothes",
    price: 27,
    image: "https://via.placeholder.com/200?text=Gym+Shorts",
    description: "통기성이 뛰어난 헬스 전용 반바지입니다.",
    stock: 12,
  },
  {
    id: 30,
    name: "웨이 프로틴",
    category: "supplement",
    price: 59,
    image: "https://via.placeholder.com/200?text=Whey+Protein",
    description: "근육 성장과 회복에 도움을 주는 프리미엄 웨이 프로틴입니다.",
    stock: 15,
  },
  {
    id: 31,
    name: "BCAA 아미노산",
    category: "supplement",
    price: 35,
    image: "https://via.placeholder.com/200?text=BCAA",
    description: "운동 중 근손실 방지와 회복을 위한 BCAA 보충제입니다.",
    stock: 11,
  },
  {
    id: 32,
    name: "크레아틴 파우더",
    category: "supplement",
    price: 42,
    image: "https://via.placeholder.com/200?text=Creatine",
    description: "고강도 운동 퍼포먼스를 향상시키는 크레아틴입니다.",
    stock: 9,
  },
  {
    id: 33,
    name: "프리워크아웃",
    category: "supplement",
    price: 49,
    image: "https://via.placeholder.com/200?text=Pre+Workout",
    description: "운동 전 집중력과 에너지를 높여주는 부스터입니다.",
    stock: 8,
  },
  {
    id: 34,
    name: "멀티비타민",
    category: "supplement",
    price: 24,
    image: "https://via.placeholder.com/200?text=Vitamin",
    description: "운동과 건강 관리를 위한 종합 비타민입니다.",
    stock: 14,
  },
];

function insertDefaultProductsIfEmpty() {
  db.get("SELECT COUNT(*) AS count FROM products", [], (err, row) => {
    if (err) {
      console.error("상품 개수 확인 실패:", err.message);
      return;
    }

    if (row.count > 0) {
      console.log("기존 상품 데이터가 있어서 기본 상품 삽입 안 함");
      return;
    }

    const stmt = db.prepare(`
      INSERT INTO products
      (id, name, category, price, image, description, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    defaultProducts.forEach((product) => {
      stmt.run(
        product.id,
        product.name,
        product.category,
        product.price,
        product.image,
        product.description,
        product.stock,
      );
    });

    stmt.finalize();

    console.log("기본 상품 DB 삽입 완료");
  });
}

insertDefaultProductsIfEmpty();

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "인증 토큰이 없습니다." });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "유효하지 않은 토큰입니다." });
    }

    req.user = user;
    next();
  });
}

app.get("/", (req, res) => {
  res.send("FitGear Shop API 서버 실행 중");
});

app.get("/api/test", (req, res) => {
  res.json({
    message: "테스트 성공",
    time: new Date().toLocaleString(),
  });
});

app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

app.post("/api/products", (req, res) => {
  const newProducts = req.body;

  db.serialize(() => {
    db.run("DELETE FROM products");

    const stmt = db.prepare(`
      INSERT INTO products
      (id, name, category, price, image, description, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    newProducts.forEach((product) => {
      stmt.run(
        product.id,
        product.name,
        product.category,
        product.price,
        product.image,
        product.description,
        product.stock,
      );
    });

    stmt.finalize();

    res.json({
      message: "상품 DB 저장 완료",
      products: newProducts,
    });
  });
});

app.post("/api/products/reset", (req, res) => {
  db.serialize(() => {
    db.run("DELETE FROM products");

    const stmt = db.prepare(`
      INSERT INTO products
      (id, name, category, price, image, description, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    defaultProducts.forEach((product) => {
      stmt.run(
        product.id,
        product.name,
        product.category,
        product.price,
        product.image,
        product.description,
        product.stock,
      );
    });

    stmt.finalize();

    res.json({
      message: "기본 상품으로 초기화 완료",
      products: defaultProducts,
    });
  });
});

app.post("/api/signup", async (req, res) => {
  console.log("회원가입 요청:", req.body);

  const { id, name, email, password } = req.body;

  if (!id || !name || !email || !password) {
    return res.status(400).json({
      error: "이름, 이메일, 비밀번호를 모두 입력해주세요.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `
    INSERT INTO users (id, name, email, password)
    VALUES (?, ?, ?, ?)
    `,
    [id, name, email, hashedPassword],
    function (err) {
      if (err) {
        return res.status(400).json({
          error: "이미 가입된 이메일이거나 회원가입에 실패했습니다.",
        });
      }

      res.json({
        message: "회원가입 성공",
        user: { id, name, email },
      });
    },
  );
});

app.post("/api/login", (req, res) => {
  console.log("로그인 요청:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "이메일과 비밀번호를 입력해주세요.",
    });
  }

  db.get(
    `
    SELECT id, name, email, password
    FROM users
    WHERE email = ?
    `,
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(401).json({
          error: "이메일 또는 비밀번호가 틀렸습니다.",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          error: "이메일 또는 비밀번호가 틀렸습니다.",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        JWT_SECRET,
        { expiresIn: "1h" },
      );

      res.json({
        message: "로그인 성공",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    },
  );
});

app.post("/api/orders", verifyToken, (req, res) => {
  const order = req.body;

  db.run(
    `
    INSERT INTO orders
    (id, userId, userEmail, customerName, email, address, items, total, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      order.id,
      req.user.id,
      req.user.email,
      order.customerName,
      order.email,
      order.address,
      JSON.stringify(order.items),
      order.total,
      order.date,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: "주문 DB 저장 완료",
        order,
      });
    },
  );
});

app.get("/api/orders", (req, res) => {
  db.all("SELECT * FROM orders ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const orders = rows.map((order) => ({
      ...order,
      items: JSON.parse(order.items),
    }));

    res.json(orders);
  });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

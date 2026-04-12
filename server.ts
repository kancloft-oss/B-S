import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import http from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // In-memory database for demo purposes
  const db = {
    products: [
      { id: "1", name: "Холст на подрамнике 40х50", price: 850, stock: 15, category: "Холсты", image: "https://picsum.photos/seed/canvas1/400/400", images: ["https://picsum.photos/seed/canvas1/400/400", "https://picsum.photos/seed/canvas1_2/400/400", "https://picsum.photos/seed/canvas1_3/400/400"], sku: "ART-C4050", description: "Качественный холст из 100% хлопка на деревянном подрамнике. Идеально подходит для масляной и акриловой живописи. Среднее зерно, акриловый грунт.", characteristics: [{ name: "Размер", value: "40х50 см" }, { name: "Материал", value: "100% хлопок" }, { name: "Плотность", value: "380 г/м2" }, { name: "Грунт", value: "Акриловый, 3 слоя" }] },
      { id: "2", name: "Набор акриловых красок 12 цветов", price: 1200, stock: 30, category: "Краски", image: "https://picsum.photos/seed/acrylic1/400/400", images: ["https://picsum.photos/seed/acrylic1/400/400", "https://picsum.photos/seed/acrylic1_2/400/400"], sku: "ART-A12", description: "Набор профессиональных акриловых красок. Высокая пигментация, отличная укрывистость и светостойкость. Подходят для различных поверхностей.", characteristics: [{ name: "Количество цветов", value: "12" }, { name: "Объем тубы", value: "18 мл" }, { name: "Основа", value: "Акриловая дисперсия" }] },
      { id: "3", name: "Кисть синтетика плоская №10", price: 250, stock: 50, category: "Кисти", image: "https://picsum.photos/seed/brush1/400/400", images: ["https://picsum.photos/seed/brush1/400/400", "https://picsum.photos/seed/brush1_2/400/400"], sku: "ART-B10S", description: "Плоская кисть из упругой синтетики. Отлично держит форму, подходит для работы с густыми красками (масло, акрил, темпера).", characteristics: [{ name: "Тип ворса", value: "Синтетика" }, { name: "Форма", value: "Плоская" }, { name: "Номер", value: "10" }, { name: "Ручка", value: "Дерево, длинная" }] },
      { id: "4", name: "Мольберт-тренога металлический", price: 2500, stock: 5, category: "Мольберты", image: "https://picsum.photos/seed/easel1/400/400", images: ["https://picsum.photos/seed/easel1/400/400"], sku: "ART-E01M", description: "Легкий и прочный металлический мольберт-тренога. Складная конструкция, удобен для пленэров и студийной работы. В комплекте чехол.", characteristics: [{ name: "Материал", value: "Алюминий" }, { name: "Макс. высота холста", value: "85 см" }, { name: "Вес", value: "1.2 кг" }] },
      { id: "5", name: "Скетчбук А5, 80 листов", price: 450, stock: 20, category: "Бумага", image: "https://picsum.photos/seed/sketchbook1/400/400", images: ["https://picsum.photos/seed/sketchbook1/400/400"], sku: "ART-SB-A5", description: "Стильный скетчбук формата А5 с плотной белой бумагой. Идеален для графики, линеров, карандашей и легкой акварели.", characteristics: [{ name: "Формат", value: "А5 (148х210 мм)" }, { name: "Количество листов", value: "80" }, { name: "Плотность бумаги", value: "120 г/м2" }] },
      { id: "6", name: "Масляные краски 'Мастер-Класс', набор", price: 3500, stock: 8, category: "Краски", image: "https://picsum.photos/seed/oilpaint1/400/400", images: ["https://picsum.photos/seed/oilpaint1/400/400"], sku: "ART-OMC12", description: "Профессиональные художественные масляные краски. Изготавливаются на основе высококачественных пигментов и связующих.", characteristics: [{ name: "Количество цветов", value: "12" }, { name: "Объем тубы", value: "18 мл" }, { name: "Серия", value: "Профессиональная" }] },
      { id: "7", name: "Акварель 'Белые ночи' 24 кюветы", price: 2100, stock: 12, category: "Краски", image: "https://picsum.photos/seed/watercolor1/400/400", images: ["https://picsum.photos/seed/watercolor1/400/400"], sku: "ART-WN24", description: "Художественные акварельные краски высшего качества. Отличаются высокой концентрацией пигмента и превосходной прозрачностью.", characteristics: [{ name: "Количество цветов", value: "24" }, { name: "Форма выпуска", value: "Кюветы (2.5 мл)" }, { name: "Упаковка", value: "Пластиковая коробка с палитрой" }] },
      { id: "8", name: "Набор профессиональных маркеров 36 шт", price: 4200, stock: 10, category: "Графика", image: "https://picsum.photos/seed/markers1/400/400", images: ["https://picsum.photos/seed/markers1/400/400"], sku: "ART-MK36", description: "Двусторонние спиртовые маркеры для скетчинга и иллюстрации. Наконечники: долото и тонкое перо. Плавные градиенты.", characteristics: [{ name: "Количество", value: "36 шт" }, { name: "Тип", value: "Спиртовые" }, { name: "Наконечники", value: "Долото / Пуля" }] },
      { id: "9", name: "Карандаши чернографитные, набор 12 шт", price: 650, stock: 45, category: "Графика", image: "https://picsum.photos/seed/pencils1/400/400", images: ["https://picsum.photos/seed/pencils1/400/400"], sku: "ART-GP12", description: "Набор профессиональных чернографитных карандашей различной твердости (от 2H до 8B). Для черчения, скетчинга и академического рисунка.", characteristics: [{ name: "Количество", value: "12 шт" }, { name: "Твердость", value: "2H - 8B" }, { name: "Материал корпуса", value: "Кедр" }] },
      { id: "10", name: "Палитра деревянная овальная", price: 350, stock: 25, category: "Аксессуары", image: "https://picsum.photos/seed/palette1/400/400", images: ["https://picsum.photos/seed/palette1/400/400"], sku: "ART-PAL-W", description: "Классическая деревянная палитра для смешивания масляных и акриловых красок. Пропитана маслом для защиты от впитывания.", characteristics: [{ name: "Материал", value: "Фанера, пропитка" }, { name: "Форма", value: "Овальная" }, { name: "Размер", value: "30х40 см" }] },
      { id: "11", name: "Холст на картоне 30х40", price: 320, stock: 40, category: "Холсты", image: "https://picsum.photos/seed/canvas2/400/400", images: ["https://picsum.photos/seed/canvas2/400/400"], sku: "ART-CC3040", description: "Грунтованный холст на плотном картоне. Бюджетный вариант для эскизов, этюдов и начинающих художников.", characteristics: [{ name: "Размер", value: "30х40 см" }, { name: "Материал", value: "100% хлопок" }, { name: "Основа", value: "Картон 3 мм" }] },
      { id: "12", name: "Мастихин каплевидный №4", price: 280, stock: 35, category: "Инструменты", image: "https://picsum.photos/seed/paletteknife1/400/400", images: ["https://picsum.photos/seed/paletteknife1/400/400"], sku: "ART-PK04", description: "Художественный мастихин с гибким стальным лезвием каплевидной формы. Деревянная ручка. Для пастозной живописи и смешивания красок.", characteristics: [{ name: "Форма лезвия", value: "Каплевидная" }, { name: "Длина лезвия", value: "45 мм" }, { name: "Материал", value: "Нержавеющая сталь, дерево" }] },
      { id: "13", name: "Бумага для акварели 100% хлопок, А3", price: 1100, stock: 18, category: "Бумага", image: "https://picsum.photos/seed/paper1/400/400", images: ["https://picsum.photos/seed/paper1/400/400"], sku: "ART-WP-A3C", description: "Профессиональная акварельная бумага из 100% хлопка. Выдерживает многократные отмывки и лессировки. Фактура среднее зерно (Fin).", characteristics: [{ name: "Формат", value: "А3" }, { name: "Состав", value: "100% хлопок" }, { name: "Плотность", value: "300 г/м2" }, { name: "Фактура", value: "Среднее зерно (Fin)" }] },
      { id: "14", name: "Лак акриловый глянцевый 100мл", price: 450, stock: 22, category: "Вспомогательные", image: "https://picsum.photos/seed/varnish1/400/400", images: ["https://picsum.photos/seed/varnish1/400/400"], sku: "ART-VAR-G100", description: "Финишный глянцевый лак для покрытия готовых работ, выполненных акриловыми или темперными красками. Защищает от пыли и влаги.", characteristics: [{ name: "Объем", value: "100 мл" }, { name: "Эффект", value: "Глянцевый" }, { name: "Основа", value: "Водно-акриловая" }] },
      { id: "15", name: "Разбавитель 'Тройник' 120мл", price: 380, stock: 15, category: "Вспомогательные", image: "https://picsum.photos/seed/solvent1/400/400", images: ["https://picsum.photos/seed/solvent1/400/400"], sku: "ART-SOL-T120", description: "Классический разбавитель для масляных красок. Состоит из льняного масла, скипидара и даммарного лака. Улучшает разносимость красок.", characteristics: [{ name: "Объем", value: "120 мл" }, { name: "Назначение", value: "Для масляной живописи" }, { name: "Состав", value: "Масло, скипидар, лак" }] },
      { id: "16", name: "Этюдник деревянный с ножками", price: 8500, stock: 3, category: "Мольберты", image: "https://picsum.photos/seed/pochade1/400/400", images: ["https://picsum.photos/seed/pochade1/400/400"], sku: "ART-POCH-W", description: "Классический деревянный этюдник для пленэрной живописи. Оснащен телескопическими алюминиевыми ножками, палитрой и ящиком для красок.", characteristics: [{ name: "Материал", value: "Вяз, алюминий" }, { name: "Вес", value: "4.5 кг" }, { name: "Макс. высота холста", value: "87 см" }] },
      { id: "17", name: "Кисть белка круглая №5", price: 420, stock: 28, category: "Кисти", image: "https://picsum.photos/seed/brush2/400/400", images: ["https://picsum.photos/seed/brush2/400/400"], sku: "ART-B05SQ", description: "Круглая кисть из натурального волоса белки. Отлично набирает и отдает воду, собирается в тонкий кончик. Идеальна для акварели.", characteristics: [{ name: "Тип ворса", value: "Белка натуральная" }, { name: "Форма", value: "Круглая" }, { name: "Номер", value: "5" }] },
      { id: "18", name: "Линер черный 0.3мм", price: 150, stock: 60, category: "Графика", image: "https://picsum.photos/seed/liner1/400/400", images: ["https://picsum.photos/seed/liner1/400/400"], sku: "ART-LIN-03", description: "Капиллярная ручка (линер) с водостойкими архивными чернилами. Не размазывается маркерами и акварелью. Толщина линии 0.3 мм.", characteristics: [{ name: "Цвет", value: "Черный" }, { name: "Толщина линии", value: "0.3 мм" }, { name: "Чернила", value: "Пигментные, водостойкие" }] },
      { id: "19", name: "Пастель сухая 48 цветов", price: 2800, stock: 7, category: "Графика", image: "https://picsum.photos/seed/pastel1/400/400", images: ["https://picsum.photos/seed/pastel1/400/400"], sku: "ART-PAS-48", description: "Набор мягкой сухой пастели. Яркие, насыщенные цвета, легко растушевываются и смешиваются между собой. Квадратное сечение мелков.", characteristics: [{ name: "Количество цветов", value: "48" }, { name: "Тип", value: "Сухая, мягкая" }, { name: "Форма", value: "Квадратная" }] },
      { id: "20", name: "Фартук художника холщовый", price: 1200, stock: 14, category: "Аксессуары", image: "https://picsum.photos/seed/apron1/400/400", images: ["https://picsum.photos/seed/apron1/400/400"], sku: "ART-APR-C", description: "Плотный холщовый фартук для защиты одежды во время работы. Регулируемые лямки на спине (крест-накрест), удобные карманы для кистей.", characteristics: [{ name: "Материал", value: "100% хлопок (канвас)" }, { name: "Размер", value: "Универсальный" }, { name: "Цвет", value: "Бежевый" }] },
    ],
    orders: [
      { id: "ORD-001", customer: "Иван Иванов", phone: "+7 (999) 123-45-67", total: 2050, status: "new", items: [{ productId: "1", qty: 1 }, { productId: "2", qty: 1 }], date: new Date().toISOString() },
      { id: "ORD-002", customer: "Анна Смирнова", phone: "+7 (999) 765-43-21", total: 450, status: "assembling", items: [{ productId: "5", qty: 1 }], date: new Date(Date.now() - 86400000).toISOString() },
    ],
    analytics: {
      revenue: 154000,
      ordersCount: 124,
      averageCheck: 1241,
      conversionRate: 3.2,
      salesData: [
        { date: "Пн", sales: 12000 },
        { date: "Вт", sales: 15000 },
        { date: "Ср", sales: 11000 },
        { date: "Чт", sales: 18000 },
        { date: "Пт", sales: 22000 },
        { date: "Сб", sales: 35000 },
        { date: "Вс", sales: 41000 },
      ]
    }
  };

  // API Routes
  app.get("/api/products", (req, res) => {
    res.json(db.products);
  });

  app.get("/api/products/:id", (req, res) => {
    const product = db.products.find(p => p.id === req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  });

  app.get("/api/search", (req, res) => {
    const query = (req.query.q as string || "").toLowerCase();
    if (!query) {
      res.json([]);
      return;
    }
    const results = db.products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
    res.json(results);
  });

  app.get("/api/orders", (req, res) => {
    const populatedOrders = db.orders.map(order => ({
      ...order,
      items: order.items.map(item => {
        const product = db.products.find(p => p.id === item.productId);
        return { ...item, product };
      })
    }));
    res.json(populatedOrders);
  });

  app.get("/api/my-orders", (req, res) => {
    // Mock user orders (returning all for demo purposes)
    const populatedOrders = db.orders.map(order => ({
      ...order,
      items: order.items.map(item => {
        const product = db.products.find(p => p.id === item.productId);
        return { ...item, product };
      })
    }));
    res.json(populatedOrders);
  });

  app.post("/api/orders", (req, res) => {
    const newOrder = {
      id: `ORD-${String(db.orders.length + 1).padStart(3, '0')}`,
      ...req.body,
      status: "new",
      date: new Date().toISOString()
    };
    db.orders.unshift(newOrder);
    res.status(201).json(newOrder);
  });

  app.put("/api/orders/:id", (req, res) => {
    const order = db.orders.find(o => o.id === req.params.id);
    if (order) {
      if (req.body.items) order.items = req.body.items;
      if (req.body.total !== undefined) order.total = req.body.total;
      res.json(order);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  app.patch("/api/orders/:id/status", (req, res) => {
    const order = db.orders.find(o => o.id === req.params.id);
    if (order) {
      order.status = req.body.status;
      io.emit("orderStatusUpdated", { orderId: order.id, status: order.status });
      res.json(order);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  app.post("/api/orders/:id/pay", (req, res) => {
    const order = db.orders.find(o => o.id === req.params.id);
    if (order) {
      order.status = "paid";
      res.json(order);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  app.get("/api/analytics", (req, res) => {
    res.json(db.analytics);
  });

  // 1C Integration Endpoint (Mock)
  // В реальности здесь будет обработка CommerceML XML файлов
  app.post("/api/1c/exchange", (req, res) => {
    const type = req.query.type;
    const mode = req.query.mode;
    
    console.log(`1C Exchange request: type=${type}, mode=${mode}`);
    
    if (type === "catalog" && mode === "checkauth") {
      res.send("success\nCookieName\nCookieValue");
    } else if (type === "catalog" && mode === "init") {
      res.send("zip=no\nfile_limit=10485760");
    } else if (type === "catalog" && mode === "file") {
      // Обработка загруженного файла import.xml или offers.xml
      res.send("success");
    } else if (type === "catalog" && mode === "import") {
      // Запуск импорта из загруженного файла
      res.send("success");
    } else if (type === "sale" && mode === "query") {
      // Выгрузка заказов в 1С
      res.send("success"); // В реальности здесь XML с заказами
    } else if (type === "sale" && mode === "success") {
      // 1С подтвердила получение заказов
      res.send("success");
    } else {
      res.send("success");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

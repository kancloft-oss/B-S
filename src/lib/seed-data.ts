import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db, auth } from "../firebase";

export const productsData = [
  // Кисти (5)
  { id: "1", name: "Кисть синтетика круглая №5 (Roubloff)", price: 350, stock: 50, category: "Кисти", image: "https://picsum.photos/seed/brush_roubloff5/400/400", images: ["https://picsum.photos/seed/brush_roubloff5/400/400"], sku: "BR-SYN-05", description: "Профессиональная круглая кисть из мягкой синтетики. Отлично держит воду и образует острый кончик. Подходит для акварели и гуаши.", characteristics: [{ name: "Бренд", value: "Roubloff" }, { name: "Ворс", value: "Синтетика" }, { name: "Форма", value: "Круглая" }, { name: "Размер", value: "5" }] },
  { id: "2", name: "Кисть щетина плоская №10 (Малевичъ)", price: 280, stock: 40, category: "Кисти", image: "https://picsum.photos/seed/brush_bristle10/400/400", images: ["https://picsum.photos/seed/brush_bristle10/400/400"], sku: "BR-BRS-10", description: "Плоская кисть из натуральной щетины. Жесткий ворс идеально подходит для пастозной живописи маслом и акрилом.", characteristics: [{ name: "Бренд", value: "Малевичъ" }, { name: "Ворс", value: "Щетина" }, { name: "Форма", value: "Плоская" }, { name: "Размер", value: "10" }] },
  { id: "3", name: "Кисть белка круглая №3 (Невская палитра)", price: 450, stock: 30, category: "Кисти", image: "https://picsum.photos/seed/brush_squirrel3/400/400", images: ["https://picsum.photos/seed/brush_squirrel3/400/400"], sku: "BR-SQR-03", description: "Мягкая кисть из натурального волоса белки. Прекрасно впитывает влагу, незаменима для акварельных заливок.", characteristics: [{ name: "Бренд", value: "Невская палитра" }, { name: "Ворс", value: "Белка" }, { name: "Форма", value: "Круглая" }, { name: "Размер", value: "3" }] },
  { id: "4", name: "Набор кистей для акварели 5 шт (Pinax)", price: 1200, stock: 15, category: "Кисти", image: "https://picsum.photos/seed/brush_set5/400/400", images: ["https://picsum.photos/seed/brush_set5/400/400"], sku: "BR-SET-05", description: "Универсальный набор кистей из синтетики имитации белки. Включает круглые и плоские кисти разных размеров.", characteristics: [{ name: "Бренд", value: "Pinax" }, { name: "Ворс", value: "Синтетика (имитация белки)" }, { name: "Количество", value: "5 шт" }] },
  { id: "5", name: "Кисть колонок круглая №1 (Roubloff)", price: 550, stock: 25, category: "Кисти", image: "https://picsum.photos/seed/brush_kolinsky1/400/400", images: ["https://picsum.photos/seed/brush_kolinsky1/400/400"], sku: "BR-KOL-01", description: "Тонкая кисть из волоса колонка для проработки мелких деталей. Отличается упругостью и долговечностью.", characteristics: [{ name: "Бренд", value: "Roubloff" }, { name: "Ворс", value: "Колонок" }, { name: "Форма", value: "Круглая" }, { name: "Размер", value: "1" }] },

  // Мольберты (5)
  { id: "6", name: "Мольберт-лира студийный (Сонет)", price: 3500, stock: 10, category: "Мольберты", image: "https://picsum.photos/seed/easel_lyre/400/400", images: ["https://picsum.photos/seed/easel_lyre/400/400"], sku: "ES-LYR-01", description: "Классический А-образный мольберт из сосны. Регулируемая высота мачты и угол наклона. Подходит для холстов до 120 см.", characteristics: [{ name: "Бренд", value: "Сонет" }, { name: "Тип", value: "Лира" }, { name: "Материал", value: "Сосна" }, { name: "Макс. высота холста", value: "120 см" }] },
  { id: "7", name: "Настольный мольберт-планшет (Малевичъ)", price: 1800, stock: 20, category: "Мольберты", image: "https://picsum.photos/seed/easel_table/400/400", images: ["https://picsum.photos/seed/easel_table/400/400"], sku: "ES-TBL-02", description: "Компактный настольный мольберт со встроенным планшетом. Идеален для графики, акварели и небольших форматов.", characteristics: [{ name: "Бренд", value: "Малевичъ" }, { name: "Тип", value: "Настольный" }, { name: "Материал", value: "Бук" }, { name: "Размер планшета", value: "A3" }] },
  { id: "8", name: "Мольберт тренога алюминиевый (Brauberg)", price: 2100, stock: 15, category: "Мольберты", image: "https://picsum.photos/seed/easel_tripod/400/400", images: ["https://picsum.photos/seed/easel_tripod/400/400"], sku: "ES-TRP-03", description: "Легкий складной мольберт для пленэров. Телескопические ножки, чехол в комплекте. Вес всего 1 кг.", characteristics: [{ name: "Бренд", value: "Brauberg" }, { name: "Тип", value: "Тренога" }, { name: "Материал", value: "Алюминий" }, { name: "Вес", value: "1 кг" }] },
  { id: "9", name: "Этюдник деревянный с палитрой (Подольск)", price: 6500, stock: 5, category: "Мольберты", image: "https://picsum.photos/seed/easel_pochade/400/400", images: ["https://picsum.photos/seed/easel_pochade/400/400"], sku: "ES-PCH-04", description: "Профессиональный этюдник для масляной живописи на природе. Встроенный ящик для красок, деревянная палитра и складные ножки.", characteristics: [{ name: "Бренд", value: "Подольск" }, { name: "Тип", value: "Этюдник" }, { name: "Материал", value: "Береза/Фанера" }, { name: "Вес", value: "4.5 кг" }] },
  { id: "10", name: "Мольберт студийный станковый (Pinax)", price: 12000, stock: 3, category: "Мольберты", image: "https://picsum.photos/seed/easel_studio/400/400", images: ["https://picsum.photos/seed/easel_studio/400/400"], sku: "ES-STD-05", description: "Тяжелый и устойчивый станковый мольберт для больших форматов. Оснащен полкой для кистей и надежным механизмом фиксации.", characteristics: [{ name: "Бренд", value: "Pinax" }, { name: "Тип", value: "Станковый" }, { name: "Материал", value: "Бук (промасленный)" }, { name: "Макс. высота холста", value: "210 см" }] },

  // Краски (5)
  { id: "11", name: "Акварель 'Белые ночи' 24 кюветы", price: 2400, stock: 25, category: "Краски", image: "https://picsum.photos/seed/paint_watercolor24/400/400", images: ["https://picsum.photos/seed/paint_watercolor24/400/400"], sku: "PT-WC-24", description: "Легендарная профессиональная акварель в пластиковом пенале с палитрой. Высокая светостойкость и чистота цвета.", characteristics: [{ name: "Бренд", value: "Невская палитра" }, { name: "Тип", value: "Акварель" }, { name: "Количество цветов", value: "24" }, { name: "Форма выпуска", value: "Кюветы" }] },
  { id: "12", name: "Масляные краски 'Мастер-Класс' 12 туб", price: 3800, stock: 12, category: "Краски", image: "https://picsum.photos/seed/paint_oil12/400/400", images: ["https://picsum.photos/seed/paint_oil12/400/400"], sku: "PT-OIL-12", description: "Набор художественных масляных красок высшего качества. Густая консистенция, насыщенные пигменты.", characteristics: [{ name: "Бренд", value: "Невская палитра" }, { name: "Тип", value: "Масло" }, { name: "Количество цветов", value: "12" }, { name: "Объем тубы", value: "18 мл" }] },
  { id: "13", name: "Акрил художественный 'Ладога' 10 цветов", price: 1500, stock: 30, category: "Краски", image: "https://picsum.photos/seed/paint_acrylic10/400/400", images: ["https://picsum.photos/seed/paint_acrylic10/400/400"], sku: "PT-ACR-10", description: "Студийный акрил с отличной укрывистостью. Подходит для живописи на холсте, картоне, дереве.", characteristics: [{ name: "Бренд", value: "Невская палитра" }, { name: "Тип", value: "Акрил" }, { name: "Количество цветов", value: "10" }, { name: "Объем тубы", value: "46 мл" }] },
  { id: "14", name: "Гуашь художественная 'Сонет' 12 цветов", price: 850, stock: 40, category: "Краски", image: "https://picsum.photos/seed/paint_gouache12/400/400", images: ["https://picsum.photos/seed/paint_gouache12/400/400"], sku: "PT-GOU-12", description: "Набор гуаши для начинающих художников и студентов. Бархатистая матовая поверхность после высыхания.", characteristics: [{ name: "Бренд", value: "Сонет" }, { name: "Тип", value: "Гуашь" }, { name: "Количество цветов", value: "12" }, { name: "Объем баночки", value: "40 мл" }] },
  { id: "15", name: "Темпера ПВА 'Мастер-Класс' 10 туб", price: 2100, stock: 8, category: "Краски", image: "https://picsum.photos/seed/paint_tempera10/400/400", images: ["https://picsum.photos/seed/paint_tempera10/400/400"], sku: "PT-TMP-10", description: "Поливинилацетатная темпера. Быстро сохнет, образует несмываемую матовую пленку. Традиционный материал для росписи.", characteristics: [{ name: "Бренд", value: "Невская палитра" }, { name: "Тип", value: "Темпера" }, { name: "Количество цветов", value: "10" }, { name: "Объем тубы", value: "46 мл" }] },

  // Карандаши (Графика) (5)
  { id: "16", name: "Набор чернографитных карандашей Faber-Castell 9000", price: 1400, stock: 20, category: "Графика", image: "https://picsum.photos/seed/pencil_faber12/400/400", images: ["https://picsum.photos/seed/pencil_faber12/400/400"], sku: "PN-GRF-12", description: "Легендарные зеленые карандаши Castell 9000. Набор из 12 степеней твердости в металлическом пенале. Идеальны для черчения и скетчей.", characteristics: [{ name: "Бренд", value: "Faber-Castell" }, { name: "Тип", value: "Чернографитные" }, { name: "Количество", value: "12 шт" }, { name: "Твердость", value: "8B - 2H" }] },
  { id: "17", name: "Цветные карандаши Prismacolor Premier (24 цвета)", price: 4500, stock: 10, category: "Графика", image: "https://picsum.photos/seed/pencil_prisma24/400/400", images: ["https://picsum.photos/seed/pencil_prisma24/400/400"], sku: "PN-COL-24", description: "Профессиональные цветные карандаши на восковой основе. Невероятно мягкий грифель, яркие цвета, идеальная растушевка.", characteristics: [{ name: "Бренд", value: "Prismacolor" }, { name: "Тип", value: "Цветные (восковые)" }, { name: "Количество", value: "24 шт" }] },
  { id: "18", name: "Акварельные карандаши Koh-i-Noor Mondeluz (36 цветов)", price: 2800, stock: 15, category: "Графика", image: "https://picsum.photos/seed/pencil_kohinoor36/400/400", images: ["https://picsum.photos/seed/pencil_kohinoor36/400/400"], sku: "PN-AQU-36", description: "Высококачественные акварельные карандаши. Пигмент легко размывается водой, создавая эффект настоящей акварели.", characteristics: [{ name: "Бренд", value: "Koh-i-Noor" }, { name: "Тип", value: "Акварельные" }, { name: "Количество", value: "36 шт" }] },
  { id: "19", name: "Пастельные карандаши Derwent Pastel (12 цветов)", price: 3200, stock: 8, category: "Графика", image: "https://picsum.photos/seed/pencil_derwent12/400/400", images: ["https://picsum.photos/seed/pencil_derwent12/400/400"], sku: "PN-PST-12", description: "Сухая пастель в деревянном корпусе. Позволяет прорисовывать мелкие детали, сохраняя бархатистую фактуру пастели.", characteristics: [{ name: "Бренд", value: "Derwent" }, { name: "Тип", value: "Пастельные" }, { name: "Количество", value: "12 шт" }] },
  { id: "20", name: "Набор для графики Cretacolor (уголь, сепия)", price: 1900, stock: 12, category: "Графика", image: "https://picsum.photos/seed/pencil_creta/400/400", images: ["https://picsum.photos/seed/pencil_creta/400/400"], sku: "PN-DRW-SET", description: "Базовый набор для классического рисунка. Включает угольные карандаши, сепию, сангину, белый мел и растушевку.", characteristics: [{ name: "Бренд", value: "Cretacolor" }, { name: "Тип", value: "Материалы для графики" }, { name: "Комплектация", value: "Карандаши, мелки, аксессуары" }] }
];

export async function seedDatabase() {
  try {
    const productsRef = collection(db, "products");
    console.log("Seeding database with initial products...");
    
    // Check if products already exist to avoid unnecessary writes
    const snapshot = await getDocs(productsRef);
    if (!snapshot.empty) {
      console.log("Database already has products, skipping seed.");
      return;
    }

    const batch = writeBatch(db);
    
    productsData.forEach((product) => {
      const docRef = doc(productsRef, product.id);
      batch.set(docRef, product);
    });
    
    await batch.commit();
    console.log("Database seeded successfully!");
  } catch (error) {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      auth: {
        uid: auth.currentUser?.uid,
        email: auth.currentUser?.email
      },
      operation: "seedDatabase",
      path: "products"
    };
    console.error("Error seeding database:", JSON.stringify(errInfo));
  }
}

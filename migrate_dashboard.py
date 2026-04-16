import re
import sys

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove firestore imports
    content = re.sub(r'import { collection, getDocs,.*?from "firebase/firestore";\n?', '', content)
    
    # 2. OrdersView fetchOrders
    orders_view_fetch = """  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if(res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/orders/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchOrders();
      if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteOrder = async (id: string) => {
    if (window.confirm("Удалить заказ?")) {
      try {
        await fetch('/api/orders/' + id, { method: 'DELETE' });
        fetchOrders();
        setSelectedOrder(null);
      } catch (error) {
        console.error(error);
      }
    }
  };"""
    content = re.sub(r'const fetchOrders = async \(\) => \{.*?const deleteOrder = async.*?\}\n  \};', orders_view_fetch, content, flags=re.DOTALL)

    # 3. CRMView fetch orders
    crm_fetch = """      try {
        const res = await fetch('/api/orders');
        const ordersData = res.ok ? await res.json() : [];
        setOrders(ordersData);"""
    content = re.sub(r'      try \{\n        const ordersSnapshot = await getDocs\(collection\(db, "orders"\)\);\n        const ordersData = ordersSnapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \} as Order\)\);\n        setOrders\(ordersData\);', crm_fetch, content)

    # 4. ProductMatrixView fetchProducts
    pmv_fetch = """  const fetchProducts = async (isInitial = false) => {
    setLoading(true);
    try {
      const currentOffset = isInitial ? 0 : products.length;
      const res = await fetch(`/api/products?limit=${PAGE_SIZE}&offset=${currentOffset}`);
      const newProducts = await res.json();
      
      if (isInitial) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }

      setHasMore(newProducts.length === PAGE_SIZE);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };"""
    content = re.sub(r'  const fetchProducts = async.*?finally \{\n      setLoading\(false\);\n    \}\n  \};', pmv_fetch, content, flags=re.DOTALL)

    # 5. ProductMatrixView handleSearch
    pmv_search = """  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) {
      fetchProducts(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}&limit=10`);
      const data = await res.json();
      setProducts(data);
      setHasMore(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };"""
    content = re.sub(r'  const handleSearch = async.*?finally \{\n      setLoading\(false\);\n    \}\n  \};', pmv_search, content, flags=re.DOTALL)

    # 6. Import1CView fetchStats
    i_fetch_stats = """  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalProducts: data.totalProducts || 0,
          totalCategories: data.totalCategories || 0,
          newProducts: data.newProducts7d || 0,
          lastUpdate: data.lastUpdate ? new Date(data.lastUpdate).toLocaleString('ru-RU') : 'Нет данных'
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };"""
    content = re.sub(r'  const fetchStats = async \(\) => \{.*?\}\n  \};', i_fetch_stats, content, count=1, flags=re.DOTALL)

    # 7. Import1CView handleImport
    i_handle = """  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setLogs([]);
    setProgress(0);
    addLog("Начало высокоскоростной синхронизации через наш API...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      addLog(`Файл прочитан. Найдено строк: ${jsonData.length}`);
      
      const CHUNK_SIZE = 500;
      const chunks = [];
      for (let i = 0; i < jsonData.length; i += CHUNK_SIZE) {
        chunks.push(jsonData.slice(i, i + CHUNK_SIZE));
      }

      let processedCount = 0;
      for (let idx = 0; idx < chunks.length; idx++) {
        const chunk = chunks[idx];
        const payload = chunk.map((row: any) => ({
          name: row['Наименование'] || '',
          price: Number(row['Розничная цена ₽']) || 0,
          stock: Number(row['Остаток']) || 0,
          sku: String(row['Артикул'] || row['Код'] || ''),
          category: row['Категория'] || 'Без категории',
          description: row['Описание'] || ''
        }));
        
        const res = await fetch('/api/products/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: payload })
        });
        
        if (!res.ok) throw new Error('Ошибка сети при загрузке чанка');
        
        processedCount += chunk.length;
        setProgress(Math.round((processedCount / jsonData.length) * 100));
        addLog(`Отправлено ${processedCount} из ${jsonData.length} товаров...`);
      }
      
      addLog("Обновление категорий...");
      const uniqueCats = new Set(jsonData.map((row: any) => row['Категория'] || 'Без категории'));
      for (const cat of uniqueCats) {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cat })
        });
      }

      setProgress(100);
      addLog("Синхронизация успешно завершена.");
      fetchStats();
      
    } catch (error: any) {
      console.error(error);
      addLog("ОШИБКА: " + error.message);
    } finally {
      setLoading(false);
      setFile(null);
    }
  };"""
    content = re.sub(r'  const handleImport = async \(\) => \{.*?setFile\(null\);\n    \}\n  \};', i_handle, content, flags=re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('src/pages/AdminDashboard.tsx')
process_file('src/pages/ProductDetails.tsx')
process_file('src/pages/UserDashboard.tsx')

import re
import sys

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # ProductDetails
    if 'ProductDetails' in filepath:
        content = re.sub(r'import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";', '', content)
        
        fetch_prod = """        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Product not found");
        const productData = await res.json();
        setProduct(productData);
        
        const catRes = await fetch(`/api/products?category=${encodeURIComponent(productData.category)}&limit=5`);
        if (catRes.ok) {
          const simData = await catRes.json();
          setSimilarProducts(simData.filter((p: any) => p.id !== id));
        }"""
        content = re.sub(r'        const docRef = doc\(db, "products", id\);.*?setSimilarProducts\(simProductsData\);', fetch_prod, content, flags=re.DOTALL)
        
    # UserDashboard
    elif 'UserDashboard' in filepath:
        content = re.sub(r'import { collection, getDocs, query, where, doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";', '', content)
        
        user_fetch = """        const res = await fetch('/api/orders');
        if (res.ok) {
          const allOrders = await res.json();
          setOrders(allOrders.filter((o: any) => o.userId === user.uid));
        }"""
        content = re.sub(r'        const q = query\(collection\(db, "orders"\), where\("userId", "==", user\.uid\)\);.*?setOrders\(data\);', user_fetch, content, flags=re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('src/pages/ProductDetails.tsx')
process_file('src/pages/UserDashboard.tsx')

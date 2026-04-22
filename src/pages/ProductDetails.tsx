import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingCart, Plus, Minus, ChevronRight, ChevronLeft, Star, MapPin, Truck, CheckCircle2, Package, BarChart2, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useCart, Product } from "@/src/lib/cart-context";

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [complementaryProducts, setComplementaryProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState("characteristics");
  const similarScrollRef = React.useRef<HTMLDivElement>(null);
  const complementaryScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollSimilar = (dir: 'left' | 'right') => {
    if (similarScrollRef.current) {
      const scrollAmount = 300;
      similarScrollRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollComplementary = (dir: 'left' | 'right') => {
    if (complementaryScrollRef.current) {
      const scrollAmount = 300;
      complementaryScrollRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const { cart, favorites, addToCart, updateQuantity, toggleFavorite } = useCart();

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        
        if (res.ok) {
          const productData = await res.json();
          setProduct(productData);
          setActiveImage(0);
          
          // Fetch similar products using categoryId
          const catId = productData.categoryId || productData.category;
          
          if (catId) {
            const simRes = await fetch(`/api/products?category=${encodeURIComponent(catId)}&limit=10`);
            if (simRes.ok) {
              const similar = await simRes.json();
              setSimilarProducts(similar.filter((p: any) => p.id !== id).slice(0, 8));
            }
          }
          
          // Fetch complementary products
          try {
            const compRes = await fetch(`/api/products/${id}/complements`);
            if (compRes.ok) {
              const complements = await compRes.json();
              setComplementaryProducts(complements);
            }
          } catch (e) { console.error(e); }
          
          // Fetch categories for breadcrumbs
          const catRes = await fetch(`/api/categories`);
          if (catRes.ok) {
            setCategories(await catRes.json());
          }
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-zinc-500">Загрузка товара...</div>;
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Товар не найден</h2>
        <Button onClick={() => navigate("/")} className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold">
          Вернуться в каталог
        </Button>
      </div>
    );
  }

  const inCart = cart.find(item => item.id === product.id);
  const isFavorite = favorites.includes(product.id);
  const oldPrice = Math.floor(product.price / 0.97);
  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  // Helper to build real breadcrumbs from active categories
  const getBreadcrumbs = () => {
    let crumbs = [{ name: "Главная", link: "/" }];
    if (!product.categoryId) return crumbs;

    const buildPath = (catId: string, currentPath: any[] = []): any[] => {
      const cat = categories.find(c => c.id === catId);
      if (!cat) return currentPath;
      const newPath = [{ name: cat.name, link: "/" }, ...currentPath];
      if (cat.parentId) {
        return buildPath(cat.parentId, newPath);
      }
      return newPath;
    };

    const path = buildPath(product.categoryId);
    return [...crumbs, ...path];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="pb-20 md:pb-16 max-w-[1400px] mx-auto px-4 lg:px-8">
      {/* Breadcrumbs */}
      <div className="hidden md:flex items-center gap-1.5 text-[13px] text-zinc-500 mb-4 mt-6 flex-wrap">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            <Link to={crumb.link} className="hover:text-brand-red transition-colors">{crumb.name}</Link>
            <span className="text-zinc-400">/</span>
          </React.Fragment>
        ))}
        <span className="text-zinc-900 truncate max-w-xs">{product.name}</span>
      </div>

      {/* Main Product Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl lg:text-[32px] font-bold text-zinc-900 leading-tight mb-4">
          {product.name}
        </h1>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm border-b border-zinc-100 pb-4">
          <span className="text-zinc-500">
            Код товара: {product.sku || product.id.padStart(8, '0')}
          </span>
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-brand-red text-brand-red" />
            <span className="font-bold">4.9</span>
            <span className="text-zinc-500 hover:text-brand-red cursor-pointer transition-colors">(61 отзыв)</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-700">
            <ShieldCheck className="w-4 h-4 text-brand-red" />
            <span>Гарантия производителя</span>
          </div>
        </div>
      </div>

      {/* Mobile Back Button */}
      <div className="md:hidden flex items-center gap-3 p-3 mb-2 bg-white sticky top-14 z-30 border-b border-zinc-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-500 hover:text-brand-red">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-medium text-sm truncate">{product.name}</span>
      </div>

      <div className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">
          
          {/* Left Column: Image Gallery (Huge) */}
          <div className="col-span-1 lg:col-span-5 flex flex-col-reverse md:flex-row gap-6">
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 scrollbar-hide md:w-20 shrink-0 h-[500px]">
                {images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-16 h-16 md:w-20 md:h-20 overflow-hidden border-2 shrink-0 transition-all rounded-lg ${activeImage === idx ? "border-zinc-900" : "border-zinc-200 hover:border-zinc-400"}`}
                  >
                    <img src={img || undefined} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Product Image (No borders) */}
            <div className="relative w-full aspect-square flex items-center justify-center">
              <img 
                src={images[activeImage] || undefined} 
                alt={product.name} 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Middle Column: Description snippet */}
          <div className="col-span-1 lg:col-span-3 flex flex-col pt-2">
            
            {product.description && (
              <div className="mb-6">
                <h3 className="text-zinc-500 mb-2 text-[15px]">О товаре</h3>
                <p className="text-[15px] leading-relaxed text-zinc-900 line-clamp-6">
                  {product.description}
                </p>
                <button 
                  onClick={() => setActiveTab("description")}
                  className="flex items-center gap-1 text-[15px] text-zinc-900 hover:text-brand-red mt-2 transition-colors group"
                >
                  Читать полное описание
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-brand-red" />
                </button>
              </div>
            )}

            {/* Related mini-banner mock */}
            <div className="mt-auto border border-zinc-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-zinc-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-red/10 rounded-lg flex items-center justify-center text-brand-red font-bold">
                  %
                </div>
                <div>
                  <div className="text-[15px] text-zinc-900">Сопутствующие товары</div>
                  <div className="text-[13px] text-zinc-500">Подборка для этого товара</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </div>
          </div>

          {/* Right Column: Buy Box styling */}
          <div className="col-span-1 lg:col-span-4">
            <div className="sticky top-24 max-w-[420px] ml-auto lg:mr-0 lg:ml-auto">
              
              {/* Top actions */}
              <div className="flex items-center gap-8 mb-5 px-1 whitespace-nowrap">
                <button 
                  onClick={() => toggleFavorite(product.id)}
                  className="flex items-center gap-2 text-zinc-900 hover:text-brand-red transition-colors group"
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-brand-red text-brand-red stroke-brand-red" : "text-zinc-900 group-hover:stroke-brand-red"}`} strokeWidth={1.5} />
                  <span className="text-[14px] font-medium">В избранное</span>
                </button>
                <button className="flex items-center gap-2 text-zinc-900 hover:text-brand-red transition-colors group">
                  <BarChart2 className="w-5 h-5 text-zinc-900 group-hover:stroke-brand-red" strokeWidth={2} />
                  <span className="text-[14px] font-medium">Сравнить</span>
                </button>
              </div>

              <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-zinc-100 flex flex-col gap-6">
                
                {/* Price block */}
                <div>
                  <div className="bg-[#EAF6ED] rounded-[16px] px-3.5 py-3 flex items-center justify-between">
                    <div className="flex items-baseline gap-2 flex-nowrap">
                      <span className="text-[26px] font-bold text-zinc-900 leading-none tracking-tight whitespace-nowrap">{product.price.toLocaleString()} ₽</span>
                      <span className="text-[13px] text-zinc-700 flex items-center whitespace-nowrap">физлицам <ChevronRight className="w-4 h-4 ml-0.5 text-zinc-500 shrink-0" /></span>
                    </div>
                    <div className="bg-[#34A853] text-white font-bold text-[13px] px-2 py-1 rounded-md shrink-0 ml-2">
                      -3%
                    </div>
                  </div>
                  <div className="text-[16px] text-zinc-600 font-bold line-through px-1.5 mt-3 tracking-tight">
                    {oldPrice.toLocaleString()} ₽
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  {inCart ? (
                    <div className="flex items-center justify-between bg-white rounded-xl h-[52px] w-full border-2 border-[#E30613]">
                      <Button variant="ghost" className="h-full w-14 hover:text-[#E30613] hover:bg-transparent rounded-l-xl text-zinc-500" onClick={() => updateQuantity(product.id, -1)}>
                        <Minus className="w-5 h-5" />
                      </Button>
                      <div className="text-[16px] font-bold text-center flex-1">{inCart.quantity}</div>
                      <Button variant="ghost" className="h-full w-14 hover:text-[#E30613] hover:bg-transparent rounded-r-xl text-zinc-500" onClick={() => updateQuantity(product.id, 1)}>
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-[#D10000] hover:bg-[#B30000] text-white rounded-xl h-[52px] font-medium text-[16px] transition-colors flex items-center justify-center gap-2.5"
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="w-5 h-5" fill="currentColor" strokeWidth={0} />
                      {product.stock === 0 ? "Нет в наличии" : "В корзину"}
                    </Button>
                  )}
                  <Button className="w-full bg-[#F0F2F5] hover:bg-[#E5E7EB] text-zinc-900 rounded-xl h-[52px] font-medium text-[16px] transition-colors border-0">
                    Быстрый заказ
                  </Button>
                </div>

                {/* Installment Info */}
                <div className="border border-[#E5E7EB] rounded-xl px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold bg-[#F3F4F6] text-zinc-600 px-2.5 flex items-center h-[26px] rounded-md text-[13px] leading-none line-through">
                      {Math.ceil(product.price / 4).toLocaleString()} ₽
                    </span>
                    <span className="text-zinc-900 text-[15px]">× 4 платежа частями</span>
                  </div>
                  <div className="w-[18px] h-[18px] rounded-full border border-zinc-300 text-zinc-400 flex items-center justify-center text-[11px] pb-[1px] cursor-help shrink-0">i</div>
                </div>

                <hr className="border-t border-[#F3F4F6]" />

                {/* Delivery Info */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <CheckCircle2 className="w-[22px] h-[22px] text-[#34A853] shrink-0 fill-[#34A853] text-white stroke-2 bg-white rounded-full mt-[2px]" style={{stroke: "white", fill: "#34A853"}} />
                    <div className="text-[15px] leading-snug">
                      {product.stock} шт. <span className="border-b border-dashed border-zinc-500 text-zinc-900 cursor-pointer hover:border-zinc-900">есть на складе</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Package className="w-[22px] h-[22px] text-zinc-900 shrink-0 mt-[2px]" strokeWidth={2} />
                    <div className="text-[15px] leading-[1.4]">
                      <span className="font-medium border-b border-dashed border-zinc-900 cursor-pointer hover:text-brand-red hover:border-brand-red pb-[1px]">Самовывоз:</span> завтра, <br/>
                      бесплатно, из 1 магазина
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Truck className="w-[22px] h-[22px] text-zinc-900 shrink-0 mt-[2px]" strokeWidth={2} />
                    <div className="text-[15px] leading-[1.4]">
                      <span className="font-medium border-b border-dashed border-zinc-900 cursor-pointer hover:text-brand-red hover:border-brand-red pb-[1px]">Курьером:</span> с 24 апреля, <br/>
                      от 350 ₽
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mb-12">
        <div className="flex items-center gap-6 border-b border-brand-border mb-6 overflow-x-auto scrollbar-hide">
          <button 
            className={`pb-3 text-lg font-bold transition-colors whitespace-nowrap ${activeTab === "characteristics" ? "text-zinc-900 border-b-2 border-brand-red" : "text-zinc-500 hover:text-zinc-900"}`}
            onClick={() => setActiveTab("characteristics")}
          >
            Характеристики
          </button>
          <button 
            className={`pb-3 text-lg font-bold transition-colors whitespace-nowrap ${activeTab === "description" ? "text-zinc-900 border-b-2 border-brand-red" : "text-zinc-500 hover:text-zinc-900"}`}
            onClick={() => setActiveTab("description")}
          >
            Описание
          </button>
          <button 
            className={`pb-3 text-lg font-bold transition-colors whitespace-nowrap ${activeTab === "reviews" ? "text-zinc-900 border-b-2 border-brand-red" : "text-zinc-500 hover:text-zinc-900"}`}
            onClick={() => setActiveTab("reviews")}
          >
            Отзывы (12)
          </button>
        </div>

        <div className="bg-white rounded-md border border-brand-border p-6 shadow-sm">
          {activeTab === "characteristics" && (
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold mb-6">Основные характеристики</h2>
              {product.characteristics && product.characteristics.length > 0 ? (
                <div className="border border-brand-border rounded-md overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <tbody>
                      {product.characteristics.map((char, idx) => (
                        <tr key={idx} className="border-b border-brand-border last:border-0 hover:bg-zinc-50/50 transition-colors">
                          <th className="py-3 px-4 font-normal text-zinc-500 w-1/2 bg-zinc-50/30">{char.name}</th>
                          <td className="py-3 px-4 text-zinc-900 font-medium w-1/2">{char.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-zinc-500 italic">Характеристики пока не добавлены.</p>
              )}
            </div>
          )}

          {activeTab === "description" && (
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold mb-4">Описание товара</h2>
              {product.description ? (
                <p className="text-zinc-600 leading-relaxed">
                  {product.description}
                </p>
              ) : (
                <p className="text-zinc-500 italic">Описание пока не добавлено.</p>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="max-w-3xl">
               <h2 className="text-xl font-bold mb-4">Отзывы о товаре</h2>
               <p className="text-zinc-500">Этот раздел находится в разработке.</p>
            </div>
          )}
        </div>
      </div>

      {/* Similar Products (Now Analogous) */}
      {similarProducts.length > 0 && (
        <div className="relative group mt-8 mb-12">
          <div className="flex items-baseline gap-4 mb-6">
            <h2 className="text-[26px] md:text-[32px] font-bold text-zinc-900 tracking-tight">Аналогичные товары</h2>
            <Link to={`/catalog?category=${encodeURIComponent(product.category)}`} className="text-[17px] text-zinc-500 hover:text-zinc-900 transition-colors">
              Смотреть все
            </Link>
          </div>
          
          <div className="relative">
            {/* Nav Arrows */}
            <button 
              onClick={(e) => { e.preventDefault(); scrollSimilar("left"); }}
              className="hidden md:flex absolute top-[110px] -left-6 z-10 w-12 h-12 bg-white rounded-full items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-zinc-100 text-zinc-900 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-6 h-6 ml-[-2px]" />
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); scrollSimilar("right"); }}
              className="hidden md:flex absolute top-[110px] -right-6 z-10 w-12 h-12 bg-white rounded-full items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-zinc-100 text-zinc-900 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-6 h-6 mr-[-2px]" />
            </button>

            <div 
              ref={similarScrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide snap-x pb-8"
              style={{ scrollBehavior: 'smooth' }}
            >
              {similarProducts.map(similar => {
                const simInCart = cart.find(item => item.id === similar.id);
                // Fake discount for mockup if no actual old price exists
                const discount = Math.floor(Math.random() * 20) + 10;
                
                return (
                  <Link 
                    key={similar.id} 
                    to={`/product/${similar.id}`} 
                    className="group bg-transparent hover:bg-white rounded-[20px] p-4 flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all relative w-[220px] lg:w-[240px] shrink-0 snap-start"
                  >
                    
                    {/* Image Area */}
                    <div className="relative aspect-square mb-4">
                      <img src={similar.image || undefined} alt={similar.name} className="w-full h-full object-contain p-2" />
                      
                      {/* Hover Actions (Top Right) */}
                      <div className="absolute top-0 right-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(similar.id); }}
                          className="p-1.5 text-zinc-400 hover:text-brand-red transition-colors"
                        >
                          <Heart className={`w-6 h-6 ${favorites.includes(similar.id) ? 'fill-brand-red text-brand-red' : ''}`} strokeWidth={1.5} />
                        </button>
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          className="p-1.5 text-zinc-400 hover:text-brand-red transition-colors"
                        >
                          <BarChart2 className="w-6 h-6" strokeWidth={2} />
                        </button>
                      </div>

                      {/* Badge (Bottom Left) */}
                      <div className="absolute bottom-0 left-0 bg-[#34A853] text-white font-bold text-[13px] px-2 py-1 rounded-md">
                        -{discount}%
                      </div>
                    </div>
                    
                    {/* Price Row */}
                    <div className="flex items-center justify-between mb-3 min-h-[44px]">
                      <div className="text-[22px] md:text-[24px] font-bold text-zinc-900 tracking-tight">{similar.price} ₽</div>
                      
                      {/* Cart Button (Always visible on hover, or if in cart) */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {simInCart ? (
                           <div className="flex flex-col bg-white rounded-xl h-11 w-11 border-2 border-brand-red items-center justify-center overflow-hidden" onClick={(e) => e.preventDefault()}>
                             <button onClick={(e) => { e.preventDefault(); updateQuantity(similar.id, 1); }} className="h-1/2 w-full flex items-center justify-center hover:bg-zinc-100 text-brand-red">
                               <Plus className="w-3 h-3" strokeWidth={3} />
                             </button>
                             <div className="h-[1px] w-full bg-brand-red"></div>
                             <button onClick={(e) => { e.preventDefault(); updateQuantity(similar.id, -1); }} className="h-1/2 w-full flex items-center justify-center hover:bg-zinc-100 text-brand-red">
                               <Minus className="w-3 h-3" strokeWidth={3} />
                             </button>
                           </div>
                        ) : (
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(similar); }}
                            className="bg-[#D10000] hover:bg-[#B30000] text-white rounded-xl w-11 h-11 flex items-center justify-center transition-colors shadow-sm"
                          >
                            <ShoppingCart className="w-5 h-5 ml-[-2px]" fill="currentColor" strokeWidth={0} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-[14px] text-zinc-900 leading-[1.4] line-clamp-3 mb-2 flex-1">
                      {similar.name}
                    </h3>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1.5 mt-auto text-[14px]">
                      <Star className="w-4 h-4 fill-[#E30613] text-[#E30613]" />
                      <span className="font-bold text-zinc-900">4.3</span>
                      <span className="text-zinc-500">(18)</span>
                    </div>

                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Complementary Products */}
      {complementaryProducts.length > 0 && (
        <div className="relative group mt-8 mb-12">
          <div className="flex items-baseline gap-4 mb-6">
            <h2 className="text-[26px] md:text-[32px] font-bold text-zinc-900 tracking-tight">Сопутствующие товары</h2>
          </div>
          
          <div className="relative">
            {/* Nav Arrows */}
            <button 
              onClick={(e) => { e.preventDefault(); scrollComplementary("left"); }}
              className="hidden md:flex absolute top-[110px] -left-6 z-10 w-12 h-12 bg-white rounded-full items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-zinc-100 text-zinc-900 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-6 h-6 ml-[-2px]" />
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); scrollComplementary("right"); }}
              className="hidden md:flex absolute top-[110px] -right-6 z-10 w-12 h-12 bg-white rounded-full items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-zinc-100 text-zinc-900 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-6 h-6 mr-[-2px]" />
            </button>

            <div 
              ref={complementaryScrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide snap-x pb-8"
              style={{ scrollBehavior: 'smooth' }}
            >
              {complementaryProducts.map(comp => {
                const simInCart = cart.find(item => item.id === comp.id);
                const discount = Math.floor(Math.random() * 20) + 10;
                
                return (
                  <Link 
                    key={comp.id} 
                    to={`/product/${comp.id}`} 
                    className="group bg-transparent hover:bg-white rounded-[20px] p-4 flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all relative w-[220px] lg:w-[240px] shrink-0 snap-start"
                  >
                    
                    {/* Image Area */}
                    <div className="relative aspect-square mb-4">
                      <img src={comp.image || undefined} alt={comp.name} className="w-full h-full object-contain p-2" />
                      
                      {/* Hover Actions (Top Right) */}
                      <div className="absolute top-0 right-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(comp.id); }}
                          className="p-1.5 text-zinc-400 hover:text-brand-red transition-colors"
                        >
                          <Heart className={`w-6 h-6 ${favorites.includes(comp.id) ? 'fill-brand-red text-brand-red' : ''}`} strokeWidth={1.5} />
                        </button>
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          className="p-1.5 text-zinc-400 hover:text-brand-red transition-colors"
                        >
                          <BarChart2 className="w-6 h-6" strokeWidth={2} />
                        </button>
                      </div>

                      {/* Badge (Bottom Left) */}
                      <div className="absolute bottom-0 left-0 bg-[#34A853] text-white font-bold text-[13px] px-2 py-1 rounded-md">
                        -{discount}%
                      </div>
                    </div>
                    
                    {/* Price Row */}
                    <div className="flex items-center justify-between mb-3 min-h-[44px]">
                      <div className="text-[22px] md:text-[24px] font-bold text-zinc-900 tracking-tight">{comp.price} ₽</div>
                      
                      {/* Cart Button */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {simInCart ? (
                           <div className="flex flex-col bg-white rounded-xl h-11 w-11 border-2 border-brand-red items-center justify-center overflow-hidden" onClick={(e) => e.preventDefault()}>
                             <button onClick={(e) => { e.preventDefault(); updateQuantity(comp.id, 1); }} className="h-1/2 w-full flex items-center justify-center hover:bg-zinc-100 text-brand-red">
                               <Plus className="w-3 h-3" strokeWidth={3} />
                             </button>
                             <div className="h-[1px] w-full bg-brand-red"></div>
                             <button onClick={(e) => { e.preventDefault(); updateQuantity(comp.id, -1); }} className="h-1/2 w-full flex items-center justify-center hover:bg-zinc-100 text-brand-red">
                               <Minus className="w-3 h-3" strokeWidth={3} />
                             </button>
                           </div>
                        ) : (
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(comp); }}
                            className="bg-[#D10000] hover:bg-[#B30000] text-white rounded-xl w-11 h-11 flex items-center justify-center transition-colors shadow-sm"
                          >
                            <ShoppingCart className="w-5 h-5 ml-[-2px]" fill="currentColor" strokeWidth={0} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-[14px] text-zinc-900 leading-[1.4] line-clamp-3 mb-2 flex-1">
                      {comp.name}
                    </h3>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1.5 mt-auto text-[14px]">
                      <Star className="w-4 h-4 fill-[#E30613] text-[#E30613]" />
                      <span className="font-bold text-zinc-900">4.9</span>
                      <span className="text-zinc-500">(12)</span>
                    </div>

                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

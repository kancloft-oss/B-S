import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingCart, Plus, Minus, ChevronRight, Star } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useCart, Product } from "@/src/lib/cart-context";

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
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
          
          // Fetch similar products
          const simRes = await fetch(`/api/products?category=${encodeURIComponent(productData.category)}&limit=6`);
          if (simRes.ok) {
            const similar = await simRes.json();
            setSimilarProducts(similar.filter((p: any) => p.id !== id).slice(0, 5));
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
  const oldPrice = Math.floor(product.price * 1.3);
  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  return (
    <div className="pb-20 md:pb-8 max-w-7xl mx-auto px-4">
      {/* Breadcrumbs */}
      <div className="hidden md:flex items-center gap-2 text-sm text-zinc-500 mb-6 mt-4">
        <Link to="/" className="hover:text-brand-red transition-colors">Главная</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/" className="hover:text-brand-red transition-colors">{product.category}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-zinc-900 truncate">{product.name}</span>
      </div>

      {/* Mobile Back Button */}
      <div className="md:hidden flex items-center gap-3 p-3 mb-2 bg-white sticky top-14 z-30 border-b border-brand-border">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-500 hover:text-brand-red">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-medium text-sm truncate">{product.name}</span>
      </div>

      <div className="bg-white rounded-md border border-brand-border mb-8">
        <div className="grid md:grid-cols-2 gap-0 md:gap-8 p-0 md:p-6">
          
          {/* Product Images */}
          <div className="flex flex-col gap-4 p-4 md:p-0">
            <div className="relative aspect-square rounded-md overflow-hidden bg-brand-gray border border-brand-border">
              <img 
                src={images[activeImage] || undefined} 
                alt={product.name} 
                className="w-full h-full object-cover mix-blend-multiply"
              />
              <div className="absolute top-3 left-3 bg-brand-red text-white px-2 py-1 text-xs font-bold rounded-sm">
                -23%
              </div>
              <button 
                onClick={() => toggleFavorite(product.id)}
                className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-brand-red transition-colors bg-white/80 backdrop-blur-sm rounded-full border border-brand-border"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-brand-red text-brand-red" : ""}`} />
              </button>
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-16 h-16 md:w-20 md:h-20 overflow-hidden border-2 shrink-0 transition-all rounded-md ${activeImage === idx ? "border-brand-red" : "border-transparent hover:border-brand-border"}`}
                  >
                    <img src={img || undefined} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover mix-blend-multiply bg-brand-gray" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col p-4 md:p-0 border-t md:border-t-0 border-brand-border">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-zinc-500">
                  Код товара: {product.sku || `ART-${product.id.padStart(5, '0')}`}
                </span>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-100">
                  В наличии: {product.stock} шт.
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 leading-tight mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-2 mb-6 text-brand-yellow">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current text-zinc-300" />
                <span className="text-sm text-brand-blue hover:text-brand-red cursor-pointer ml-2 transition-colors">12 отзывов</span>
              </div>

              <div className="bg-brand-gray p-6 rounded-md border border-brand-border mb-8">
                <div className="flex items-baseline gap-4 mb-6">
                  <span className="text-4xl font-bold text-zinc-900">{product.price} ₽</span>
                  <span className="text-lg text-zinc-400 line-through">{oldPrice} ₽</span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {inCart ? (
                      <div className="flex items-center justify-between bg-white rounded-md p-1 h-12 w-32 border border-brand-border">
                        <Button variant="ghost" size="icon" className="h-10 w-10 hover:text-brand-red" onClick={() => updateQuantity(product.id, -1)}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-base font-bold w-8 text-center">{inCart.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-10 w-10 hover:text-brand-red" onClick={() => updateQuantity(product.id, 1)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        className="flex-1 bg-brand-red hover:bg-brand-red-hover text-white rounded-md h-12 font-bold text-base transition-colors"
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? "Нет в наличии" : "В корзину"}
                      </Button>
                    )}
                    <Button variant="outline" className="flex-1 border-brand-border text-zinc-900 rounded-md h-12 font-medium hover:bg-zinc-50">
                      Купить в 1 клик
                    </Button>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-white border border-brand-border rounded-md p-4 mb-8 text-sm">
                <div className="flex items-start gap-3 mb-3 pb-3 border-b border-brand-border">
                  <div className="w-5 h-5 rounded-full bg-brand-gray flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900">Самовывоз, завтра</div>
                    <div className="text-zinc-500">Бесплатно</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-gray flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-brand-blue"></div>
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900">Курьером, завтра</div>
                    <div className="text-zinc-500">от 290 ₽</div>
                  </div>
                </div>
              </div>

              {/* Description & Characteristics */}
              <div className="space-y-8">
                {product.description && (
                  <div>
                    <h3 className="text-lg font-bold mb-3">Описание</h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {product.characteristics && product.characteristics.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-3">Характеристики</h3>
                    <div className="space-y-0 text-sm">
                      {product.characteristics.map((char, idx) => (
                        <div key={idx} className="flex py-2 border-b border-brand-border last:border-0">
                          <span className="text-zinc-500 w-1/2">{char.name}</span>
                          <span className="text-zinc-900 font-medium w-1/2">{char.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="px-3 md:px-0">
          <h2 className="text-2xl font-bold mb-6">
            Похожие товары
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {similarProducts.map(similar => {
              const simInCart = cart.find(item => item.id === similar.id);
              const simOldPrice = Math.floor(similar.price * 1.3);

              return (
                <Link key={similar.id} to={`/product/${similar.id}`} className="group bg-white border border-brand-border rounded-md p-4 flex flex-col hover:shadow-lg transition-all relative">
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(similar.id); }}
                    className={`absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-brand-border transition-colors ${favorites.includes(similar.id) ? 'text-brand-red' : 'text-zinc-400 hover:text-brand-red'}`}
                  >
                    <Heart className={`w-5 h-5 ${favorites.includes(similar.id) ? 'fill-current' : ''}`} />
                  </button>
                  
                  <div className="aspect-square mb-4 overflow-hidden rounded-md border border-brand-border bg-brand-gray">
                    <img src={similar.image || undefined} alt={similar.name} className="w-full h-full object-cover mix-blend-multiply" />
                  </div>
                  
                  <div className="flex items-center gap-1 mb-2 text-brand-yellow">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current text-zinc-300" />
                    <span className="text-xs text-zinc-400 ml-1">12</span>
                  </div>

                  <div className="text-xl font-bold text-zinc-900 mb-1">{similar.price} ₽</div>
                  <h3 className="text-sm text-brand-blue group-hover:text-brand-red transition-colors line-clamp-2 mb-4 flex-1">{similar.name}</h3>
                  
                  <div className="mt-auto">
                    {simInCart ? (
                      <div className="flex items-center justify-between bg-brand-gray rounded-md p-1 border border-brand-border" onClick={(e) => e.preventDefault()}>
                        <button onClick={(e) => { e.preventDefault(); updateQuantity(similar.id, simInCart.quantity - 1); }} className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-brand-red">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium text-sm">{simInCart.quantity} шт</span>
                        <button onClick={(e) => { e.preventDefault(); updateQuantity(similar.id, simInCart.quantity + 1); }} className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-brand-red" disabled={simInCart.quantity >= similar.stock}>
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <Button 
                        onClick={(e) => { e.preventDefault(); addToCart(similar); }}
                        className="w-full bg-white hover:bg-brand-red text-brand-red hover:text-white border border-brand-red rounded-md h-10 font-bold transition-colors"
                      >
                        В корзину
                      </Button>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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
    setLoading(true);
    // Fetch product details
    fetch(`/api/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setActiveImage(0);
        
        // Fetch similar products (same category)
        fetch("/api/products")
          .then(res => res.json())
          .then(allProducts => {
            const similar = allProducts
              .filter((p: Product) => p.category === data.category && p.id !== data.id)
              .slice(0, 5); // Take up to 5 similar products
            setSimilarProducts(similar);
            setLoading(false);
          });
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-zinc-500">Загрузка товара...</div>;
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Товар не найден</h2>
        <Button onClick={() => navigate("/")} className="bg-orange-500 hover:bg-orange-600 text-white">
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
    <div className="pb-20 md:pb-8">
      {/* Breadcrumbs */}
      <div className="hidden md:flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link to="/" className="hover:text-zinc-900">Главная</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/" className="hover:text-zinc-900">{product.category}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-zinc-900 truncate">{product.name}</span>
      </div>

      {/* Mobile Back Button */}
      <div className="md:hidden flex items-center gap-3 p-3 mb-2 bg-white sticky top-14 z-30 border-b border-zinc-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-medium text-sm truncate">{product.name}</span>
      </div>

      <div className="bg-white md:rounded-3xl shadow-sm border-y md:border border-zinc-100 overflow-hidden mb-8">
        <div className="grid md:grid-cols-2 gap-0 md:gap-8 p-0 md:p-8">
          
          {/* Product Images */}
          <div className="flex flex-col gap-4 p-4 md:p-0">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-100">
              <img 
                src={images[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-cover mix-blend-multiply"
              />
              <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
                -23%
              </div>
              <button 
                onClick={() => toggleFavorite(product.id)}
                className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-zinc-400 hover:text-red-500 transition-colors"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              </button>
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${activeImage === idx ? "border-orange-500" : "border-transparent hover:border-zinc-300"}`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover mix-blend-multiply bg-zinc-100" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col p-4 md:p-0 border-t md:border-t-0 border-zinc-100">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-md">
                  Артикул: {product.sku || `ART-${product.id.padStart(5, '0')}`}
                </span>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-md">
                  В наличии: {product.stock} шт.
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 leading-tight mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-end gap-3 mb-6">
                <span className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">{product.price} ₽</span>
                <span className="text-lg text-zinc-400 line-through font-medium mb-1">{oldPrice} ₽</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mb-8">
                {inCart ? (
                  <div className="flex items-center justify-between bg-zinc-100 rounded-2xl p-1.5 h-14 w-40">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white text-zinc-600" onClick={() => updateQuantity(product.id, -1)}>
                      <Minus className="w-5 h-5" />
                    </Button>
                    <span className="text-lg font-bold w-10 text-center">{inCart.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white text-zinc-600" onClick={() => updateQuantity(product.id, 1)}>
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-14 font-bold text-lg shadow-sm shadow-orange-500/20"
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                  >
                    {product.stock === 0 ? "Нет в наличии" : "В корзину"}
                  </Button>
                )}
              </div>
            </div>

            {/* Description & Characteristics */}
            <div className="space-y-8">
              {product.description && (
                <div>
                  <h3 className="text-lg font-bold mb-3">Описание</h3>
                  <p className="text-zinc-600 text-sm md:text-base leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {product.characteristics && product.characteristics.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3">Характеристики</h3>
                  <div className="space-y-2">
                    {product.characteristics.map((char, idx) => (
                      <div key={idx} className="flex py-2 border-b border-zinc-100 last:border-0 text-sm md:text-base">
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

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="px-3 md:px-0">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-4 md:mb-6">
            Похожие товары
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
            {similarProducts.map(similar => {
              const simInCart = cart.find(item => item.id === similar.id);
              const simOldPrice = Math.floor(similar.price * 1.3);

              return (
                <div key={similar.id} className="bg-white rounded-2xl md:rounded-3xl p-2 md:p-3 flex flex-col hover:shadow-xl hover:shadow-zinc-200/50 transition-all border border-zinc-100 group relative">
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(similar.id); }}
                    className="absolute top-3 right-3 z-10 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Heart className={`w-4 h-4 md:w-5 md:h-5 ${favorites.includes(similar.id) ? "fill-red-500 text-red-500" : ""}`} />
                  </button>
                  <Link to={`/product/${similar.id}`} className="block relative aspect-[4/5] mb-2 md:mb-3 rounded-xl md:rounded-2xl overflow-hidden bg-zinc-100">
                    <img 
                      src={similar.image} 
                      alt={similar.name} 
                      className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                  
                  <div className="flex-1 flex flex-col">
                    <Link to={`/product/${similar.id}`} className="block">
                      <div className="flex items-baseline gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                        <span className="text-base md:text-xl font-black text-zinc-900 tracking-tight">{similar.price} ₽</span>
                        <span className="text-[10px] md:text-xs text-zinc-400 line-through font-medium">{simOldPrice} ₽</span>
                      </div>
                      
                      <h3 className="text-[10px] md:text-xs text-zinc-900 font-medium line-clamp-2 mb-2 md:mb-3 flex-1 leading-tight md:leading-relaxed hover:text-orange-500 transition-colors">
                        {similar.name}
                      </h3>
                    </Link>

                    {simInCart ? (
                      <div className="flex items-center justify-between bg-zinc-100 rounded-lg md:rounded-xl p-1 mt-auto">
                        <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 rounded-md md:rounded-lg hover:bg-white text-zinc-600" onClick={() => updateQuantity(similar.id, -1)}>
                          <Minus className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                        <span className="text-xs md:text-sm font-bold w-6 md:w-8 text-center">{simInCart.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 rounded-md md:rounded-lg hover:bg-white text-zinc-600" onClick={() => updateQuantity(similar.id, 1)}>
                          <Plus className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg md:rounded-xl h-8 md:h-10 mt-auto font-semibold text-xs md:text-sm shadow-sm shadow-orange-200"
                        onClick={() => addToCart(similar)}
                        disabled={similar.stock === 0}
                      >
                        {similar.stock === 0 ? "Нет в наличии" : "В корзину"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { Input } from "./ui/input";

export function SearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10`);
        if (!response.ok) throw new Error('Search failed');
        const filtered = await response.json();
        
        setResults(filtered);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (productId: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/product/${productId}`);
  };

  return (
    <div className={`flex-1 relative ${className || "max-w-4xl"}`} ref={wrapperRef}>
      <div className="relative flex items-center w-full group">
        <div className="relative flex-1">
          <Input
            placeholder="Оригинальные товары для творчества и художников"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-l-md border-2 border-zinc-600 border-r-0 bg-white focus-visible:ring-0 pl-4 pr-4 h-11 text-base shadow-none text-zinc-900 placeholder:text-zinc-500 transition-colors"
          />
          {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-zinc-400" />}
        </div>
        <button className="bg-zinc-600 hover:bg-zinc-700 text-white h-11 px-5 rounded-r-md transition-colors flex items-center justify-center">
          <Search className="w-6 h-6" />
        </button>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-xl border border-zinc-200 z-50 overflow-hidden">
          {results.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSelect(product.id)}
              className="w-full text-left p-3 hover:bg-zinc-50 flex items-center gap-3 border-b border-zinc-100 last:border-0"
            >
              <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
              <div>
                <div className="font-medium text-zinc-900">{product.name}</div>
                <div className="text-xs text-zinc-500">{product.category}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

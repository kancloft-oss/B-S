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
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data);
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
      <Input
        placeholder="Искать товары..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-2xl bg-zinc-100 border-transparent focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:bg-white pl-5 pr-12 h-12 text-base shadow-none"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-zinc-200 z-50 overflow-hidden">
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

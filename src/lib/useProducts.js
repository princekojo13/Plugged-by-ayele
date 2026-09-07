import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useProducts(params = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const filter = {};
      if (params.category) filter.category = params.category;
      if (params.featured) filter.featured = true;
      if (params.best_seller) filter.best_seller = true;
      if (params.new_arrival) filter.new_arrival = true;
      if (params.special_offer) filter.special_offer = true;
      const sort = params.sort || "-created_date";
      const limit = params.limit || 100;
      const res = await base44.entities.Product.filter(filter, sort, limit);
      let items = res || [];
      if (params.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q)
        );
      }
      if (params.onSale) {
        items = items.filter((p) => p.sale_price && p.sale_price < p.price);
      }
      return items;
    },
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) return null;
      return await base44.entities.Product.get(id);
    },
    enabled: !!id,
  });
}
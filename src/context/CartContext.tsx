
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    
    try {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      return [];
    }
  });
  
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem("cart", JSON.stringify(items));
      } catch (error) {
        console.error("Error saving cart to localStorage:", error);
      }
    }
  }, [items]);
  
  const addToCart = (newItem: CartItem) => {
    if (!newItem || !newItem.id) {
      console.error("Invalid item:", newItem);
      return;
    }
    
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === newItem.id);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        return updatedItems;
      } else {
        return [...prevItems, { ...newItem }];
      }
    });
    
    toast({
      title: "تمت الإضافة",
      description: `تمت إضافة ${newItem.name} إلى سلة التسوق`,
    });
  };
  
  const removeFromCart = (itemId: string) => {
    if (!itemId) {
      console.error("Invalid item ID for removal:", itemId);
      return;
    }
    
    // Find the item first to show its name in the toast
    const itemToRemove = items.find(item => item.id === itemId);
    
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    
    if (itemToRemove) {
      toast({
        title: "تمت إزالة المنتج",
        description: `تم إزالة ${itemToRemove.name} من سلة التسوق`,
      });
    } else {
      toast({
        title: "تمت إزالة المنتج",
        description: "تم إزالة المنتج من سلة التسوق",
      });
    }
  };
  
  const updateQuantity = (itemId: string, quantity: number) => {
    if (!itemId) {
      console.error("Invalid item ID for quantity update:", itemId);
      return;
    }
    
    console.log(`Updating quantity for item ${itemId} to ${quantity}`);
    
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
    
    toast({
      title: "تم تحديث الكمية",
      description: `تم تحديث كمية المنتج في سلة التسوق`,
    });
  };
  
  const clearCart = () => {
    setItems([]);
    
    toast({
      title: "تم تفريغ السلة",
      description: "تم تفريغ سلة التسوق الخاصة بك",
    });
  };
  
  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

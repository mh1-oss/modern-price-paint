
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const EmptyCart = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center h-[50vh]">
      <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-700 mb-2">سلة التسوق فارغة</h3>
      <p className="text-gray-500 text-center mb-6 max-w-xs">
        لم تقم بإضافة أي منتجات إلى سلة التسوق الخاصة بك بعد. استعرض منتجاتنا وأضف ما تحتاجه.
      </p>
      <Button className="mt-2 bg-primary hover:bg-primary/90" onClick={() => navigate("/products")}>
        مواصلة التسوق
      </Button>
    </div>
  );
};

export default EmptyCart;

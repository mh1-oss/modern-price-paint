import React from 'react';
import { StockTransaction } from '@/utils/models';
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card,
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { AlertCircle, ArrowDown, ArrowUp, Box, Plus } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { fetchProducts } from "@/services/products/productService";
import { getStockTransactions, addStockTransaction, calculateProductStock } from "@/services/stock/stockService";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Product } from "@/data/initialData";

const AdminStock = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [transactionType, setTransactionType] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  
  const { 
    data: products = [],
    isLoading: productsLoading 
  } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const { 
    data: transactions = [], 
    isLoading: transactionsLoading,
    refetch: refetchTransactions 
  } = useQuery({
    queryKey: ['stockTransactions'],
    queryFn: getStockTransactions
  });

  const handleAddTransaction = async () => {
    if (!selectedProduct) {
      toast({
        title: "اختر منتج",
        description: "يرجى اختيار منتج للمتابعة",
        variant: "destructive",
      });
      return;
    }
    
    if (quantity <= 0) {
      toast({
        title: "كمية غير صالحة",
        description: "يجب أن تكون الكمية أكبر من صفر",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const productObj = products.find(p => p.id === selectedProduct);
      
      if (!productObj) {
        toast({
          title: "خطأ",
          description: "المنتج المحدد غير موجود",
          variant: "destructive",
        });
        return;
      }
      
      const newTransaction = {
        product_id: selectedProduct,
        quantity: quantity,
        transaction_type: transactionType,
        notes: notes || null
      };
      
      const success = await addStockTransaction(newTransaction);
      
      if (success) {
        toast({
          title: "تمت الإضافة بنجاح",
          description: `تمت إضافة معاملة جديدة لـ ${productObj.name}`,
        });
        
        setSelectedProduct("");
        setTransactionType("in");
        setQuantity(1);
        setNotes("");
        setShowAddDialog(false);
        
        refetchTransactions();
      }
    } catch (error) {
      console.error('Unexpected error adding transaction:', error);
      toast({
        title: "خطأ غير متوقع",
        description: "حدث خطأ أثناء إضافة معاملة المخزون",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const productStockLevels = calculateProductStock(transactions);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة المخزون</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة معاملة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة معاملة مخزون جديدة</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل معاملة المخزون الجديدة
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product">المنتج</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر منتج" />
                  </SelectTrigger>
                  <SelectContent>
                    {products && products.map((product: Product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">نوع المعاملة</Label>
                <Select 
                  value={transactionType} 
                  onValueChange={(value) => setTransactionType(value as "in" | "out")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">
                      <div className="flex items-center">
                        <ArrowDown className="h-4 w-4 ml-2 text-green-500" />
                        إضافة للمخزون
                      </div>
                    </SelectItem>
                    <SelectItem value="out">
                      <div className="flex items-center">
                        <ArrowUp className="h-4 w-4 ml-2 text-red-500" />
                        سحب من المخزون
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">الكمية</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  placeholder="أضف ملاحظات للمعاملة (اختيار��)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowAddDialog(false)}
                disabled={submitting}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleAddTransaction}
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white ml-2"></div>
                    جاري الإضافة...
                  </div>
                ) : "إضافة المعاملة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>مستويات المخزون الحالية</CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue"></div>
              </div>
            ) : Object.values(productStockLevels).length === 0 ? (
              <div className="text-center py-6">
                <Box className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">لا توجد بيانات مخزون متاحة</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead>
                    <TableHead>المخزون</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(productStockLevels).map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>
                        <span 
                          className={
                            item.stock > 10 
                              ? "text-green-600 font-medium" 
                              : item.stock > 0 
                                ? "text-amber-600 font-medium" 
                                : "text-red-600 font-medium"
                          }
                        >
                          {item.stock}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سجل معاملات المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-600">لا توجد معاملات</p>
              <p className="text-gray-500 mb-6">ابدأ بإضافة معاملة جديدة للمخزون</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنتج</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>ملاحظات</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.product_name}</TableCell>
                      <TableCell>
                        {transaction.transaction_type === 'in' ? (
                          <div className="flex items-center text-green-600">
                            <ArrowDown className="h-4 w-4 ml-1" />
                            إضافة
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <ArrowUp className="h-4 w-4 ml-1" />
                            سحب
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell>
                        {transaction.notes || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>
                        {format(new Date(transaction.created_at), 'yyyy/MM/dd hh:mm a', { locale: ar })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStock;

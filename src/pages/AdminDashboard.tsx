
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminAuthCheck from "@/components/Admin/AdminAuthCheck";
import AdminNavTabs from "@/components/Admin/AdminNavTabs";
import AdminTabContent from "@/components/Admin/AdminTabContent";
import { LogOut, Package, CreditCard, ShoppingCart, Newspaper, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  productCount: number;
  categoryCount: number;
  orderCount: number;
  recentSales: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    productCount: 0,
    categoryCount: 0,
    orderCount: 0,
    recentSales: 0
  });

  const { isLoading, error, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      try {
        console.log("Fetching dashboard stats...");
        
        // Fetch product count using the RPC function to bypass RLS
        const { data: productsData, error: productsError } = await supabase
          .rpc('get_all_products')
          .select('id');

        if (productsError) {
          console.error("Error fetching products:", productsError);
          throw productsError;
        }
        
        const productCount = productsData ? productsData.length : 0;

        // Fetch category count using the RPC function to bypass RLS
        const { data: categoriesData, error: categoriesError } = await supabase
          .rpc('get_all_categories')
          .select('id');

        if (categoriesError) {
          console.error("Error fetching categories:", categoriesError);
          throw categoriesError;
        }
        
        const categoryCount = categoriesData ? categoriesData.length : 0;

        // For orders and sales, use fallback values if permissions are an issue
        let orderCount = 0;
        let recentSalesTotal = 0;
        
        try {
          // Try to fetch order count
          const { count, error: ordersError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

          if (!ordersError) {
            orderCount = count || 0;
          }
        } catch (err) {
          console.warn("Could not fetch order count, using default value", err);
        }
        
        try {
          // Try to calculate recent sales (last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const sevenDaysAgoISOString = sevenDaysAgo.toISOString();
          
          const { data: recentSalesData, error: salesError } = await supabase
            .from('sales')
            .select('total_amount')
            .gte('created_at', sevenDaysAgoISOString);

          if (!salesError && recentSalesData) {
            recentSalesTotal = recentSalesData.reduce(
              (sum, sale) => sum + (typeof sale.total_amount === 'string' ? parseFloat(sale.total_amount) : Number(sale.total_amount)), 
              0
            );
          }
        } catch (err) {
          console.warn("Could not fetch sales data, using default value", err);
        }
        
        const newStats = {
          productCount,
          categoryCount,
          orderCount,
          recentSales: recentSalesTotal
        };
        
        console.log("Dashboard stats fetched:", newStats);
        setStats(newStats);
        return newStats;
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "تحديث البيانات",
      description: "يتم تحديث لوحة المعلومات الآن",
    });
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح",
    });
    navigate("/");
  };

  // Add error display in case the stats fail to load
  if (error) {
    console.error("Dashboard query error:", error);
  }

  return (
    <AdminAuthCheck>
      <div dir="rtl" className="min-h-screen bg-gray-50">
        <div className="container-custom py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">لوحة تحكم المدير</h1>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              تسجيل الخروج
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              مرحباً بك في لوحة التحكم، يمكنك إدارة منتجاتك وفئاتك ومبيعاتك ومحتوى موقعك من هنا.
            </p>
            
            {error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold mb-2">خطأ في تحميل البيانات</h3>
                    <p>حدث خطأ أثناء تحميل إحصائيات لوحة التحكم</p>
                  </div>
                  <Button 
                    onClick={handleRefresh}
                    variant="outline" 
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <RefreshCw className="h-4 w-4 ml-2" />
                    تحديث
                  </Button>
                </div>
              </div>
            ) : !isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-50 text-blue-500 mr-4">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">المنتجات</p>
                      <p className="text-2xl font-bold">{stats.productCount}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-3 text-blue-600"
                    onClick={() => navigate('/admin/products')}
                  >
                    إدارة المنتجات
                  </Button>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-50 text-green-500 mr-4">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">الفئات</p>
                      <p className="text-2xl font-bold">{stats.categoryCount}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-3 text-green-600"
                    onClick={() => navigate('/admin/categories')}
                  >
                    إدارة الفئات
                  </Button>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-amber-50 text-amber-500 mr-4">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">المبيعات</p>
                      <p className="text-2xl font-bold">{stats.orderCount}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-3 text-amber-600"
                    onClick={() => navigate('/admin/sales')}
                  >
                    إدارة المبيعات
                  </Button>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-50 text-purple-500 mr-4">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">المبيعات (آخر 7 أيام)</p>
                      <p className="text-2xl font-bold">{stats.recentSales.toFixed(2)} د.ع</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-3 text-purple-600"
                    onClick={() => navigate('/admin/sales')}
                  >
                    تفاصيل المبيعات
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-bold mb-4">الإجراءات السريعة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="flex items-center justify-center p-4 h-auto"
                onClick={() => navigate('/admin/products')}
              >
                <Package className="h-5 w-5 ml-2" />
                <span>إضافة منتج جديد</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center p-4 h-auto"
                onClick={() => navigate('/admin/categories')}
              >
                <Package className="h-5 w-5 ml-2" />
                <span>إضافة فئة جديدة</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center p-4 h-auto"
                onClick={() => navigate('/admin/content')}
              >
                <Newspaper className="h-5 w-5 ml-2" />
                <span>تعديل محتوى الموقع</span>
              </Button>
            </div>
          </div>

          <AdminNavTabs />
          
          <AdminTabContent />
        </div>
      </div>
    </AdminAuthCheck>
  );
};

export default AdminDashboard;

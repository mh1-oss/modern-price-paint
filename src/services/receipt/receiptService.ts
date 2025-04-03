
import { Sale } from "@/utils/models";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

export const printReceipt = (sale: Sale, companyInfo?: any) => {
  try {
    console.log("Generating receipt for sale:", sale);
    
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) {
      console.error("Failed to open receipt window. Please allow pop-ups.");
      toast({
        title: "خطأ في الطباعة",
        description: "فشل فتح نافذة الإيصال. الرجاء السماح بالنوافذ المنبثقة.",
        variant: "destructive",
      });
      return;
    }
    
    // Use the sale.total_amount directly which comes from the database
    // It's calculated at checkout and should be used without currency conversion
    const formattedTotal = sale.total_amount.toLocaleString();
    
    receiptWindow.document.write(`
      <html dir="rtl">
      <head>
        <title>إيصال رقم ${sale.id.substring(0, 8)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .info-block {
            width: 45%;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
          }
          th {
            background-color: #f2f2f2;
          }
          .total {
            text-align: left;
            font-weight: bold;
            font-size: 16px;
            margin-top: 10px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          @media print {
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${companyInfo ? `<h1>${companyInfo.name || 'إيصال مبيعات'}</h1>` : '<h1>إيصال مبيعات</h1>'}
          <p>رقم المبيعة: ${sale.id.substring(0, 8)}</p>
          <p>تاريخ: ${format(new Date(sale.created_at), 'yyyy/MM/dd hh:mm a', { locale: ar })}</p>
        </div>
        
        <div class="info-section">
          <div class="info-block">
            <h3>معلومات العميل</h3>
            <p><strong>الاسم:</strong> ${sale.customer_name || 'عميل'}</p>
            ${sale.customer_phone ? `<p><strong>الهاتف:</strong> ${sale.customer_phone}</p>` : ''}
            ${sale.customer_email ? `<p><strong>البريد الإلكتروني:</strong> ${sale.customer_email}</p>` : ''}
          </div>
          <div class="info-block">
            <h3>ملخص المبيعة</h3>
            <p><strong>عدد المنتجات:</strong> ${sale.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
            <p><strong>إجمالي المبلغ:</strong> ${formattedTotal} د.ع</p>
          </div>
        </div>
        
        <h3>المنتجات</h3>
        <table>
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الكمية</th>
              <th>سعر الوحدة</th>
              <th>المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${item.unit_price.toLocaleString()} د.ع</td>
                <td>${item.total_price.toLocaleString()} د.ع</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total">
          الإجمالي: ${formattedTotal} د.ع
        </div>
        
        <div class="footer">
          ${companyInfo ? `<p>${companyInfo.name || 'شكراً لتعاملكم معنا'}</p>` : '<p>شكراً لتعاملكم معنا</p>'}
          <p>هذا الإيصال دليل على عملية الشراء</p>
        </div>
        
        <button onclick="window.print();" style="display: block; margin: 20px auto; padding: 10px 20px;">
          طباعة الإيصال
        </button>
      </body>
      </html>
    `);
    
    receiptWindow.document.close();
    
    // Give the browser time to process and render all the content before focusing and printing
    setTimeout(() => {
      try {
        if (receiptWindow) {
          receiptWindow.focus();
          // Prompt the print dialog automatically
          receiptWindow.print();
        }
      } catch (error) {
        console.error("Error during print operation:", error);
        toast({
          title: "خطأ في الطباعة",
          description: "حدث خطأ أثناء عملية الطباعة.",
          variant: "destructive",
        });
      }
    }, 1000);
  } catch (error) {
    console.error("Error generating receipt:", error);
    toast({
      title: "خطأ في الطباعة",
      description: "حدث خطأ أثناء توليد الإيصال. يرجى المحاولة مرة أخرى.",
      variant: "destructive",
    });
  }
};

/**
 * Receipt Printing Utility
 * Generates a clean, printable HTML receipt layout.
 */

export type ReceiptData = {
  type: "Salary" | "Fee";
  hostelName: string;
  name: string;
  amount: number;
  date: string;
  dues?: number;
  month?: string;
  paymentMethod?: string;
};

export const printReceipt = (data: ReceiptData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print the receipt.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Receipt - ${data.hostelName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          body { 
            font-family: 'Inter', sans-serif; 
            padding: 20px; 
            color: #374151;
            background-color: #fff;
          }
          
          .receipt-container { 
            max-width: 400px; 
            margin: auto; 
            border: 1px solid #e5e7eb; 
            padding: 24px; 
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .header { 
            text-align: center; 
            border-bottom: 2px solid #f97316; 
            padding-bottom: 16px; 
            margin-bottom: 20px; 
          }
          
          .hostel-name { 
            font-size: 20px; 
            font-weight: 800; 
            color: #111827; 
            text-transform: uppercase;
            letter-spacing: -0.025em;
          }
          
          .receipt-title { 
            font-size: 12px; 
            color: #f97316; 
            letter-spacing: 0.1em; 
            font-weight: 700; 
            margin-top: 4px;
            text-transform: uppercase;
          }
          
          .content {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            font-size: 14px; 
          }
          
          .label { 
            color: #6b7280; 
            font-weight: 500; 
          }
          
          .value { 
            font-weight: 600; 
            color: #111827; 
          }
          
          .divider {
            height: 1px;
            background-color: #f3f4f6;
            margin: 8px 0;
          }

          .amount-section { 
            background: #fffafa; 
            padding: 16px; 
            border-radius: 8px; 
            margin-top: 16px; 
            border: 1px solid #fee2e2; 
          }
          
          .total-pay { 
            font-size: 18px; 
            color: #111827; 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            font-weight: 800;
          }
          
          .dues { 
            color: #dc2626; 
            font-size: 14px; 
            margin-top: 8px; 
            display: flex; 
            justify-content: space-between; 
            font-weight: 600;
          }
          
          .footer { 
            margin-top: 32px; 
            text-align: center; 
            font-size: 11px; 
            color: #9ca3af; 
            line-height: 1.5;
          }
          
          .signature-box {
            margin-top: 40px;
            display: flex;
            justify-content: center;
          }

          .signature { 
            border-top: 1px solid #d1d5db; 
            padding-top: 8px; 
            width: 160px; 
            font-size: 12px;
            color: #4b5563;
            font-weight: 500;
          }
          
          @media print { 
            body { padding: 0; }
            .receipt-container { 
              box-shadow: none; 
              border: 1px solid #eee;
              max-width: 100%;
            } 
          }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="receipt-container">
          <div class="header">
            <div class="hostel-name">${data.hostelName}</div>
            <div class="receipt-title">Official Receipt</div>
          </div>
          
          <div class="content">
            <div class="detail-row">
              <span class="label">Date</span>
              <span class="value">${data.date}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Receipt Type</span>
              <span class="value">${data.type === "Salary" ? "Salary Payment" : "Fee Collection"}</span>
            </div>

            <div class="divider"></div>

            <div class="detail-row">
              <span class="label">${data.type === "Salary" ? "Employee" : "Student"}</span>
              <span class="value">${data.name}</span>
            </div>

            ${data.month ? `
            <div class="detail-row">
              <span class="label">For Month</span>
              <span class="value">${data.month}</span>
            </div>` : ""}

            ${data.paymentMethod ? `
            <div class="detail-row">
              <span class="label">Method</span>
              <span class="value">${data.paymentMethod}</span>
            </div>` : ""}
          </div>

          <div class="amount-section">
            <div class="total-pay">
              <span>Amount Paid</span>
              <span>₹${data.amount.toLocaleString()}</span>
            </div>
            ${data.dues !== undefined ? `
            <div class="dues">
              <span>Balance Dues</span>
              <span>₹${data.dues.toLocaleString()}</span>
            </div>` : ""}
          </div>

          <div class="signature-box">
            <div class="signature">Authorized Signature</div>
          </div>

          <div class="footer">
            <p>Thank you for your payment!</p>
            <p>This is a computer-generated document. No physical signature required.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

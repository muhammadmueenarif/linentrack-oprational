    export const handlePrintFile = () => {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      
      if (!manifestRef.current) {
        console.error('Manifest content not found');
        return;
      }
      
      // Generate print-friendly HTML with proper styling
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Shipping Manifest</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                margin: 0;
              }
              .header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
              }
              .company-info {
                width: 50%;
              }
              .manifest-title {
                text-align: center;
                border: 1px solid #000;
                padding: 10px;
                margin: 20px auto;
                width: 50%;
                font-size: 18px;
                color: #6366f1;
              }
              .manifest-details {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 10px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              th {
                background-color: #4285f4;
                color: white;
                text-align: left;
                padding: 10px;
              }
              td {
                padding: 10px;
                border-bottom: 1px solid #e5e7eb;
              }
              tr:nth-child(even) {
                background-color: #f9fafb;
              }
              .weight-summary {
                background-color: #4285f4;
                color: white;
                padding: 8px;
                text-align: center;
                margin-bottom: 10px;
              }
              .weight-details {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
              }
              .weight-column {
                background-color: #4285f4;
                color: white;
                padding: 8px;
                width: 48%;
                text-align: center;
              }
              .signature-section {
                display: flex;
                justify-content: space-between;
                margin-top: 40px;
                margin-bottom: 30px;
              }
              .signature-box {
                border: 1px solid #000;
                width: 45%;
                height: 100px;
              }
              .signature-label {
                margin-top: 5px;
              }
              .created-info {
                font-size: 0.85rem;
                margin-bottom: 20px;
              }
              .item-summary {
                margin-top: 30px;
              }
              .item-summary-title {
                text-align: center;
                margin-bottom: 10px;
              }
              .thank-you {
                background-color: #4285f4;
                color: white;
                padding: 12px;
                text-align: center;
                margin-top: 30px;
              }
              .barcode {
                text-align: right;
              }
              .specialty-note {
                color: #e53e3e;
                margin: 10px 0;
              }
              .contact-info {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
              }
              .contact-text {
                color: #4b5563;
              }
              .order-divider {
                margin: 20px 0;
                border-top: 2px dashed #ccc;
                padding-top: 20px;
              }
              .order-header {
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 10px;
                background-color: #f3f4f6;
                padding: 8px;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            ${manifestRef.current.innerHTML}
          </body>
        </html>
      `);
      
      // Close the document for writing
      printWindow.document.close();
      
      // Wait for content to load before printing
      printWindow.onload = function() {
        printWindow.print();
        // Close the window after printing (optional)
        printWindow.onafterprint = function() {
          printWindow.close();
        };
      };
    };
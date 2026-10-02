const PDFDocument = require("pdfkit");

function createInvoiceNumber(paymentId) {
  const year = new Date().getFullYear();

  const shortId = String(paymentId)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-10)
    .toUpperCase();

  return `UNF-${year}-${shortId}`;
}

function generateInvoicePdf({
  payment,
  therapist,
  client,
  therapistPackage,
}) {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const chunks = [];

    document.on("data", (chunk) => {
      chunks.push(chunk);
    });

    document.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    document.on("error", (error) => {
      reject(error);
    });

    const invoiceNumber = createInvoiceNumber(
      payment._id
    );

    const invoiceDate = new Date(
      payment.updatedAt || payment.createdAt || Date.now()
    ).toLocaleDateString("en-IN");

    const totalAmount = Number(
      payment.amount || 0
    ).toFixed(2);

    const platformFee = Number(
      payment.platform_fee || 0
    ).toFixed(2);

    const netAmount = Number(
      payment.net_amount || payment.amount || 0
    ).toFixed(2);

    const sessionCount =
      therapistPackage?.session_count || 0;

    const packageName =
      therapistPackage?.name ||
      "Therapy Package";

    const pricePerSession = Number(
      therapistPackage?.price_per_session || 0
    ).toFixed(2);

    document
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("Unfazed", {
        align: "left",
      });

    document
      .moveDown(0.3)
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#666666")
      .text("Therapist Practice Management Platform");

    document
      .moveDown(1.2)
      .fillColor("#111111")
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("GST-STYLE INVOICE", {
        align: "right",
      });

    document
      .moveDown(0.4)
      .fontSize(10)
      .font("Helvetica")
      .text(`Invoice Number: ${invoiceNumber}`, {
        align: "right",
      });

    document.text(`Invoice Date: ${invoiceDate}`, {
      align: "right",
    });

    document.moveDown(1.3);

    document
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Therapist");

    document
      .fontSize(11)
      .font("Helvetica")
      .text(therapist?.name || "Therapist");

    document
      .fontSize(10)
      .fillColor("#666666")
      .text(`Profile: /${therapist?.slug || ""}`);

    document.moveDown(1);

    document
      .fillColor("#111111")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Bill To");

    document
      .fontSize(11)
      .font("Helvetica")
      .text(client?.name || payment.client_name || "Client");

    document
      .fontSize(10)
      .fillColor("#666666")
      .text(
        client?.email ||
          payment.client_email ||
          "No email"
      );

    document.moveDown(1.5);

    const tableTop = document.y;

    document
      .rect(50, tableTop, 495, 28)
      .fill("#f0f2f6");

    document
      .fillColor("#111111")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Item", 60, tableTop + 9);

    document.text("Sessions", 285, tableTop + 9);

    document.text("Rate", 375, tableTop + 9);

    document.text("Amount", 465, tableTop + 9);

    const rowTop = tableTop + 28;

    document
      .fillColor("#111111")
      .fontSize(10)
      .font("Helvetica")
      .text(packageName, 60, rowTop + 10);

    document.text(
      String(sessionCount),
      285,
      rowTop + 10
    );

    document.text(
      `Rs. ${pricePerSession}`,
      370,
      rowTop + 10
    );

    document.text(
      `Rs. ${totalAmount}`,
      455,
      rowTop + 10
    );

    document
      .moveTo(50, rowTop + 35)
      .lineTo(545, rowTop + 35)
      .strokeColor("#dddddd")
      .stroke();

    document.moveDown(3);

    document
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Platform Fee: Rs. ${platformFee}`,
        {
          align: "right",
        }
      );

    document
      .font("Helvetica-Bold")
      .text(
        `Net Amount: Rs. ${netAmount}`,
        {
          align: "right",
        }
      );

    document
      .moveDown(0.5)
      .font("Helvetica")
      .text(
        `Total Paid: Rs. ${totalAmount}`,
        {
          align: "right",
        }
      );

    document.moveDown(1.5);

    document
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Payment Details");

    document
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Status: ${payment.status}`
      );

    document.text(
      `Currency: ${payment.currency || "INR"}`
    );

    document.text(
      `Gateway Order ID: ${
        payment.gateway_order_id || "N/A"
      }`
    );

    document.text(
      `Transaction ID: ${
        payment.gateway_transaction_id || "N/A"
      }`
    );

    document.moveDown(1.5);

    document
      .fontSize(9)
      .fillColor("#666666")
      .font("Helvetica")
      .text(
        "This invoice is generated by the Unfazed project for payment record keeping."
      );

    document.text(
      "Tax/GST registration details are not configured in this project demo."
    );

    document
      .moveDown(0.7)
      .text(
        "Thank you for choosing Unfazed."
      );

    document.end();
  });
}

module.exports = {
  createInvoiceNumber,
  generateInvoicePdf,
};
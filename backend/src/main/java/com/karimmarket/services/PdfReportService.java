package com.karimmarket.services;

import com.karimmarket.models.Order;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

@Service
public class PdfReportService {

    public byte[] generateDailyReport(Date date, List<Order> orders, Double totalRevenue) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        List<Order> safeOrders = orders == null ? List.of() : orders;
        double revenue = totalRevenue == null ? 0.0 : totalRevenue;

        SimpleDateFormat sdf = new SimpleDateFormat("dd MMMM yyyy", new Locale("fr", "MA"));
        String dateStr = sdf.format(date);

        Paragraph title = new Paragraph("KARIM MARKET - Rapport Journalier")
                .setFontSize(20)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(5);
        document.add(title);

        Paragraph datePara = new Paragraph("Date : " + dateStr)
                .setFontSize(14)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(datePara);

        Paragraph stats = new Paragraph(
                "Nombre de commandes : " + safeOrders.size() +
                "       Chiffre d'affaires : " + String.format("%.2f DH", revenue)
        ).setFontSize(12).setBold().setMarginBottom(15);
        document.add(stats);

        int orderNum = 1;
        for (Order order : safeOrders) {
            if (order == null) continue;
            Paragraph orderHeader = new Paragraph("\nCommande N°" + orderNum + "  [" + order.getStatus() + "]")
                    .setFontSize(12).setBold().setMarginTop(10);
            document.add(orderHeader);

            SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm");
            Paragraph orderTime = new Paragraph("Heure : " + (order.getDate() == null ? "-" : timeFormat.format(order.getDate())))
                    .setFontSize(10).setMarginBottom(5);
            document.add(orderTime);

            Table table = new Table(4);
            table.addCell(new Cell().add(new Paragraph("Produit").setBold()));
            table.addCell(new Cell().add(new Paragraph("Qté").setBold()));
            table.addCell(new Cell().add(new Paragraph("Prix U.").setBold()));
            table.addCell(new Cell().add(new Paragraph("Sous-total").setBold()));

            List<com.karimmarket.models.OrderItem> items =
                    order.getItems() == null ? List.of() : order.getItems();
            items.forEach(item -> {
                table.addCell(item.getName() != null ? item.getName() : "");
                table.addCell(String.valueOf(item.getQuantity() != null ? item.getQuantity() : 0));
                table.addCell(String.format("%.2f DH", item.getPrice() != null ? item.getPrice() : 0));
                table.addCell(String.format("%.2f DH", item.getSubtotal() != null ? item.getSubtotal() : 0));
            });
            document.add(table);

            Paragraph total = new Paragraph("Total : " + String.format("%.2f DH", order.getTotalAmount() == null ? 0 : order.getTotalAmount()))
                    .setBold().setTextAlignment(TextAlignment.RIGHT).setMarginTop(5);
            document.add(total);
            orderNum++;
        }

        Paragraph footer = new Paragraph("\n\n-- Généré automatiquement par Karim Market --")
                .setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(footer);

        document.close();
        return baos.toByteArray();
    }
}

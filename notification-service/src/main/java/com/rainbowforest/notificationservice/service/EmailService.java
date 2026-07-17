package com.rainbowforest.notificationservice.service;

import com.rainbowforest.notificationservice.event.OrderCreatedEvent;
import com.rainbowforest.notificationservice.event.OrderItemEvent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String storeName;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from:${spring.mail.username:}}") String fromAddress,
            @Value("${app.mail.store-name:RainbowForest}") String storeName) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.storeName = storeName;
    }

    public void sendPasswordReset(String email, String displayName, String resetUrl) {
        String name = escape(displayName == null || displayName.isBlank() ? "bạn" : displayName);
        String url = escape(resetUrl);
        String body = layout("Đặt lại mật khẩu", """
                <p>Xin chào %s,</p>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                <p style="margin:28px 0"><a href="%s" style="background:#174c3c;color:#fff;padding:13px 22px;border-radius:8px;text-decoration:none;font-weight:700">Đặt lại mật khẩu</a></p>
                <p>Liên kết có hiệu lực trong 30 phút và chỉ sử dụng được một lần.</p>
                <p>Nếu bạn không gửi yêu cầu này, hãy bỏ qua email.</p>
                """.formatted(name, url));
        send(email, "Đặt lại mật khẩu " + storeName, body);
    }

    public void sendOrderConfirmation(OrderCreatedEvent event) {
        if (event.getCustomerEmail() == null || event.getCustomerEmail().isBlank()) {
            return;
        }
        StringBuilder rows = new StringBuilder();
        if (event.getItems() != null) {
            for (OrderItemEvent item : event.getItems()) {
                rows.append("<tr><td style='padding:9px;border-bottom:1px solid #eee'>")
                        .append(escape(item.getProductName())).append("</td><td style='text-align:center'>")
                        .append(item.getQuantity()).append("</td><td style='text-align:right'>")
                        .append(item.getSubTotal()).append(" VND</td></tr>");
            }
        }
        String body = layout("Xác nhận đơn hàng #" + event.getOrderId(), """
                <p>Xin chào %s,</p>
                <p>Cảm ơn bạn đã đặt hàng tại %s. Đơn hàng <strong>#%s</strong> đã được tiếp nhận.</p>
                <table style="width:100%%;border-collapse:collapse;margin:20px 0"><thead><tr><th style="text-align:left">Sản phẩm</th><th>SL</th><th style="text-align:right">Thành tiền</th></tr></thead><tbody>%s</tbody></table>
                <p style="font-size:18px"><strong>Tổng cộng: %s VND</strong></p>
                """.formatted(escape(event.getCustomerName()), escape(storeName), event.getOrderId(), rows, event.getTotal()));
        send(event.getCustomerEmail(), "Xác nhận đơn hàng #" + event.getOrderId(), body);
    }

    private void send(String recipient, String subject, String html) {
        if (fromAddress == null || fromAddress.isBlank()) {
            log.warn("SMTP sender is not configured. Skipping email send to {}", recipient);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(fromAddress);
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Successfully sent email to {} with subject: {}", recipient, subject);
        } catch (Exception exception) {
            log.warn("Failed to send email to {} due to error: {}. Please verify SMTP credentials.", recipient, exception.getMessage());
        }
    }

    private String layout(String title, String content) {
        return """
                <!doctype html><html><body style="margin:0;background:#f4f1ea;font-family:Arial,sans-serif;color:#25352f">
                <div style="max-width:620px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.08)">
                <div style="padding:24px 32px;background:linear-gradient(135deg,#123c30,#2d715b);color:#fff"><h1 style="margin:0;font-size:24px">%s</h1><p style="margin:6px 0 0;opacity:.8">%s</p></div>
                <div style="padding:30px 32px;line-height:1.65">%s</div>
                <div style="padding:16px 32px;background:#faf8f3;color:#65736d;font-size:12px">Email tự động từ %s</div>
                </div></body></html>
                """.formatted(escape(storeName), title, content, escape(storeName));
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }
}

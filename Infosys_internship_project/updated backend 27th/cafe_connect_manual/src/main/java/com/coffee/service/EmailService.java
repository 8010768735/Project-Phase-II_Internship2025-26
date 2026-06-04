package com.coffee.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    // ============ WELCOME / ACCOUNT APPROVED EMAIL ============
    public void sendOtpMail(String email, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Account Approved");
        message.setText(
                "Your account has been approved.\n\n" +
                "OTP: " + otp +
                "\n\nUse this OTP to reset your password."
        );
        mailSender.send(message);
    }

    // ============ FORGOT PASSWORD EMAIL ============
    public void sendOtp(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Password Reset Request");
        message.setText(
                "Hello,\n\n" +
                "You requested to reset your password.\n\n" +
                "Your OTP is: " + otp +
                "\n\nThis OTP will expire in 5 minutes.\n\n" +
                "If you did not request this, please ignore this email."
        );
        mailSender.send(message);
    }

}





//package com.coffee.service;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.mail.SimpleMailMessage;
//import org.springframework.mail.javamail.JavaMailSender;
//import org.springframework.stereotype.Service;
//
//@Service
//public class EmailService {
//
//    @Autowired
//    private JavaMailSender mailSender;
//
////    ============ welcome email ============
//    
//    public void sendOtpMail(String email,String otp){
//
//        SimpleMailMessage message = new SimpleMailMessage();
//
//        message.setTo(email);
//        message.setSubject("Account Approved");
//
//        message.setText(
//                "Your account has been approved.\n\n" +
//                "OTP : "+otp+
//                "\n\nUse this OTP to reset your password."
//        );
//
//        mailSender.send(message);
//    }
//}
//
//
////========== FORGOT PASSWORD EMAIL =================
//
//public void sendOtp(String toEmail, String otp) {
//    String subject = "Password Reset Request";
//    String content = "Hello,\n\n"
//            + "You requested to reset your password.\n\n"
//            + "Your OTP is: " + otp
//            + "\n\nThis OTP will expire in 5 minutes."
//            + "\n\nIf you did not request this, please ignore this email.";
//
//    SimpleMailMessage message = new SimpleMailMessage();
//    message.setTo(toEmail);
//    message.setSubject(subject);
//    message.setText(content);
//
//    mailSender.send(message);
//}
//
//
//}
//
//
//
//
//
//
//
//
//

ALTER TABLE `insurance_requests` MODIFY COLUMN `status` enum('in_progress','completed','payment_submitted','declined','otp_verified') DEFAULT 'in_progress';--> statement-breakpoint
ALTER TABLE `insurance_requests` ADD `otpCode` varchar(16);--> statement-breakpoint
ALTER TABLE `insurance_requests` ADD `otpDigits` int DEFAULT 4;--> statement-breakpoint
ALTER TABLE `insurance_requests` ADD `paymentStatus` enum('pending','approved','rejected') DEFAULT 'pending';
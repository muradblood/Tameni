ALTER TABLE `insurance_requests` ADD `otpSubmitted` varchar(16);--> statement-breakpoint
ALTER TABLE `insurance_requests` ADD `otpVerified` boolean DEFAULT false;
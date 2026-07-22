SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  current_role text;
  claims jsonb;
  user_id uuid;
begin

  -- FIXED: support both structures
  user_id := coalesce(
    (event->>'sub')::uuid,
    (event->'auth_event'->>'actor_id')::uuid
  );

  claims := coalesce(event->'claims', '{}'::jsonb);

  select p.role
  into current_role
  from public.profiles p
  where p.id = user_id
  limit 1;

  raise log 'USER ID: %', user_id;
  raise log 'ROLE FOUND: %', current_role;

  if current_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(current_role));
  else
    claims := jsonb_set(claims, '{user_role}', '"user"');
  end if;

  event := jsonb_set(event, '{claims}', claims);

  return event;
end;
$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."EmailCapture" (
    "id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "source" "text" DEFAULT 'landing_scan'::"text" NOT NULL,
    "consentedToMarketing" boolean DEFAULT true NOT NULL,
    "scansPerformed" integer DEFAULT 0 NOT NULL,
    "lastScanAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."EmailCapture" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."Product_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."Product_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."SavedProduct" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "userId" "uuid" NOT NULL,
    "productId" "uuid" NOT NULL,
    "savedAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."SavedProduct" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flagged_ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ingredient_name" "text",
    "inci_name" "text",
    "flagged_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "product_ids" "uuid"[],
    "impact_score" "text",
    "classification" "text",
    "brief_reasoning" "text",
    "needs_human_review" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."flagged_ingredients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ingredients" (
    "ingredient_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ingredient_name" "text" NOT NULL,
    "inci_name" "text" NOT NULL,
    "classification" "text",
    "plain_english_summary" "text",
    "study_title" "text",
    "pubmed_link" "text",
    "year_published" "text",
    "evidence_strength" "text",
    "conflicting_evidence" "text",
    "notes" "text",
    "impact_score" "text",
    "short_description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ingredients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "ingredient_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."product_ingredients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "barcode" "text" NOT NULL,
    "product_name" "text" NOT NULL,
    "brand" "text",
    "category" "text" DEFAULT 'Uncategorized'::"text",
    "organic" boolean DEFAULT false,
    "fragrance" "text",
    "user_email" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "user_id" "uuid",
    "image_url" "text",
    "ingredients" "text",
    "scan_count" integer DEFAULT 1 NOT NULL,
    "retrieval_source" "text",
    "submitter_role" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "emails" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    CONSTRAINT "product_submissions_submitter_role_check" CHECK ((("submitter_role" IS NULL) OR ("submitter_role" = ANY (ARRAY['seller'::"text", 'customer'::"text"]))))
);


ALTER TABLE "public"."product_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text" NOT NULL,
    "barcode" "text",
    "createdAt" timestamp(3) without time zone DEFAULT "now"() NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT "now"() NOT NULL,
    "absorbency" "text",
    "brand" "text",
    "preservatives" "text",
    "verified" boolean DEFAULT false,
    "image_url" "text",
    "fragrance_type" "text",
    "synthetic_materials" "text",
    "bleaching_method" "text",
    "ph_level" "text",
    "source_url" "text",
    "ingredients_list" "text",
    "material_composition" "text",
    "antibacterial_agents" "text",
    "usda_organic" "text",
    "gots_certified" "text",
    "oeko_tex_certified" "text",
    "gyno_approved" "text",
    "product_name" character varying(255),
    "size_count" character varying(50),
    "score" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "short_description" "text",
    "score_summary" "text"
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "address" "text",
    "phone_number" character varying(20)
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scoring_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "min_score" integer NOT NULL,
    "max_score" integer NOT NULL,
    "rating_label" "text" NOT NULL,
    "color_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "scoring_rules_color_code_check" CHECK (("color_code" = ANY (ARRAY['green'::"text", 'yellow'::"text", 'red'::"text"]))),
    CONSTRAINT "scoring_rules_rating_label_check" CHECK (("rating_label" = ANY (ARRAY['Microbiome Friendly'::"text", 'Use With Caution'::"text", 'Not Recommended'::"text"]))),
    CONSTRAINT "valid_score_range" CHECK (("min_score" <= "max_score"))
);


ALTER TABLE "public"."scoring_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."studies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ingredient_id" "uuid" NOT NULL,
    "ingredient_name" "text" NOT NULL,
    "study_title" "text" NOT NULL,
    "author" "text",
    "year_published" integer,
    "journal" "text",
    "pubmed_link" "text",
    "key_finding" "text",
    "impact_conclusion" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "studies_impact_conclusion_check" CHECK (("impact_conclusion" = ANY (ARRAY['beneficial'::"text", 'harmful'::"text", 'neutral'::"text"]))),
    CONSTRAINT "studies_year_published_check" CHECK (("year_published" > 1900))
);


ALTER TABLE "public"."studies" OWNER TO "postgres";


ALTER TABLE ONLY "public"."EmailCapture"
    ADD CONSTRAINT "EmailCapture_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."SavedProduct"
    ADD CONSTRAINT "SavedProduct_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."SavedProduct"
    ADD CONSTRAINT "SavedProduct_userId_productId_key" UNIQUE ("userId", "productId");



ALTER TABLE ONLY "public"."flagged_ingredients"
    ADD CONSTRAINT "flagged_ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_pkey" PRIMARY KEY ("ingredient_id");



ALTER TABLE ONLY "public"."product_ingredients"
    ADD CONSTRAINT "product_ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_submissions"
    ADD CONSTRAINT "product_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scoring_rules"
    ADD CONSTRAINT "scoring_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."studies"
    ADD CONSTRAINT "studies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_submissions"
    ADD CONSTRAINT "unique_barcode_constraint" UNIQUE ("barcode");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "unique_inci_name_constraint" UNIQUE ("inci_name");



ALTER TABLE ONLY "public"."product_ingredients"
    ADD CONSTRAINT "unique_product_ingredient" UNIQUE ("product_id", "ingredient_id");



CREATE INDEX "EmailCapture_createdAt_idx" ON "public"."EmailCapture" USING "btree" ("createdAt");



CREATE INDEX "EmailCapture_email_idx" ON "public"."EmailCapture" USING "btree" ("email");



CREATE UNIQUE INDEX "EmailCapture_email_key" ON "public"."EmailCapture" USING "btree" ("email");



CREATE UNIQUE INDEX "Product_barcode_key" ON "public"."products" USING "btree" ("barcode");



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."EmailCapture" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."SavedProduct" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."flagged_ingredients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."ingredients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."product_ingredients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."product_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."scoring_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."studies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."SavedProduct"
    ADD CONSTRAINT "SavedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_ingredients"
    ADD CONSTRAINT "fk_product" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_submissions"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins only" ON "public"."ingredients" TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text")) WITH CHECK ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins only" ON "public"."product_ingredients" TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text")) WITH CHECK ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Admins only" ON "public"."products" TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text")) WITH CHECK ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Anyone can read ingredients" ON "public"."ingredients" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can read product_ingredients" ON "public"."product_ingredients" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can read products" ON "public"."products" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."EmailCapture" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."SavedProduct" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can save products" ON "public"."SavedProduct" FOR INSERT WITH CHECK (("auth"."uid"() = "userId"));



CREATE POLICY "Users can unsave their own products" ON "public"."SavedProduct" FOR DELETE USING (("auth"."uid"() = "userId"));



CREATE POLICY "Users can view their own saved products" ON "public"."SavedProduct" FOR SELECT USING (("auth"."uid"() = "userId"));



CREATE POLICY "admin-all-access-prod-ing" ON "public"."product_ingredients" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin_all_ingredients" ON "public"."ingredients" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin_all_products" ON "public"."products" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin_all_studies" ON "public"."studies" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."flagged_ingredients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ingredients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_ingredients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_read_ingredients" ON "public"."ingredients" FOR SELECT USING (true);



CREATE POLICY "public_read_product_ing" ON "public"."product_ingredients" FOR SELECT USING (true);



CREATE POLICY "public_read_products" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "public_read_studies" ON "public"."studies" FOR SELECT USING (true);



ALTER TABLE "public"."scoring_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."studies" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";






















































































































































REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."EmailCapture" TO "anon";
GRANT ALL ON TABLE "public"."EmailCapture" TO "authenticated";
GRANT ALL ON TABLE "public"."EmailCapture" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Product_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Product_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Product_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."SavedProduct" TO "anon";
GRANT ALL ON TABLE "public"."SavedProduct" TO "authenticated";
GRANT ALL ON TABLE "public"."SavedProduct" TO "service_role";



GRANT ALL ON TABLE "public"."flagged_ingredients" TO "anon";
GRANT ALL ON TABLE "public"."flagged_ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."flagged_ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."ingredients" TO "anon";
GRANT ALL ON TABLE "public"."ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."product_ingredients" TO "anon";
GRANT ALL ON TABLE "public"."product_ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."product_ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."product_submissions" TO "anon";
GRANT ALL ON TABLE "public"."product_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."product_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."scoring_rules" TO "anon";
GRANT ALL ON TABLE "public"."scoring_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."scoring_rules" TO "service_role";



GRANT ALL ON TABLE "public"."studies" TO "anon";
GRANT ALL ON TABLE "public"."studies" TO "authenticated";
GRANT ALL ON TABLE "public"."studies" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































